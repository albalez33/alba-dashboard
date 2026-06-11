-- Esquema del dashboard de Alba Lez
-- Ejecutar en Supabase: SQL Editor > New query > pegar y Run

create table if not exists daily_metrics (
  date date primary key,
  followers_count integer,
  follower_delta integer,          -- nuevos seguidores del día (follower_count de la API)
  reach integer,
  views integer,
  interactions integer,            -- total_interactions
  likes integer,
  comments integer,
  saves integer,
  shares integer,
  profile_views integer,
  accounts_engaged integer,
  updated_at timestamptz default now()
);

create table if not exists media (
  id text primary key,
  caption text,
  media_type text,                 -- IMAGE | VIDEO | CAROUSEL_ALBUM
  media_product_type text,         -- FEED | REELS | STORY
  permalink text,
  media_url text,
  thumbnail_url text,
  timestamp timestamptz,
  like_count integer,
  comments_count integer,
  views integer,
  reach integer,
  saves integer,
  shares integer,
  interactions integer,
  updated_at timestamptz default now()
);

create table if not exists audience (
  id text primary key,             -- siempre 'latest'
  country jsonb,
  city jsonb,
  age jsonb,
  gender jsonb,
  online_followers jsonb,
  updated_at timestamptz default now()
);

-- RLS activado: solo el service role (usado por el servidor) puede leer/escribir
alter table daily_metrics enable row level security;
alter table media enable row level security;
alter table audience enable row level security;
