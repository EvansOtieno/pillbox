-- Afya Corner: business rules that must not be bypassed, as SQL functions.
--
-- place_order() is the only way to create an order (anon has no INSERT on orders). It runs as
-- SECURITY DEFINER, like a PL/SQL package with definer rights granted EXECUTE to the public role:
-- it recalculates every price from the products table and rejects anything the rules forbid.
--
-- Errors are raised with SQLSTATE P0001 and a machine-readable MESSAGE (e.g. 'prescription_only');
-- DETAIL is a human sentence, HINT carries data for the UI (e.g. the product id). PostgREST returns
-- them as { code, message, details, hint } and the Server Action maps message → friendly text.

-- ---------------------------------------------------------------- phone numbers

-- Kenyan mobile → international digits: 0712 345 678 / +254 712 345 678 / 712345678 → 254712345678.
-- Returns null when invalid. Same rules as src/lib/domain/contact.ts normaliseMsisdn().
create function public.normalise_msisdn(p_number text) returns text
language plpgsql immutable
set search_path = ''
as $$
declare
  v_digits text := regexp_replace(coalesce(p_number, ''), '\D', '', 'g');
begin
  if v_digits ~ '^0[17][0-9]{8}$' then
    return '254' || substr(v_digits, 2);
  elsif v_digits ~ '^[17][0-9]{8}$' then
    return '254' || v_digits;
  elsif v_digits ~ '^254[17][0-9]{8}$' then
    return v_digits;
  end if;
  return null;
end;
$$;

-- ---------------------------------------------------------------- place_order

create function public.place_order(
  p_customer_name    text,
  p_phone            text,
  p_email            text,
  p_delivery_area_id int,
  p_address          text,
  p_notes            text,
  p_items            jsonb -- [{ "product_id": 12, "qty": 2, "unit_price_kes": 450 }, …] in cart order
) returns table (order_id uuid, order_number int, public_token uuid)
language plpgsql security definer
set search_path = ''
as $$
declare
  v_name        text := trim(coalesce(p_customer_name, ''));
  v_phone       text := public.normalise_msisdn(p_phone);
  v_email       text := nullif(lower(trim(coalesce(p_email, ''))), '');
  v_address     text := nullif(trim(coalesce(p_address, '')), '');
  v_notes       text := nullif(trim(coalesce(p_notes, '')), '');
  v_area        public.delivery_areas%rowtype;
  v_line        record;
  v_items_total int := 0;
  v_order       public.orders%rowtype;
begin
  -- Customer details
  if length(v_name) not between 2 and 100 then
    raise exception using errcode = 'P0001', message = 'invalid_name', detail = 'Please enter your name.';
  end if;
  if v_phone is null then
    raise exception using errcode = 'P0001', message = 'invalid_phone',
      detail = 'Please enter a Kenyan mobile number, e.g. 0712 345 678.';
  end if;
  if v_email is not null and (length(v_email) > 200 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$') then
    raise exception using errcode = 'P0001', message = 'invalid_email', detail = 'Please enter a valid email address.';
  end if;
  if length(coalesce(v_address, '')) > 300 or length(coalesce(v_notes, '')) > 500 then
    raise exception using errcode = 'P0001', message = 'text_too_long', detail = 'Address or notes are too long.';
  end if;

  -- Delivery or pick-up (the area decides which)
  select * into v_area from public.delivery_areas where id = p_delivery_area_id and active;
  if not found then
    raise exception using errcode = 'P0001', message = 'unknown_area', detail = 'Please choose a delivery area or pick-up.';
  end if;
  if v_area.is_pickup then
    v_address := null;
  elsif v_address is null then
    raise exception using errcode = 'P0001', message = 'address_required',
      detail = 'Please enter a delivery address, or choose pick-up.';
  end if;

  -- Basket shape
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception using errcode = 'P0001', message = 'empty_cart', detail = 'Your cart is empty.';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception using errcode = 'P0001', message = 'too_many_lines', detail = 'Please order at most 50 different items.';
  end if;

  -- Every line against the live catalogue. Duplicate product lines are merged.
  for v_line in
    select x.product_id,
           sum(x.qty)::int         as qty,
           min(x.unit_price_kes)   as min_price,
           max(x.unit_price_kes)   as max_price,
           bool_or(x.qty is null or x.qty not between 1 and 99) as bad_qty,
           p.id as found_id, p.name, p.published, p.rx_class, p.in_stock, p.price_kes
    from jsonb_to_recordset(p_items) as x (product_id int, qty int, unit_price_kes int)
    left join public.products p on p.id = x.product_id
    group by x.product_id, p.id
  loop
    if v_line.found_id is null or not v_line.published then
      raise exception using errcode = 'P0001', message = 'product_unavailable',
        detail = 'An item in your cart is no longer available.', hint = coalesce(v_line.product_id::text, '');
    end if;
    if v_line.bad_qty or v_line.qty > 99 then
      raise exception using errcode = 'P0001', message = 'invalid_qty',
        detail = format('Please choose between 1 and 99 of %s.', v_line.name), hint = v_line.product_id::text;
    end if;
    if v_line.rx_class = 'prescription_only' then
      raise exception using errcode = 'P0001', message = 'prescription_only',
        detail = format('%s needs a prescription. Please consult our pharmacist.', v_line.name), hint = v_line.product_id::text;
    end if;
    if not v_line.in_stock then
      raise exception using errcode = 'P0001', message = 'out_of_stock',
        detail = format('%s is out of stock.', v_line.name), hint = v_line.product_id::text;
    end if;
    -- The browser's price must match today's price: catches stale carts and tampering alike.
    if v_line.min_price is distinct from v_line.price_kes or v_line.max_price is distinct from v_line.price_kes then
      raise exception using errcode = 'P0001', message = 'price_changed',
        detail = format('The price of %s is now KES %s.', v_line.name, v_line.price_kes),
        hint = json_build_object('product_id', v_line.product_id, 'price_kes', v_line.price_kes)::text;
    end if;
    v_items_total := v_items_total + v_line.price_kes * v_line.qty;
  end loop;

  insert into public.orders (customer_name, phone, email, fulfilment, delivery_area_id, delivery_area,
                             delivery_fee_kes, address, notes, items_total_kes, total_kes)
  values (v_name, v_phone, v_email,
          case when v_area.is_pickup then 'pickup'::public.fulfilment else 'delivery'::public.fulfilment end,
          v_area.id, v_area.name, v_area.fee_kes, v_address, v_notes, v_items_total, v_items_total + v_area.fee_kes)
  returning * into v_order;

  -- Snapshot the lines in cart order (first occurrence wins when a product was listed twice).
  insert into public.order_items (order_id, line_no, product_id, sku, name, rx_class, unit_price_kes, qty, line_total_kes)
  select v_order.id, row_number() over (order by l.first_pos), p.id, p.sku, p.name, p.rx_class,
         p.price_kes, l.qty, p.price_kes * l.qty
  from (
    select (e.item ->> 'product_id')::int as product_id, sum((e.item ->> 'qty')::int)::int as qty, min(e.pos) as first_pos
    from jsonb_array_elements(p_items) with ordinality as e (item, pos)
    group by 1
  ) l
  join public.products p on p.id = l.product_id;

  return query select v_order.id, v_order.number, v_order.public_token;
end;
$$;

-- ---------------------------------------------------------------- order_by_token

-- The customer's confirmation page. Knowing the unguessable token is the permission.
create function public.order_by_token(p_token uuid) returns jsonb
language sql stable security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'number', o.number,
    'status', o.status,
    'customer_name', o.customer_name,
    'phone', o.phone,
    'email', o.email,
    'fulfilment', o.fulfilment,
    'delivery_area', o.delivery_area,
    'delivery_fee_kes', o.delivery_fee_kes,
    'address', o.address,
    'notes', o.notes,
    'items_total_kes', o.items_total_kes,
    'total_kes', o.total_kes,
    'created_at', o.created_at,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
               'sku', i.sku, 'name', i.name, 'rx_class', i.rx_class,
               'unit_price_kes', i.unit_price_kes, 'qty', i.qty, 'line_total_kes', i.line_total_kes
             ) order by i.line_no)
      from public.order_items i where i.order_id = o.id
    ), '[]'::jsonb)
  )
  from public.orders o
  where o.public_token = p_token;
$$;

-- ---------------------------------------------------------------- search_products

-- Storefront search: prefix full-text match ("parac" finds Paracetamol) plus trigram fuzzy match on
-- the best-matching word of the name for typos ("paracetmol"); word_similarity, not similarity, so long
-- product names don't dilute the score. SECURITY INVOKER (the default), so RLS still hides unpublished rows.
create function public.search_products(p_query text, p_limit int default 48)
returns setof public.products
language sql stable
set search_path = ''
as $$
  with q as (
    select trim(coalesce(p_query, '')) as raw,
           (select string_agg(w || ':*', ' & ')
              from regexp_split_to_table(lower(regexp_replace(coalesce(p_query, ''), '[^[:alnum:][:space:]]', ' ', 'g')), '\s+') as w
             where w <> '') as prefix
  )
  select p.*
  from public.products p, q
  where q.prefix is not null
    and p.published
    and (p.search @@ to_tsquery('english', q.prefix)
         or extensions.word_similarity(q.raw, p.name) > 0.5)
  order by ts_rank(p.search, to_tsquery('english', q.prefix)) desc,
           extensions.word_similarity(q.raw, p.name) desc,
           p.name
  limit least(greatest(coalesce(p_limit, 48), 1), 100);
$$;

-- ---------------------------------------------------------------- who may call what

revoke execute on function public.normalise_msisdn(text) from public;
revoke execute on function public.place_order(text, text, text, int, text, text, jsonb) from public;
revoke execute on function public.order_by_token(uuid) from public;
revoke execute on function public.search_products(text, int) from public;

grant execute on function public.normalise_msisdn(text) to anon, authenticated;
grant execute on function public.place_order(text, text, text, int, text, text, jsonb) to anon, authenticated;
grant execute on function public.order_by_token(uuid) to anon, authenticated;
grant execute on function public.search_products(text, int) to anon, authenticated;
