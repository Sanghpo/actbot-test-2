/*
  # Add Public Project ID System

  1. New Features
    - Add `public_id` column to `projects` table
    - Function to generate unique public IDs
    - Trigger to auto-assign public IDs
    - Function to convert public ID to UUID
    - Update validation functions

  2. Security
    - Public IDs are safe to expose in API calls
    - Internal UUIDs remain protected
    - Maintains existing RLS policies

  3. Migration
    - Populate existing projects with public IDs
    - Update API validation functions
*/

-- Function to generate a unique public project ID
CREATE OR REPLACE FUNCTION generate_project_public_id()
RETURNS text AS $$
DECLARE
  v_public_id text;
  v_attempts integer := 0;
  v_max_attempts integer := 100;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric ID (uppercase letters and numbers)
    v_public_id := upper(substring(encode(gen_random_bytes(6), 'base64') from 1 for 8));
    -- Remove any non-alphanumeric characters and ensure it's 8 chars
    v_public_id := regexp_replace(v_public_id, '[^A-Z0-9]', '', 'g');
    
    -- If we don't have 8 characters, try again
    IF length(v_public_id) < 8 THEN
      v_attempts := v_attempts + 1;
      IF v_attempts >= v_max_attempts THEN
        RAISE EXCEPTION 'Failed to generate public ID after % attempts', v_max_attempts;
      END IF;
      CONTINUE;
    END IF;
    
    -- Ensure it's exactly 8 characters
    v_public_id := substring(v_public_id from 1 for 8);
    
    -- Check if this public_id already exists
    IF NOT EXISTS (SELECT 1 FROM projects WHERE public_id = v_public_id) THEN
      EXIT;
    END IF;
    
    v_attempts := v_attempts + 1;
    IF v_attempts >= v_max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique public ID after % attempts', v_max_attempts;
    END IF;
  END LOOP;
  
  RETURN v_public_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add public_id column to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'public_id'
  ) THEN
    ALTER TABLE projects ADD COLUMN public_id text UNIQUE;
  END IF;
END $$;

-- Create index on public_id for efficient lookups
CREATE INDEX IF NOT EXISTS idx_projects_public_id ON projects(public_id);

-- Populate existing projects with public IDs
DO $$
DECLARE
  project_record RECORD;
BEGIN
  FOR project_record IN 
    SELECT id FROM projects WHERE public_id IS NULL
  LOOP
    UPDATE projects 
    SET public_id = generate_project_public_id() 
    WHERE id = project_record.id;
  END LOOP;
END $$;

-- Make public_id NOT NULL after populating existing records
ALTER TABLE projects ALTER COLUMN public_id SET NOT NULL;

-- Function to automatically set public_id for new projects
CREATE OR REPLACE FUNCTION set_project_public_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.public_id IS NULL THEN
    NEW.public_id := generate_project_public_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new projects
DROP TRIGGER IF EXISTS trigger_set_project_public_id ON projects;
CREATE TRIGGER trigger_set_project_public_id
  BEFORE INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION set_project_public_id();

-- Function to get project UUID from public ID
CREATE OR REPLACE FUNCTION get_project_uuid_from_public_id(p_public_id text)
RETURNS uuid AS $$
DECLARE
  v_project_id uuid;
BEGIN
  SELECT id INTO v_project_id
  FROM projects
  WHERE public_id = p_public_id;
  
  RETURN v_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update validate_project_api_key function to also return public_id
CREATE OR REPLACE FUNCTION validate_project_api_key(p_api_key text)
RETURNS TABLE(
  is_valid boolean,
  project_id uuid,
  project_name text,
  public_project_id text,
  user_id uuid,
  key_name text
) AS $$
DECLARE
  v_project_id uuid;
  v_project_name text;
  v_public_project_id text;
  v_user_id uuid;
  v_key_name text;
  v_is_active boolean;
BEGIN
  -- Check if API key exists and is active
  SELECT 
    pak.project_id, 
    p.name, 
    p.public_id,
    p.user_id, 
    pak.name,
    pak.is_active
  INTO 
    v_project_id, 
    v_project_name, 
    v_public_project_id,
    v_user_id, 
    v_key_name,
    v_is_active
  FROM project_api_keys pak
  JOIN projects p ON pak.project_id = p.id
  WHERE pak.api_key = p_api_key;
  
  -- If key doesn't exist or is inactive, return false
  IF v_project_id IS NULL OR NOT v_is_active THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::text, NULL::text, NULL::uuid, NULL::text;
    RETURN;
  END IF;
  
  -- Update usage statistics
  UPDATE project_api_keys
  SET 
    last_used_at = now(),
    usage_count = usage_count + 1
  WHERE project_api_keys.api_key = p_api_key;
  
  -- Return success with public_id
  RETURN QUERY SELECT true, v_project_id, v_project_name, v_public_project_id, v_user_id, v_key_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update ingest_client_activity_log function to work with public project IDs
CREATE OR REPLACE FUNCTION ingest_client_activity_log(
  p_api_key text,
  p_api_secret text,
  p_public_project_id text,
  p_client_uuid text,
  p_action text,
  p_event text,
  p_event_details text,
  p_timestamp timestamptz
)
RETURNS TABLE(
  success boolean,
  message text,
  log_id uuid,
  error_code text
) AS $$
DECLARE
  v_user_id uuid;
  v_project_name text;
  v_public_project_id text;
  v_key_name text;
  v_key_id uuid;
  v_is_valid boolean;
  v_project_id uuid;
  v_log_id uuid;
  v_api_call_id uuid;
  v_start_time timestamptz;
BEGIN
  v_start_time := now();
  
  -- Convert public project ID to internal UUID
  SELECT get_project_uuid_from_public_id(p_public_project_id) INTO v_project_id;
  
  IF v_project_id IS NULL THEN
    RETURN QUERY SELECT false, 'Invalid project ID', NULL::uuid, 'INVALID_PROJECT_ID';
    RETURN;
  END IF;
  
  -- Validate API key and secret, and get project info
  SELECT 
    vpak.is_valid,
    vpak.user_id,
    vpak.project_name,
    vpak.public_project_id,
    vpak.key_name
  INTO 
    v_is_valid,
    v_user_id,
    v_project_name,
    v_public_project_id,
    v_key_name
  FROM validate_project_api_key(p_api_key) vpak;
  
  -- Get API key ID for tracking
  SELECT id INTO v_key_id FROM project_api_keys WHERE api_key = p_api_key;
  
  -- Check if API key is valid
  IF NOT v_is_valid OR v_user_id IS NULL THEN
    -- Track failed API call
    PERFORM track_api_call(
      v_key_id,
      v_user_id,
      v_project_id,
      '/functions/v1/ingest-logs',
      'log_ingestion',
      jsonb_build_object('error', 'invalid_api_key'),
      401,
      extract(milliseconds from (now() - v_start_time))::integer
    );
    
    RETURN QUERY SELECT false, 'Invalid API key', NULL::uuid, 'INVALID_API_KEY';
    RETURN;
  END IF;
  
  -- Verify API secret matches
  IF NOT EXISTS (
    SELECT 1 FROM project_api_keys 
    WHERE api_key = p_api_key 
    AND api_secret = p_api_secret 
    AND is_active = true
  ) THEN
    -- Track failed API call
    PERFORM track_api_call(
      v_key_id,
      v_user_id,
      v_project_id,
      '/functions/v1/ingest-logs',
      'log_ingestion',
      jsonb_build_object('error', 'invalid_api_secret'),
      401,
      extract(milliseconds from (now() - v_start_time))::integer
    );
    
    RETURN QUERY SELECT false, 'Invalid API secret', NULL::uuid, 'INVALID_API_SECRET';
    RETURN;
  END IF;
  
  -- Verify project belongs to the user and matches the API key
  IF NOT EXISTS (
    SELECT 1 FROM projects p
    JOIN project_api_keys pak ON p.id = pak.project_id
    WHERE p.id = v_project_id 
    AND p.user_id = v_user_id
    AND pak.api_key = p_api_key
  ) THEN
    -- Track failed API call
    PERFORM track_api_call(
      v_key_id,
      v_user_id,
      v_project_id,
      '/functions/v1/ingest-logs',
      'log_ingestion',
      jsonb_build_object('error', 'project_access_denied'),
      403,
      extract(milliseconds from (now() - v_start_time))::integer
    );
    
    RETURN QUERY SELECT false, 'Project not found or access denied', NULL::uuid, 'PROJECT_ACCESS_DENIED';
    RETURN;
  END IF;
  
  -- Validate action type
  IF p_action NOT IN ('create', 'update', 'delete', 'other') THEN
    -- Track failed API call
    PERFORM track_api_call(
      v_key_id,
      v_user_id,
      v_project_id,
      '/functions/v1/ingest-logs',
      'log_ingestion',
      jsonb_build_object('error', 'invalid_action'),
      400,
      extract(milliseconds from (now() - v_start_time))::integer
    );
    
    RETURN QUERY SELECT false, 'Invalid action type', NULL::uuid, 'INVALID_ACTION';
    RETURN;
  END IF;
  
  -- Insert the client activity log entry
  INSERT INTO client_activity_logs (
    user_id,
    project_id,
    client_uuid,
    action,
    event,
    event_details,
    timestamp
  ) VALUES (
    v_user_id,
    v_project_id,
    p_client_uuid,
    p_action,
    p_event,
    p_event_details,
    p_timestamp
  ) RETURNING id INTO v_log_id;
  
  -- Track successful API call
  PERFORM track_api_call(
    v_key_id,
    v_user_id,
    v_project_id,
    '/functions/v1/ingest-logs',
    'log_ingestion',
    jsonb_build_object(
      'client_uuid', p_client_uuid,
      'action', p_action,
      'event', p_event
    ),
    200,
    extract(milliseconds from (now() - v_start_time))::integer
  );
  
  -- Return success
  RETURN QUERY SELECT true, 'Client activity log entry created successfully', v_log_id, NULL::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;