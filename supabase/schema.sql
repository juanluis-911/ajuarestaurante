-- ============================================================
-- AJUA RESTAURANTES - Schema SQL
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
create type user_role as enum ('super_admin', 'org_admin', 'gerente', 'cajera', 'cocina');
create type order_status as enum ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled');
create type order_type as enum ('dine_in', 'pickup');
create type table_status as enum ('available', 'occupied', 'reserved');

-- ============================================================
-- USER PROFILES
-- ============================================================
create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into user_profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- RESTAURANTS / SUCURSALES
-- ============================================================
create table restaurants (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  address text,
  phone text,
  logo_url text,
  cover_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, slug)
);

-- ============================================================
-- ROLES
-- ============================================================

-- Roles a nivel organización (super_admin, org_admin)
create table user_organization_roles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  role text not null check (role in ('super_admin', 'org_admin')),
  created_at timestamptz not null default now(),
  unique(user_id, org_id)
);

-- Roles a nivel restaurante (gerente, cajera, cocina)
create table user_restaurant_roles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references user_profiles(id) on delete cascade,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  role text not null check (role in ('gerente', 'cajera', 'cocina')),
  created_at timestamptz not null default now(),
  unique(user_id, restaurant_id)
);

-- ============================================================
-- MENU
-- ============================================================
create table categories (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  name text not null,
  description text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table menu_items (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null,
  image_url text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- TABLES (mesas)
-- ============================================================
create table restaurant_tables (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  number text not null,
  capacity int not null default 4,
  status table_status not null default 'available',
  qr_code text,
  created_at timestamptz not null default now(),
  unique(restaurant_id, number)
);

-- ============================================================
-- ORDERS
-- ============================================================
create table orders (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  table_id uuid references restaurant_tables(id) on delete set null,
  order_number text not null,
  type order_type not null default 'dine_in',
  status order_status not null default 'pending',
  customer_name text,
  customer_phone text,
  notes text,
  total numeric(10,2) not null default 0,
  created_by uuid references user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(restaurant_id, order_number)
);

create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  menu_item_id uuid not null references menu_items(id) on delete restrict,
  quantity int not null check (quantity > 0),
  unit_price numeric(10,2) not null,
  notes text,
  created_at timestamptz not null default now()
);

-- Auto-generate order number per restaurant
create or replace function generate_order_number(p_restaurant_id uuid)
returns text language plpgsql as $$
declare
  v_count int;
  v_date text;
begin
  v_date := to_char(now(), 'YYYYMMDD');
  select count(*) + 1 into v_count
  from orders
  where restaurant_id = p_restaurant_id
    and created_at::date = current_date;
  return v_date || '-' || lpad(v_count::text, 4, '0');
end;
$$;

-- ============================================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================================

create or replace function is_super_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from user_organization_roles
    where user_id = auth.uid() and role = 'super_admin'
  )
$$;

create or replace function is_org_admin_or_above(p_org_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from user_organization_roles
    where user_id = auth.uid()
      and org_id = p_org_id
      and role in ('super_admin', 'org_admin')
  ) or is_super_admin()
$$;

create or replace function has_restaurant_access(p_restaurant_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from user_restaurant_roles
    where user_id = auth.uid() and restaurant_id = p_restaurant_id
  ) or exists (
    select 1 from user_organization_roles uor
    join restaurants r on r.org_id = uor.org_id
    where uor.user_id = auth.uid() and r.id = p_restaurant_id
  ) or is_super_admin()
$$;

create or replace function has_restaurant_role(p_restaurant_id uuid, variadic p_roles text[])
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from user_restaurant_roles
    where user_id = auth.uid()
      and restaurant_id = p_restaurant_id
      and role = any(p_roles)
  ) or is_org_admin_or_above((select org_id from restaurants where id = p_restaurant_id))
$$;

-- ============================================================
-- RLS POLICIES
-- ============================================================

alter table user_profiles enable row level security;
alter table organizations enable row level security;
alter table restaurants enable row level security;
alter table user_organization_roles enable row level security;
alter table user_restaurant_roles enable row level security;
alter table categories enable row level security;
alter table menu_items enable row level security;
alter table restaurant_tables enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- user_profiles
create policy "users_read_own" on user_profiles for select using (id = auth.uid());
create policy "users_update_own" on user_profiles for update using (id = auth.uid());
create policy "super_admin_all_profiles" on user_profiles for all using (is_super_admin());

-- organizations
create policy "org_members_read" on organizations for select
  using (is_super_admin() or exists (
    select 1 from user_organization_roles where user_id = auth.uid() and org_id = id
  ));
create policy "super_admin_all_orgs" on organizations for all using (is_super_admin());
create policy "org_admin_update" on organizations for update
  using (is_org_admin_or_above(id));

-- restaurants
create policy "restaurant_staff_read" on restaurants for select
  using (has_restaurant_access(id) or is_active = true);
create policy "org_admin_manage_restaurants" on restaurants for all
  using (is_org_admin_or_above(org_id));

-- user_organization_roles
create policy "super_admin_all_org_roles" on user_organization_roles for all using (is_super_admin());
create policy "org_admin_read_roles" on user_organization_roles for select
  using (is_org_admin_or_above(org_id));

-- user_restaurant_roles
create policy "admin_manage_restaurant_roles" on user_restaurant_roles for all
  using (is_org_admin_or_above((select org_id from restaurants where id = restaurant_id)));
create policy "staff_read_own_roles" on user_restaurant_roles for select
  using (user_id = auth.uid());

-- categories
create policy "public_read_active_categories" on categories for select
  using (is_active = true);
create policy "staff_manage_categories" on categories for all
  using (has_restaurant_role(restaurant_id, 'gerente') or is_org_admin_or_above((select org_id from restaurants where id = restaurant_id)));

-- menu_items
create policy "public_read_active_items" on menu_items for select
  using (is_active = true);
create policy "staff_manage_items" on menu_items for all
  using (has_restaurant_role(restaurant_id, 'gerente') or is_org_admin_or_above((select org_id from restaurants where id = restaurant_id)));

-- restaurant_tables
create policy "staff_read_tables" on restaurant_tables for select
  using (has_restaurant_access(restaurant_id));
create policy "gerente_manage_tables" on restaurant_tables for all
  using (has_restaurant_role(restaurant_id, 'gerente'));

-- orders
create policy "staff_read_orders" on orders for select
  using (has_restaurant_access(restaurant_id));
create policy "cajera_cocina_create_orders" on orders for insert
  with check (has_restaurant_access(restaurant_id));
create policy "staff_update_orders" on orders for update
  using (has_restaurant_access(restaurant_id));

-- order_items
create policy "staff_read_order_items" on order_items for select
  using (has_restaurant_access((select restaurant_id from orders where id = order_id)));
create policy "staff_manage_order_items" on order_items for all
  using (has_restaurant_access((select restaurant_id from orders where id = order_id)));

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_restaurants_org_id on restaurants(org_id);
create index idx_restaurants_slug on restaurants(slug);
create index idx_user_org_roles_user on user_organization_roles(user_id);
create index idx_user_restaurant_roles_user on user_restaurant_roles(user_id);
create index idx_user_restaurant_roles_restaurant on user_restaurant_roles(restaurant_id);
create index idx_categories_restaurant on categories(restaurant_id);
create index idx_menu_items_restaurant on menu_items(restaurant_id);
create index idx_menu_items_category on menu_items(category_id);
create index idx_orders_restaurant on orders(restaurant_id);
create index idx_orders_status on orders(status);
create index idx_orders_created_at on orders(created_at desc);
create index idx_order_items_order on order_items(order_id);
