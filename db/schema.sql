-- Green Star Store schema
-- Re-runnable: drops and recreates all tables, so db:setup can be run repeatedly in dev.

create extension if not exists pg_trgm;

drop table if exists reviews cascade;
drop table if exists product_images cascade;
drop table if exists orders cascade;
drop table if exists promo_codes cascade;
drop table if exists products cascade;

create table products (
  id serial primary key,
  slug text unique not null,
  name text not null,
  brand text not null,
  description text not null,
  category text not null,
  price_cents integer not null,
  compare_at_cents integer,
  stock integer not null default 0,
  avg_rating numeric(2, 1) not null default 0,
  review_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table product_images (
  id serial primary key,
  product_id integer not null references products (id) on delete cascade,
  url text not null,
  alt text not null,
  position integer not null default 0
);

create table reviews (
  id serial primary key,
  product_id integer not null references products (id) on delete cascade,
  author text not null,
  rating integer not null check (rating between 1 and 5),
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table promo_codes (
  code text primary key,
  kind text not null check (kind in ('percent', 'fixed', 'free_shipping')),
  value integer not null default 0,
  min_subtotal_cents integer not null default 0,
  active boolean not null default true
);

create table orders (
  id serial primary key,
  order_number text unique not null,
  email text not null,
  items jsonb not null,
  address jsonb not null,
  subtotal_cents integer not null,
  discount_cents integer not null default 0,
  shipping_cents integer not null default 0,
  tax_cents integer not null default 0,
  total_cents integer not null,
  status text not null default 'confirmed',
  estimated_delivery date not null,
  created_at timestamptz not null default now()
);

create index idx_products_category on products (category);
create index idx_products_price on products (price_cents);
create index idx_products_rating on products (avg_rating);
create index idx_products_created on products (created_at desc);
create index idx_products_name_trgm on products using gin (name gin_trgm_ops);
create index idx_product_images_product on product_images (product_id);
create index idx_reviews_product on reviews (product_id);
create index idx_orders_email on orders (email);
