/*
  # Add likes feature to comments

  1. Changes
    - Add likes column to comments table with default value of 0
    - Create function to increment likes safely

  2. Security
    - Allow public access to increment likes
*/

-- Add likes column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comments' AND column_name = 'likes'
  ) THEN
    ALTER TABLE comments ADD COLUMN likes integer DEFAULT 0;
  END IF;
END $$;

-- Create function to increment likes
CREATE OR REPLACE FUNCTION increment_likes(comment_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE comments
  SET likes = COALESCE(likes, 0) + 1
  WHERE id = comment_id;
END;
$$;

-- Grant access to the increment_likes function
GRANT EXECUTE ON FUNCTION increment_likes TO public;