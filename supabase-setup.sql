-- Wardrobe App Database Setup
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)

-- 1. Create the clothing_items table
create table if not exists clothing_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  image_url text not null,
  name text not null,
  category text not null,
  color text,
  occasion text[],
  brand text,
  notes text,
  created_at timestamp with time zone default now()
);

-- 2. Enable Row Level Security
alter table clothing_items enable row level security;

-- 3. Create RLS policies (users can only access their own items)
create policy "Users can view own items" on clothing_items
  for select using (auth.uid() = user_id);

create policy "Users can insert own items" on clothing_items
  for insert with check (auth.uid() = user_id);

create policy "Users can update own items" on clothing_items
  for update using (auth.uid() = user_id);

create policy "Users can delete own items" on clothing_items
  for delete using (auth.uid() = user_id);

-- 4. Create index for faster queries
create index if not exists clothing_items_user_id_idx on clothing_items(user_id);
create index if not exists clothing_items_created_at_idx on clothing_items(created_at desc);

-- 5. Migration: Add occasion column (run this if table already exists)
-- ALTER TABLE clothing_items ADD COLUMN IF NOT EXISTS occasion text[];

-- Storage Setup Instructions:
-- 1. Go to Storage in your Supabase dashboard
-- 2. Create a new bucket called "clothing-images"
-- 3. Make it a PUBLIC bucket (for direct image URLs)
-- 4. Add the following policy for uploads (in bucket settings):
--
--    Policy name: "Authenticated users can upload"
--    Allowed operation: INSERT
--    Policy definition: (auth.role() = 'authenticated')
--
-- 5. Add the following policy for deletes:
--
--    Policy name: "Users can delete own images"
--    Allowed operation: DELETE
--    Policy definition: (auth.uid()::text = (storage.foldername(name))[1])
