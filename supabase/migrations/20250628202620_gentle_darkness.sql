/*
  # Add Project Management and API Key System

  1. New Tables
    - `projects` - Store user projects
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text) - Project name
      - `description` (text) - Project description
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `project_api_keys` - Store API keys for projects
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `api_key` (text, unique) - The actual API key
      - `api_secret` (text) - The API secret
      - `name` (text) - Friendly name for the API key
      - `is_active` (boolean) - Whether the key is active
      - `last_used_at` (timestamp) - Track usage
      - `usage_count` (integer) - Track number of API calls
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own projects and API keys
    - API key validation functions

  3. Features
    - Project creation and management
    - API key generation with secrets
    - Usage tracking
    - Key management (activate/deactivate)
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policies for projects
CREATE POLICY "Users can view own projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create project_api_keys table
CREATE TABLE IF NOT EXISTS project_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  api_key text UNIQUE NOT NULL,
  api_secret text NOT NULL,
  name text NOT NULL,
  is_active boolean DEFAULT true,
  last_used_at timestamptz,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on project_api_keys
ALTER TABLE project_api_keys ENABLE ROW LEVEL SECURITY;

-- Create policies for project_api_keys (users can access keys for their projects)
CREATE POLICY "Users can view own project API keys"
  ON project_api_keys
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create API keys for own projects"
  ON project_api_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own project API keys"
  ON project_api_keys
  FOR UPDATE
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own project API keys"
  ON project_api_keys
  FOR DELETE
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Create policy for service role to access API keys (for validation)
CREATE POLICY "Service role can access all API keys"
  ON project_api_keys
  FOR ALL
  TO service_role
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_project_api_keys_project_id ON project_api_keys(project_id);
CREATE INDEX IF NOT EXISTS idx_project_api_keys_api_key ON project_api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_project_api_keys_is_active ON project_api_keys(is_active);

-- Function to generate a secure API key
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS text AS $$
BEGIN
  -- Generate a secure API key with prefix 'pk_' followed by 32 random characters
  RETURN 'pk_' || encode(gen_random_bytes(24), 'base64')::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate a secure API secret
CREATE OR REPLACE FUNCTION generate_api_secret()
RETURNS text AS $$
BEGIN
  -- Generate a secure API secret with prefix 'sk_' followed by 48 random characters
  RETURN 'sk_' || encode(gen_random_bytes(36), 'base64')::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a new API key for a project
CREATE OR REPLACE FUNCTION create_project_api_key(
  p_project_id uuid,
  p_name text
)
RETURNS TABLE(
  api_key text,
  api_secret text,
  key_name text,
  project_name text
) AS $$
DECLARE
  v_api_key text;
  v_api_secret text;
  v_project_name text;
  v_user_id uuid;
BEGIN
  -- Verify the project belongs to the current user
  SELECT projects.name, projects.user_id
  INTO v_project_name, v_user_id
  FROM projects
  WHERE projects.id = p_project_id;
  
  -- Check if project exists and belongs to current user
  IF v_project_name IS NULL THEN
    RAISE EXCEPTION 'Project not found';
  END IF;
  
  IF v_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: Project does not belong to current user';
  END IF;
  
  -- Generate unique API key and secret
  LOOP
    v_api_key := generate_api_key();
    v_api_secret := generate_api_secret();
    -- Check if this key already exists (very unlikely but good to be safe)
    IF NOT EXISTS (SELECT 1 FROM project_api_keys WHERE project_api_keys.api_key = v_api_key) THEN
      EXIT;
    END IF;
  END LOOP;
  
  -- Insert the new API key
  INSERT INTO project_api_keys (project_id, api_key, api_secret, name)
  VALUES (p_project_id, v_api_key, v_api_secret, p_name);
  
  -- Return the API key details
  RETURN QUERY SELECT v_api_key, v_api_secret, p_name, v_project_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate API key and return project info
CREATE OR REPLACE FUNCTION validate_project_api_key(p_api_key text)
RETURNS TABLE(
  is_valid boolean,
  project_id uuid,
  project_name text,
  user_id uuid,
  key_name text
) AS $$
DECLARE
  v_project_id uuid;
  v_project_name text;
  v_user_id uuid;
  v_key_name text;
  v_is_active boolean;
BEGIN
  -- Check if API key exists and is active
  SELECT 
    pak.project_id, 
    p.name, 
    p.user_id, 
    pak.name,
    pak.is_active
  INTO 
    v_project_id, 
    v_project_name, 
    v_user_id, 
    v_key_name,
    v_is_active
  FROM project_api_keys pak
  JOIN projects p ON pak.project_id = p.id
  WHERE pak.api_key = p_api_key;
  
  -- If key doesn't exist or is inactive, return false
  IF v_project_id IS NULL OR NOT v_is_active THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::uuid, NULL::text;
    RETURN;
  END IF;
  
  -- Update usage statistics
  UPDATE project_api_keys
  SET 
    last_used_at = now(),
    usage_count = usage_count + 1
  WHERE project_api_keys.api_key = p_api_key;
  
  -- Return success
  RETURN QUERY SELECT true, v_project_id, v_project_name, v_user_id, v_key_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update project updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for projects updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_project_updated_at();