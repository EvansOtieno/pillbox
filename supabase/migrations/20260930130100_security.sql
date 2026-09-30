-- Afya Corner: who may read and write what (Row Level Security).
--
-- Roles as Supabase sees them:
--   anon          = any visitor (the publishable key, no login)
--   authenticated = a signed-in user; only staff sign in, and profiles.role says owner or staff
-- RLS policies are predicates Postgres adds to every query, like Oracle VPD.
-- Table grants say which statements a role may run at all; policies then filter the rows.

-- ---------------------------------------------------------------- role helpers

-- SECURITY DEFINER so the check can read profiles regardless of the caller's own RLS on that table.
create function public.is_staff() returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('owner', 'staff')
  );
$$;

create function public.is_owner() returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'owner'
  );
$$;

revoke execute on function public.is_staff(), public.is_owner() from public;
grant execute on function public.is_staff(), public.is_owner() to anon, authenticated;

-- ---------------------------------------------------------------- start from nothing

alter table public.profiles       enable row level security;
alter table public.categories     enable row level security;
alter table public.products       enable row level security;
alter table public.delivery_areas enable row level security;
alter table public.settings       enable row level security;
alter table public.faqs           enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;

revoke all on public.profiles, public.categories, public.products, public.delivery_areas,
  public.settings, public.faqs, public.orders, public.order_items from anon, authenticated;

-- ---------------------------------------------------------------- public storefront data (read-only)

grant select on public.categories, public.products, public.delivery_areas, public.settings, public.faqs
  to anon, authenticated;

create policy "categories are public" on public.categories
  for select using (true);

create policy "published products are public" on public.products
  for select using (published or (select public.is_staff()));

create policy "active delivery areas are public" on public.delivery_areas
  for select using (active or (select public.is_staff()));

create policy "settings are public" on public.settings
  for select using (true);

create policy "faqs are public" on public.faqs
  for select using (true);

-- ---------------------------------------------------------------- staff: catalogue and FAQs

grant insert, update, delete on public.categories, public.products, public.faqs to authenticated;

create policy "staff insert categories" on public.categories for insert to authenticated
  with check ((select public.is_staff()));
create policy "staff update categories" on public.categories for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "owner deletes categories" on public.categories for delete to authenticated
  using ((select public.is_owner()));

create policy "staff insert products" on public.products for insert to authenticated
  with check ((select public.is_staff()));
create policy "staff update products" on public.products for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "owner deletes products" on public.products for delete to authenticated
  using ((select public.is_owner()));

create policy "staff insert faqs" on public.faqs for insert to authenticated
  with check ((select public.is_staff()));
create policy "staff update faqs" on public.faqs for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "staff delete faqs" on public.faqs for delete to authenticated
  using ((select public.is_staff()));

-- ---------------------------------------------------------------- owner: settings, delivery areas, staff

grant insert, update, delete on public.settings, public.delivery_areas to authenticated;

create policy "owner insert settings" on public.settings for insert to authenticated
  with check ((select public.is_owner()));
create policy "owner update settings" on public.settings for update to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));
create policy "owner delete settings" on public.settings for delete to authenticated
  using ((select public.is_owner()));

create policy "owner insert delivery areas" on public.delivery_areas for insert to authenticated
  with check ((select public.is_owner()));
create policy "owner update delivery areas" on public.delivery_areas for update to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));
create policy "owner delete delivery areas" on public.delivery_areas for delete to authenticated
  using ((select public.is_owner()));

grant select, insert, update, delete on public.profiles to authenticated;

create policy "read own profile, owner reads all" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_owner()));
create policy "owner adds staff" on public.profiles for insert to authenticated
  with check ((select public.is_owner()));
create policy "owner updates staff" on public.profiles for update to authenticated
  using ((select public.is_owner())) with check ((select public.is_owner()));
create policy "owner removes staff" on public.profiles for delete to authenticated
  using ((select public.is_owner()) and id <> (select auth.uid()));

-- ---------------------------------------------------------------- orders: no public access at all

-- Customers create orders only through place_order() and read them only through order_by_token().
-- Staff can read orders and change their status; nobody can edit amounts or items after the fact.
grant select on public.orders, public.order_items to authenticated;
grant update (status) on public.orders to authenticated;

create policy "staff read orders" on public.orders for select to authenticated
  using ((select public.is_staff()));
create policy "staff update order status" on public.orders for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "staff read order items" on public.order_items for select to authenticated
  using ((select public.is_staff()));
