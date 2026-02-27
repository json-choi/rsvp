create table if not exists rsvps (
  id serial primary key,
  name text not null,
  phone text not null,
  attending boolean default true,
  created_at timestamp default now()
);

create table if not exists settings (
  id serial primary key,
  key text not null unique,
  value text not null,
  updated_at timestamp default now()
);
