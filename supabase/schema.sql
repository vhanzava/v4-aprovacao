-- ============================================================
-- V4 Aprovação de Posts — Schema
-- Execute no SQL Editor do Supabase
-- ============================================================

-- User roles (team + admin permissions)
create table if not exists user_roles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  role text not null check (role in ('admin', 'team', 'viewer')),
  created_at timestamptz default now()
);

-- Seed initial roles
insert into user_roles (email, role) values
  ('vinicius.hanzava@v4company.com', 'admin'),
  ('caina.rossini@v4company.com', 'team'),
  ('lara.davila@v4company.com', 'team'),
  ('maycon.bodini@v4company.com', 'team'),
  ('gabriel.prates@v4company.com', 'team'),
  ('viktoria.powarchuk@v4company.com', 'team'),
  ('cristianomachado@v4company.com', 'team'),
  ('vitor.ricacheski@v4company.com', 'team')
on conflict (email) do nothing;

-- Clients
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text default 'ativo' check (status in ('ativo', 'inativo')),
  magic_token text unique not null default encode(gen_random_bytes(24), 'hex'),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- Pieces (creative content)
create table if not exists pieces (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  title text not null,
  format text not null check (format in ('imagem_unica', 'carrossel', 'video')),
  purpose text not null check (purpose in ('postagem', 'anuncio')),
  status text default 'pendente' check (status in ('pendente', 'aprovado', 'reprovado')),
  copy text,
  drive_url text,
  post_date date,
  order_index integer default 0,
  created_at timestamptz default now()
);

-- Piece assets (images stored in Supabase Storage)
create table if not exists piece_assets (
  id uuid primary key default gen_random_uuid(),
  piece_id uuid not null references pieces(id) on delete cascade,
  url text not null,
  storage_path text,
  order_index integer not null default 0,
  created_at timestamptz default now()
);

-- Approvals (one per piece)
create table if not exists approvals (
  id uuid primary key default gen_random_uuid(),
  piece_id uuid not null references pieces(id) on delete cascade,
  status text not null check (status in ('aprovado', 'reprovado')),
  step1_answers text[],
  step2_answers text[],
  step2_open text,
  step3_text text,
  decided_at timestamptz default now(),
  constraint approvals_piece_id_unique unique (piece_id)
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table user_roles enable row level security;
alter table clients enable row level security;
alter table pieces enable row level security;
alter table piece_assets enable row level security;
alter table approvals enable row level security;

-- Helper: check if current user has team/admin role
create or replace function is_team_member()
returns boolean
language sql security definer
as $$
  select exists (
    select 1 from user_roles
    where email = (select email from auth.users where id = auth.uid())
    and role in ('admin', 'team')
  );
$$;

-- Helper: check if current user is admin
create or replace function is_admin_user()
returns boolean
language sql security definer
as $$
  select exists (
    select 1 from user_roles
    where email = (select email from auth.users where id = auth.uid())
    and role = 'admin'
  );
$$;

-- user_roles: users can read their own role
drop policy if exists "read own role" on user_roles;
create policy "read own role" on user_roles
  for select
  using (email = (select email from auth.users where id = auth.uid()));

-- user_roles: only admin can manage
drop policy if exists "admin manages roles" on user_roles;
create policy "admin manages roles" on user_roles
  for all
  using (is_admin_user());

-- clients: team can read + manage, admin full access
drop policy if exists "team manages clients" on clients;
create policy "team manages clients" on clients
  for all
  using (is_team_member());

-- pieces: team can read + manage
drop policy if exists "team manages pieces" on pieces;
create policy "team manages pieces" on pieces
  for all
  using (is_team_member());

-- piece_assets: team can read + manage
drop policy if exists "team manages assets" on piece_assets;
create policy "team manages assets" on piece_assets
  for all
  using (is_team_member());

-- approvals: team can read all
drop policy if exists "team reads approvals" on approvals;
create policy "team reads approvals" on approvals
  for select
  using (is_team_member());

-- approvals: service role handles client inserts (via API routes)

-- ============================================================
-- Storage bucket for images
-- ============================================================
-- Run in Storage section of Supabase Dashboard:
-- Create bucket "pieces" with public access OFF
-- Or run:
-- insert into storage.buckets (id, name, public) values ('pieces', 'pieces', false);

-- ============================================================
-- Indexes for performance
-- ============================================================
create index if not exists pieces_client_id_idx on pieces(client_id);
create index if not exists pieces_status_idx on pieces(status);
create index if not exists piece_assets_piece_id_idx on piece_assets(piece_id);
create index if not exists approvals_piece_id_idx on approvals(piece_id);
