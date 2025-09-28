/*
  # Add cascade delete for votes when posts are deleted

  1. Changes
    - Update foreign key constraint to cascade delete votes when a post is deleted
    - This ensures data consistency when posts are removed

  2. Security
    - No changes to RLS policies needed as deletion is handled at application level
*/

-- Drop existing foreign key constraint
ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_post_id_fkey;

-- Add new foreign key constraint with CASCADE DELETE
ALTER TABLE votes ADD CONSTRAINT votes_post_id_fkey 
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;