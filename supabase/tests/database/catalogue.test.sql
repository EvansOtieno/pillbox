-- Search and who may edit what. Run: pnpm test:db (needs the seed data).
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000b001', 'staff@example.com'),
  ('00000000-0000-0000-0000-00000000b002', 'owner@example.com');
insert into public.profiles (id, role) values
  ('00000000-0000-0000-0000-00000000b001', 'staff'),
  ('00000000-0000-0000-0000-00000000b002', 'owner');

-- ---------------------------------------------------------------- search, as a visitor

set local role anon;

select ok((select bool_and(name ilike '%paracetamol%') from (select name from public.search_products('paracetamol') limit 6) top),
  'full-text search ranks name matches first');
select ok(exists (select 1 from public.search_products('parac') where name ilike 'paracetamol%'),
  'prefix search: "parac" finds Paracetamol');
select ok(exists (select 1 from public.search_products('paracetmol') where name ilike 'paracetamol%'),
  'typo search: "paracetmol" finds Paracetamol');
select is((select count(*)::int from public.search_products('   ')), 0, 'empty search returns nothing');
select is((select count(*)::int from public.search_products('vitamin', 5)), 5, 'search respects the limit');
select throws_ok($$insert into public.settings (key, value) values ('x', '1')$$, '42501', null,
  'visitors cannot write settings');

-- ---------------------------------------------------------------- staff

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000b001", "role": "authenticated"}';

select lives_ok($$update public.products set price_kes = price_kes + 10 where sku = 'AC-00001'$$,
  'staff can change prices');
select is((select count(*)::int from public.products where sku = 'AC-00001' and published), 1,
  'staff see products');
-- RLS filters silently: the update runs but matches no rows.
update public.settings set value = '"Hacked"' where key = 'store_name';
select is((select value #>> '{}' from public.settings where key = 'store_name'), 'Afya Corner',
  'staff cannot change settings (owner only)');
update public.profiles set role = 'owner' where id = '00000000-0000-0000-0000-00000000b001';
select is((select role::text from public.profiles where id = '00000000-0000-0000-0000-00000000b001'), 'staff',
  'staff cannot promote themselves');

-- ---------------------------------------------------------------- owner

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000b002", "role": "authenticated"}';

update public.settings set value = '"Afya Corner Test"' where key = 'store_name';
select is((select value #>> '{}' from public.settings where key = 'store_name'), 'Afya Corner Test',
  'owner can change settings');

select * from finish();
rollback;
