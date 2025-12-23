/*
  # Create AI Prompts Library

  1. New Tables
    - `ai_platforms` - Stores AI platform/product information (Cursor, Notion, n8n, etc.)
    - `prompt_categories` - Categories for organizing prompts (agent, system, tool, chain, etc.)
    - `prompts_library` - Main table storing all prompts and system configurations
    
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read all data
    - Add policies for authenticated users to manage their own data
    
  3. Indexes
    - Add indexes for fast searching by platform, category, and name
    - Full-text search on prompt content
*/

-- Create platforms table
CREATE TABLE IF NOT EXISTS ai_platforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  vendor text,
  url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS prompt_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create prompts library table
CREATE TABLE IF NOT EXISTS prompts_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_id uuid REFERENCES ai_platforms(id) ON DELETE CASCADE,
  category_id uuid REFERENCES prompt_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  prompt_content text NOT NULL,
  file_path text,
  language text DEFAULT 'typescript',
  tags text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ai_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts_library ENABLE ROW LEVEL SECURITY;

-- Policies for ai_platforms
CREATE POLICY "Anyone can read platforms"
  ON ai_platforms FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage platforms"
  ON ai_platforms FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for prompt_categories
CREATE POLICY "Anyone can read categories"
  ON prompt_categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage categories"
  ON prompt_categories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for prompts_library
CREATE POLICY "Anyone can read prompts"
  ON prompts_library FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage prompts"
  ON prompts_library FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_prompts_platform ON prompts_library(platform_id);
CREATE INDEX IF NOT EXISTS idx_prompts_category ON prompts_library(category_id);
CREATE INDEX IF NOT EXISTS idx_prompts_name ON prompts_library(name);
CREATE INDEX IF NOT EXISTS idx_prompts_tags ON prompts_library USING gin(tags);

-- Full-text search
CREATE INDEX IF NOT EXISTS idx_prompts_content_search 
  ON prompts_library 
  USING gin(to_tsvector('english', prompt_content));

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_platforms_updated_at BEFORE UPDATE ON ai_platforms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prompts_library_updated_at BEFORE UPDATE ON prompts_library
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();