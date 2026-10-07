create extension if not exists pgcrypto;

create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  invitation_code text not null unique,
  max_companions integer not null default 0 check (max_companions between 0 and 4),
  created_at timestamptz not null default now()
);

create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.guests(id) on delete cascade,
  attending boolean not null,
  companion_count integer not null default 0 check (companion_count between 0 and 4),
  companion_names jsonb not null default '[]'::jsonb,
  responded_at timestamptz not null default now(),
  unique (guest_id)
);

create table if not exists public.event_days (
  id uuid primary key default gen_random_uuid(),
  event_date date not null unique,
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.rsvp_days (
  rsvp_id uuid not null
    references public.rsvps(id)
    on delete cascade,

  event_day_id uuid not null
    references public.event_days(id)
    on delete cascade,

  primary key (rsvp_id, event_day_id)
);
create index if not exists guests_invitation_code_idx on public.guests(invitation_code);
create index if not exists rsvps_guest_id_idx on public.rsvps(guest_id);

create index if not exists event_days_date_idx
  on public.event_days(event_date);

insert into public.event_days (
  event_date,
  title,
  description
)
values
(
  '2026-10-31',
  'Halloween — Abertura',
  'Primeiro dia da celebração'
),
(
  '2026-11-01',
  'Halloween — Celebração',
  'Dia principal da festa'
),
(
  '2026-11-02',
  'Halloween — Encerramento',
  'Último dia da celebração'
)
on conflict (event_date) do nothing;
alter table public.guests enable row level security;
alter table public.rsvps enable row level security;

-- Políticas serão adicionadas na etapa de autenticação/API segura.
-- Não exponha a service role key no navegador.
