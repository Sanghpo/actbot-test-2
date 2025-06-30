/*
  # Add Logs Table for API Log Ingestion

  1. New Tables
    - `logs` - Store log entries from API calls
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `project_id` (uuid, foreign key to projects)
      - `client_uuid` (text) - Client identifier from API call
      - `action` (text) - Type of action (create/update/delete/other)
      - `event` (text) - Event name
      - `event_details` (text) - Event details/description
      - `timestamp` (timestamptz) - When the event occurred
      - `created_at` (timestamptz) - When the log was ingested

  2. Security
    - Enable RLS on logs table
    - Users can only access logs for their own projects
    - Service role can access all logs (for API ingestion)

  3. Indexes
    - Add indexes for performance on common query patterns
*/

-- Create logs table
CREATE TABLE IF NOT EXISTS logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  client_uuid text NOT NULL,
  action text NOT NULL CHECK (action IN ('create', 'update', 'delete', 'other')),
  event text NOT NULL,
  event_details text NOT NULL,
  timestamp timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on logs
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Create policies for logs (users can access logs for their projects)
CREATE POLICY "Users can view logs for own projects"
  ON logs
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Service role can access all logs (for API ingestion)
CREATE POLICY "Service role can access all logs"
  ON logs
  FOR ALL
  TO service_role
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_project_id ON logs(project_id);
CREATE INDEX IF NOT EXISTS idx_logs_client_uuid ON logs(client_uuid);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at);
CREATE INDEX IF NOT EXISTS idx_logs_action ON logs(action);
CREATE INDEX IF NOT EXISTS idx_logs_event ON logs(event);

-- Function to ingest log entry via API
CREATE OR REPLACE FUNCTION ingest_log_entry(
  p_api_key text,
  p_api_secret text,
  p_project_id uuid,
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
  v_key_name text;
  v_is_valid boolean;
  v_log_id uuid;
BEGIN
  -- Validate API key and secret, and get project info
  SELECT 
    vpak.is_valid,
    vpak.user_id,
    vpak.project_name,
    vpak.key_name
  INTO 
    v_is_valid,
    v_user_id,
    v_project_name,
    v_key_name
  FROM validate_project_api_key(p_api_key) vpak;
  
  -- Check if API key is valid
  IF NOT v_is_valid OR v_user_id IS NULL THEN
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
    RETURN QUERY SELECT false, 'Invalid API secret', NULL::uuid, 'INVALID_API_SECRET';
    RETURN;
  END IF;
  
  -- Verify project belongs to the user and matches the API key
  IF NOT EXISTS (
    SELECT 1 FROM projects p
    JOIN project_api_keys pak ON p.id = pak.project_id
    WHERE p.id = p_project_id 
    AND p.user_id = v_user_id
    AND pak.api_key = p_api_key
  ) THEN
    RETURN QUERY SELECT false, 'Project not found or access denied', NULL::uuid, 'PROJECT_ACCESS_DENIED';
    RETURN;
  END IF;
  
  -- Validate action type
  IF p_action NOT IN ('create', 'update', 'delete', 'other') THEN
    RETURN QUERY SELECT false, 'Invalid action type', NULL::uuid, 'INVALID_ACTION';
    RETURN;
  END IF;
  
  -- Insert the log entry
  INSERT INTO logs (
    user_id,
    project_id,
    client_uuid,
    action,
    event,
    event_details,
    timestamp
  ) VALUES (
    v_user_id,
    p_project_id,
    p_client_uuid,
    p_action,
    p_event,
    p_event_details,
    p_timestamp
  ) RETURNING id INTO v_log_id;
  
  -- Return success
  RETURN QUERY SELECT true, 'Log entry created successfully', v_log_id, NULL::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;