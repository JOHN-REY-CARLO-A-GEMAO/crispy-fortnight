/*
  # Freedom Wall Schema Setup

  1. New Tables
    - `comments`
      - `id` (uuid, primary key)
      - `message` (text, required)
      - `image_url` (text, optional)
      - `created_at` (timestamp with timezone)

  2. Security
    - Enable RLS on comments table
    - Add policies for:
      - Anyone can read comments
      - Anyone can create comments
      - No one can update or delete comments
*/

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'comments' 
    AND policyname = 'Anyone can read comments'
  ) THEN
    CREATE POLICY "Anyone can read comments"
      ON comments
      FOR SELECT
      TO public
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'comments' 
    AND policyname = 'Anyone can create comments'
  ) THEN
    CREATE POLICY "Anyone can create comments"
      ON comments
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;
END $$;

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('freedom-wall-images', 'freedom-wall-images', true)
ON CONFLICT (id) DO NOTHING;