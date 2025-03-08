/*
  # Create Freedom Wall Schema

  1. New Tables
    - `comments`
      - `id` (bigint, primary key)
      - `created_at` (timestamp with time zone)
      - `message` (text)
      - `image_url` (text, nullable)

  2. Storage
    - Create bucket for storing comment images

  3. Security
    - Enable RLS on comments table
    - Add policies for:
      - Anyone can read comments
      - Anyone can create comments
      - No one can update or delete comments
*/

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at timestamptz DEFAULT now(),
  message text NOT NULL,
  image_url text
);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read comments"
  ON comments
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create comments"
  ON comments
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('freedom-wall-images', 'freedom-wall-images', true);

-- Allow public access to read images
CREATE POLICY "Public can read freedom wall images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'freedom-wall-images');

-- Allow anyone to upload images
CREATE POLICY "Anyone can upload freedom wall images"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'freedom-wall-images');