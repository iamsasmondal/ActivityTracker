-- Supabase Schema for Activity Tracker

-- Enable UUID extension natively
create extension if not exists "uuid-ossp";

-- Profiles table (Linked to auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  username text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Categories table
create table if not exists public.categories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  UNIQUE(user_id, name)
);

-- Tags table
-- If category_id is null, it's a "Common" tag.
create table if not exists public.tags (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  category_id uuid references public.categories(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  UNIQUE(user_id, name, category_id)
);

-- Activities table
create table if not exists public.activities (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  date date not null check (date <= CURRENT_DATE),
  category_id uuid references public.categories(id) on delete restrict not null,
  tag_id uuid references public.tags(id) on delete restrict,
  image_id text, -- ImageKit ID
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habits table
create table if not exists public.habits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Food Categories table
create table if not exists public.food_categories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  UNIQUE(user_id, name)
);

-- Foods table
create table if not exists public.foods (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  date date not null check (date <= CURRENT_DATE),
  food_category_id uuid references public.food_categories(id) on delete restrict not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.activities enable row level security;
alter table public.habits enable row level security;
alter table public.foods enable row level security;
alter table public.food_categories enable row level security;

-- Profiles Policies
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Categories Policies
create policy "Users can view own categories" on categories for select using (auth.uid() = user_id);
create policy "Users can insert own categories" on categories for insert with check (auth.uid() = user_id);
create policy "Users can update own categories" on categories for update using (auth.uid() = user_id);
create policy "Users can delete own categories" on categories for delete using (auth.uid() = user_id);

-- Tags Policies
create policy "Users can view own tags" on tags for select using (auth.uid() = user_id);
create policy "Users can insert own tags" on tags for insert with check (auth.uid() = user_id);
create policy "Users can update own tags" on tags for update using (auth.uid() = user_id);
create policy "Users can delete own tags" on tags for delete using (auth.uid() = user_id);

-- Activities Policies
create policy "Users can view own activities" on activities for select using (auth.uid() = user_id);
create policy "Users can insert own activities" on activities for insert with check (auth.uid() = user_id);
create policy "Users can update own activities" on activities for update using (auth.uid() = user_id);
create policy "Users can delete own activities" on activities for delete using (auth.uid() = user_id);

-- Habits Policies
create policy "Users can view own habits" on habits for select using (auth.uid() = user_id);
create policy "Users can insert own habits" on habits for insert with check (auth.uid() = user_id);
create policy "Users can update own habits" on habits for update using (auth.uid() = user_id);
create policy "Users can delete own habits" on habits for delete using (auth.uid() = user_id);

-- Food Categories Policies
create policy "Users can view own food_categories" on food_categories for select using (auth.uid() = user_id);
create policy "Users can insert own food_categories" on food_categories for insert with check (auth.uid() = user_id);
create policy "Users can update own food_categories" on food_categories for update using (auth.uid() = user_id);
create policy "Users can delete own food_categories" on food_categories for delete using (auth.uid() = user_id);

-- Foods Policies
create policy "Users can view own foods" on foods for select using (auth.uid() = user_id);
create policy "Users can insert own foods" on foods for insert with check (auth.uid() = user_id);
create policy "Users can update own foods" on foods for update using (auth.uid() = user_id);
create policy "Users can delete own foods" on foods for delete using (auth.uid() = user_id);

-- Function for profile creation on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
