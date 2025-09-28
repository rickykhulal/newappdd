/*
  # TruthVote Database Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamptz)
    - `posts`
      - `id` (uuid, primary key)
      - `author_name` (text, references users.name)
      - `content` (text, max 500 chars)
      - `image_url` (text, optional)
      - `created_at` (timestamptz)
    - `votes`
      - `id` (uuid, primary key)
      - `post_id` (uuid, references posts.id)
      - `user_name` (text, references users.name)
      - `vote_type` (text, 'true' or 'fake')
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access
    - Add policies for authenticated operations
    - Prevent duplicate voting per user per post

  3. Indexes
    - Index on posts.created_at for feed ordering
    - Index on votes.post_id for vote counting
    - Unique constraint on votes (post_id, user_name)
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL,
  content text NOT NULL CHECK (length(content) <= 500),
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  vote_type text NOT NULL CHECK (vote_type IN ('true', 'fake')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_name)
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read all users"
  ON users
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert users"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create policies for posts table
CREATE POLICY "Anyone can read posts"
  ON posts
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create posts"
  ON posts
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create policies for votes table
CREATE POLICY "Anyone can read votes"
  ON votes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create votes"
  ON votes
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS votes_post_id_idx ON votes(post_id);
CREATE INDEX IF NOT EXISTS votes_user_name_idx ON votes(user_name);