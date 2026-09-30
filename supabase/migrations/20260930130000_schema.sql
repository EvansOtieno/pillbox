-- Afya Corner: core schema (catalogue, delivery, content, orders).
-- Money is stored as whole Kenyan shillings (int). Security (RLS) is in the next migration.

create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------- types

create type public.staff_role as enum ('owner', 'staff');
create type public.rx_class as enum ('general', 'pharmacy_only', 'prescription_only');
create type public.fulfilment as enum ('delivery', 'pickup');
create type public.order_status as enum ('new', 'confirmed', 'completed', 'cancelled');

-- ---------------------------------------------------------------- helpers

create function public.set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------- staff profiles

-- One row per admin user. Customers never sign in, so every profile is staff.
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  role       public.staff_role not null default 'staff',
  full_name  text not null default '',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- catalogue

create table public.categories (
  id          int generated always as identity primary key,
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null check (length(trim(name)) > 0),
  description text not null default '',
  image_path  text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.products (
  id                int generated always as identity primary key,
  sku               text not null unique,
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name              text not null check (length(trim(name)) > 0),
  short_description text not null default '',
  description       text not null default '',
  price_kes         int not null check (price_kes >= 0),
  category_id       int not null references public.categories (id) on delete restrict,
  rx_class          public.rx_class not null default 'general',
  in_stock          boolean not null default true,
  featured          boolean not null default false,
  image_path        text,
  published         boolean not null default true,
  -- Full-text search document, kept up to date by Postgres (like an Oracle Text index, but a column).
  search            tsvector generated always as (
                      setweight(to_tsvector('english', name), 'A') ||
                      setweight(to_tsvector('english', short_description), 'B') ||
                      setweight(to_tsvector('english', description), 'C')
                    ) stored,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index products_category_idx on public.products (category_id) where published;
create index products_featured_idx on public.products (featured) where published and featured;
create index products_search_idx on public.products using gin (search);
-- Trigram index: fast partial/fuzzy name matching ("parac" → Paracetamol).
create index products_name_trgm_idx on public.products using gin (name extensions.gin_trgm_ops);

-- ---------------------------------------------------------------- delivery and content

create table public.delivery_areas (
  id         int generated always as identity primary key,
  name       text not null unique check (length(trim(name)) > 0),
  fee_kes    int not null default 0 check (fee_kes >= 0),
  is_pickup  boolean not null default false,
  active     boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Site settings and page text: one row per key, validated in code by the zod schema in src/lib/settings.
create table public.settings (
  key        text primary key check (key ~ '^[a-z][a-z0-9_]*$'),
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- Answers may contain the tokens {delivery_fees} and {hours}, replaced with live data when shown.
create table public.faqs (
  id         int generated always as identity primary key,
  question   text not null check (length(trim(question)) > 0),
  answer     text not null check (length(trim(answer)) > 0),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- orders

create table public.orders (
  id               uuid primary key default gen_random_uuid(),
  number           int generated always as identity (start with 1001) unique,
  -- Unguessable id for the customer's confirmation page (/order/<token>); never the primary key.
  public_token     uuid not null unique default gen_random_uuid(),
  customer_name    text not null,
  phone            text not null check (phone ~ '^254[17][0-9]{8}$'),
  email            text,
  fulfilment       public.fulfilment not null,
  delivery_area_id int references public.delivery_areas (id) on delete set null,
  delivery_area    text not null,
  delivery_fee_kes int not null check (delivery_fee_kes >= 0),
  address          text,
  notes            text,
  items_total_kes  int not null check (items_total_kes >= 0),
  total_kes        int not null check (total_kes = items_total_kes + delivery_fee_kes),
  status           public.order_status not null default 'new',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (fulfilment = 'pickup' or length(trim(coalesce(address, ''))) > 0)
);

create index orders_created_idx on public.orders (created_at desc);
create index orders_status_idx on public.orders (status);

-- Snapshot of each line at order time, so later price or name changes don't rewrite history.
create table public.order_items (
  order_id       uuid not null references public.orders (id) on delete cascade,
  line_no        int not null,
  product_id     int references public.products (id) on delete set null,
  sku            text not null,
  name           text not null,
  rx_class       public.rx_class not null,
  unit_price_kes int not null check (unit_price_kes >= 0),
  qty            int not null check (qty between 1 and 99),
  line_total_kes int not null check (line_total_kes = unit_price_kes * qty),
  primary key (order_id, line_no)
);

create index order_items_product_idx on public.order_items (product_id);

-- ---------------------------------------------------------------- updated_at triggers

create trigger categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger delivery_areas_updated_at before update on public.delivery_areas
  for each row execute function public.set_updated_at();
create trigger settings_updated_at before update on public.settings
  for each row execute function public.set_updated_at();
create trigger faqs_updated_at before update on public.faqs
  for each row execute function public.set_updated_at();
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();
