-- =============================================================
-- Campus Skill Exchange — Database Schema + Row Level Security
-- Run this in Supabase SQL Editor (Project > SQL Editor > New query)
-- =============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------
-- PROFILES  (1:1 with auth.users, auto-created via trigger below)
-- ---------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  department text,
  bio text,
  avatar_url text,
  is_admin boolean not null default false,
  is_banned boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by any authenticated user"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id and is_admin = false and is_banned = false);
  -- users cannot self-promote to admin or unban themselves

-- Auto-create a profile row whenever a new auth user signs up
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------
-- SKILLS  (listings a user offers to teach)
-- ---------------------------------------------------------------
create table public.skills (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 100),
  description text not null check (char_length(description) between 10 and 2000),
  category text not null,
  tags text[] not null default '{}',
  is_active boolean not null default true,
  is_flagged boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index skills_category_idx on public.skills (category);
create index skills_tags_idx on public.skills using gin (tags);
create index skills_owner_idx on public.skills (owner_id);

alter table public.skills enable row level security;

create policy "Active, unflagged skills are publicly viewable to authenticated users"
  on public.skills for select
  to authenticated
  using (is_active = true and is_flagged = false or owner_id = auth.uid());

create policy "Users can create their own skill listings"
  on public.skills for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "Users can update their own skill listings"
  on public.skills for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Users can delete their own skill listings"
  on public.skills for delete
  to authenticated
  using (owner_id = auth.uid());

-- ---------------------------------------------------------------
-- AVAILABILITY SLOTS  (owner-defined open time windows)
-- ---------------------------------------------------------------
create table public.availability_slots (
  id uuid primary key default uuid_generate_v4(),
  skill_id uuid not null references public.skills(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null check (end_time > start_time),
  is_booked boolean not null default false,
  created_at timestamptz not null default now()
);

create index slots_skill_idx on public.availability_slots (skill_id);

alter table public.availability_slots enable row level security;

create policy "Slots viewable by any authenticated user"
  on public.availability_slots for select
  to authenticated
  using (true);

create policy "Owners manage their own slots"
  on public.availability_slots for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ---------------------------------------------------------------
-- BOOKINGS  (a learner reserving a slot)
-- ---------------------------------------------------------------
create table public.bookings (
  id uuid primary key default uuid_generate_v4(),
  slot_id uuid not null references public.availability_slots(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  learner_id uuid not null references public.profiles(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','confirmed','completed','cancelled')),
  message text,
  created_at timestamptz not null default now()
);

create index bookings_learner_idx on public.bookings (learner_id);
create index bookings_owner_idx on public.bookings (owner_id);

alter table public.bookings enable row level security;

create policy "Participants can view their own bookings"
  on public.bookings for select
  to authenticated
  using (learner_id = auth.uid() or owner_id = auth.uid());

create policy "Learners can create bookings for themselves"
  on public.bookings for insert
  to authenticated
  with check (learner_id = auth.uid() and learner_id <> owner_id);

create policy "Participants can update booking status"
  on public.bookings for update
  to authenticated
  using (learner_id = auth.uid() or owner_id = auth.uid())
  with check (learner_id = auth.uid() or owner_id = auth.uid());

-- Prevent double-booking: mark slot as booked when a booking is confirmed
create function public.mark_slot_booked()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.availability_slots
    set is_booked = true
    where id = new.slot_id and is_booked = false;

  if not found then
    raise exception 'This time slot is no longer available.';
  end if;

  return new;
end;
$$;

create trigger on_booking_created
  before insert on public.bookings
  for each row execute procedure public.mark_slot_booked();

-- Free the slot again if a booking is cancelled
create function public.free_slot_on_cancel()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status = 'cancelled' and old.status <> 'cancelled' then
    update public.availability_slots set is_booked = false where id = new.slot_id;
  end if;
  return new;
end;
$$;

create trigger on_booking_cancelled
  after update on public.bookings
  for each row execute procedure public.free_slot_on_cancel();

-- ---------------------------------------------------------------
-- REVIEWS  (learner rates the owner after a completed session)
-- ---------------------------------------------------------------
create table public.reviews (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 1000),
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

create policy "Reviews are viewable by any authenticated user"
  on public.reviews for select
  to authenticated
  using (true);

create policy "Only the learner on a completed booking can leave a review"
  on public.reviews for insert
  to authenticated
  with check (
    reviewer_id = auth.uid()
    and exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and b.learner_id = auth.uid()
        and b.status = 'completed'
    )
  );

-- ---------------------------------------------------------------
-- MESSAGES  (simple per-booking chat)
-- ---------------------------------------------------------------
create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index messages_booking_idx on public.messages (booking_id, created_at);

alter table public.messages enable row level security;

-- Enable Realtime broadcasts for this table so the chat UI updates live.
-- Supabase still enforces the RLS policies below on every broadcast — a
-- user who isn't a participant on a booking never receives its messages,
-- even if they subscribe to the channel directly.
alter publication supabase_realtime add table public.messages;

create policy "Only booking participants can view messages"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and (b.learner_id = auth.uid() or b.owner_id = auth.uid())
    )
  );

create policy "Only booking participants can send messages"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and (b.learner_id = auth.uid() or b.owner_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------
-- REPORTS  (flag a listing for admin moderation)
-- ---------------------------------------------------------------
create table public.reports (
  id uuid primary key default uuid_generate_v4(),
  skill_id uuid not null references public.skills(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (char_length(reason) between 5 and 500),
  status text not null default 'open' check (status in ('open','resolved','dismissed')),
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;

create policy "Users can create reports"
  on public.reports for insert
  to authenticated
  with check (reporter_id = auth.uid());

create policy "Only admins can view reports"
  on public.reports for select
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

create policy "Only admins can update reports"
  on public.reports for update
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

-- Flag the related skill automatically when a report is filed
create function public.flag_skill_on_report()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.skills set is_flagged = true where id = new.skill_id;
  return new;
end;
$$;

create trigger on_report_created
  after insert on public.reports
  for each row execute procedure public.flag_skill_on_report();

-- ---------------------------------------------------------------
-- Admin-only override policies (skills/bookings visible to admins)
-- ---------------------------------------------------------------
create policy "Admins can view all skills including flagged"
  on public.skills for select
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

create policy "Admins can update any skill (e.g. unflag/deactivate)"
  on public.skills for update
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));
