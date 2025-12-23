/*
  # Extend Prompts Library for Architecture

  1. Changes
    - Add 'category' column to distinguish prompts vs architecture
    - Add 'code_content' column for storing code snippets
    - Add 'file_path' column for original file reference
    - Add 'language' column for syntax highlighting
    
  2. Security
    - Existing RLS policies still apply
*/

ALTER TABLE prompts_library 
ADD COLUMN IF NOT EXISTS category text DEFAULT 'prompt',
ADD COLUMN IF NOT EXISTS code_content text,
ADD COLUMN IF NOT EXISTS file_path text,
ADD COLUMN IF NOT EXISTS language text DEFAULT 'typescript';

CREATE INDEX IF NOT EXISTS idx_prompts_library_category ON prompts_library(category);