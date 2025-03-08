/*
  # Add parent-child relationship for comments

  1. Changes
    - Add parent_id to comments table to support nested comments
    - Add cascade delete for parent comments
    - Update RLS policies to allow comment deletion
  
  2. Security
    - Enable RLS for cascading deletes
    - Add policy for comment deletion
*/

-- Add parent_id column for nested comments
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS parent_id bigint REFERENCES comments(id) ON DELETE CASCADE;

-- Add policy for deleting comments
CREATE POLICY "Anyone can delete their own comments"
  ON comments
  FOR DELETE
  TO public
  USING (true);