-- place_order() rules and order privacy. Run: pnpm test:db (needs the seed data).
-- Everything runs in one transaction that is rolled back, so the database is unchanged afterwards.
begin;
create extension if not exists pgtap with schema extensions;
select plan(27);

-- ---------------------------------------------------------------- fixtures (as the postgres superuser)

select id as gen_id, price_kes as gen_price from public.products
 where rx_class = 'general' and in_stock and published order by id limit 1 \gset
select id as gen2_id, price_kes as gen2_price from public.products
 where rx_class = 'general' and in_stock and published order by id offset 1 limit 1 \gset
select id as p_id, price_kes as p_price from public.products
 where rx_class = 'pharmacy_only' and in_stock order by id limit 1 \gset
select id as rx_id, price_kes as rx_price from public.products
 where rx_class = 'prescription_only' order by id limit 1 \gset
select id as oos_id, price_kes as oos_price from public.products
 where rx_class = 'general' and not in_stock order by id limit 1 \gset
select id as area_id, fee_kes as area_fee from public.delivery_areas where name = 'Kilimani' \gset
select id as pickup_id from public.delivery_areas where is_pickup limit 1 \gset

-- A hidden (unpublished) product
update public.products set published = false where id = :gen2_id;

-- ---------------------------------------------------------------- as an anonymous visitor

set local role anon;

select throws_ok('select * from public.orders', '42501', null, 'anon cannot read orders');
select throws_ok('select * from public.order_items', '42501', null, 'anon cannot read order items');
select throws_ok(
  $$insert into public.orders (customer_name, phone, fulfilment, delivery_area, delivery_fee_kes, items_total_kes, total_kes)
    values ('x', '254712345678', 'pickup', 'x', 0, 0, 0)$$,
  '42501', null, 'anon cannot insert orders directly');
select throws_ok(format('update public.products set price_kes = 1 where id = %s', :gen_id),
  '42501', null, 'anon cannot change prices');
select is((select count(*)::int from public.products where id = :gen2_id), 0, 'anon cannot see unpublished products');

-- Happy path: 2 x general + 1 x pharmacy-only, delivered to Kilimani
select lives_ok(format($$
  create temp table placed as
  select * from public.place_order('Test Customer', '0712 345 678', 'Test@Example.com', %s, 'Kindaruma Rd, Apt 4', 'Ring twice',
    '[{"product_id": %s, "qty": 1, "unit_price_kes": %s}, {"product_id": %s, "qty": 1, "unit_price_kes": %s},
      {"product_id": %s, "qty": 1, "unit_price_kes": %s}]')$$,
  :area_id, :gen_id, :gen_price, :p_id, :p_price, :gen_id, :gen_price), 'valid order is accepted');

select isnt((select order_number from placed), null, 'order gets a number');
select public_token as placed_token from placed \gset

-- Customer confirmation page via the token
select is((public.order_by_token((select public_token from placed)) ->> 'total_kes')::int,
  :gen_price * 2 + :p_price + :area_fee, 'total = items recalculated from the database + delivery fee');
select is((public.order_by_token((select public_token from placed)) ->> 'phone'), '254712345678', 'phone stored normalised');
select is(jsonb_array_length(public.order_by_token((select public_token from placed)) -> 'items'), 2,
  'duplicate product lines are merged');
select is((public.order_by_token((select public_token from placed)) -> 'items' -> 0 ->> 'qty')::int, 2,
  'merged line keeps cart order and adds quantities');
select is(public.order_by_token(gen_random_uuid()), null, 'unknown token finds nothing');

-- Rules that must hold whatever the browser sends
select throws_ok(format($$select * from public.place_order('Test', '0712345678', null, %s, 'x', null,
    '[{"product_id": %s, "qty": 1, "unit_price_kes": %s}]')$$, :area_id, :rx_id, :rx_price),
  'P0001', 'prescription_only', 'prescription-only medicine rejected');
select throws_ok(format($$select * from public.place_order('Test', '0712345678', null, %s, 'x', null,
    '[{"product_id": %s, "qty": 1, "unit_price_kes": %s}]')$$, :area_id, :oos_id, :oos_price),
  'P0001', 'out_of_stock', 'out-of-stock product rejected');
select throws_ok(format($$select * from public.place_order('Test', '0712345678', null, %s, 'x', null,
    '[{"product_id": %s, "qty": 1, "unit_price_kes": 1}]')$$, :area_id, :gen_id),
  'P0001', 'price_changed', 'tampered price rejected');
select throws_ok(format($$select * from public.place_order('Test', '0712345678', null, %s, 'x', null,
    '[{"product_id": %s, "qty": 1, "unit_price_kes": %s}]')$$, :area_id, :gen2_id, :gen2_price),
  'P0001', 'product_unavailable', 'unpublished product rejected');
select throws_ok(format($$select * from public.place_order('Test', '0712345678', null, %s, 'x', null,
    '[{"product_id": %s, "qty": 0, "unit_price_kes": %s}]')$$, :area_id, :gen_id, :gen_price),
  'P0001', 'invalid_qty', 'zero quantity rejected');
select throws_ok(format($$select * from public.place_order('Test', '12345', null, %s, 'x', null,
    '[{"product_id": %s, "qty": 1, "unit_price_kes": %s}]')$$, :area_id, :gen_id, :gen_price),
  'P0001', 'invalid_phone', 'non-Kenyan phone rejected');
select throws_ok(format($$select * from public.place_order('Test', '0712345678', null, %s, '  ', null,
    '[{"product_id": %s, "qty": 1, "unit_price_kes": %s}]')$$, :area_id, :gen_id, :gen_price),
  'P0001', 'address_required', 'delivery without address rejected');
select throws_ok($$select * from public.place_order('Test', '0712345678', null, 99999, 'x', null, '[]')$$,
  'P0001', 'unknown_area', 'unknown delivery area rejected');
select lives_ok(format($$select * from public.place_order('Test', '0712345678', null, %s, null, null,
    '[{"product_id": %s, "qty": 1, "unit_price_kes": %s}]')$$, :pickup_id, :gen_id, :gen_price),
  'pick-up without address accepted');

-- ---------------------------------------------------------------- as a signed-in user who is not staff

reset role;
insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000a001', 'visitor@example.com');
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000a001", "role": "authenticated"}';
select is((select count(*)::int from public.orders), 0, 'signed-in non-staff user sees no orders');

-- ---------------------------------------------------------------- as staff

reset role;
insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000a002', 'staff@example.com');
insert into public.profiles (id, role, full_name) values ('00000000-0000-0000-0000-00000000a002', 'staff', 'Test Staff');
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000a002", "role": "authenticated"}';

select ok((select count(*) from public.orders) >= 2, 'staff can read orders');
select throws_ok('update public.orders set total_kes = 1', '42501', null, 'staff cannot change order amounts');

-- Status workflow (trigger): new → confirmed → completed, no skipping, no going back
select throws_ok(format('update public.orders set status = ''completed'' where public_token = %L', :'placed_token'),
  'P0001', 'invalid_status_change', 'a new order cannot jump straight to completed');
select lives_ok(format('update public.orders set status = ''confirmed'' where public_token = %L', :'placed_token'),
  'a new order can be confirmed');
select throws_ok(format('update public.orders set status = ''new'' where public_token = %L', :'placed_token'),
  'P0001', 'invalid_status_change', 'a confirmed order cannot go back to new');

select * from finish();
rollback;
