/*
  # Implement Log Ingestion API Database Schema

  1. New Tables
    - `client_activity_logs` - Stores activity logs from client applications
    - `api_calls` - Tracks all API requests for analytics
    - `client_user_stories` - AI-generated summaries of client user activity

  2. Renamed Tables
    - Rename existing `logs` table to `internal_app_logs` for internal use

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for data isolation
    - Service role access for API operations

  4. Functions
    - Update log ingestion function to work with new schema
    - Add API call tracking function
*/

-- First, rename the existing logs table to avoid conflicts
ALTER TABLE IF EXISTS logs RENAME TO internal_app_logs;

-- Create client_activity_logs table for external API logs
CREATE TABLE IF NOT EXISTS client_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  client_uuid text NOT NULL,
  action text NOT NULL CHECK (action IN ('create', 'update', 'delete', 'other')),
  event text NOT NULL,
  event_details text NOT NULL,
  timestamp timestamptz NOT NULL,
  ingested_at timestamptz DEFAULT now()
);

-- Enable RLS on client_activity_logs
ALTER TABLE client_activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for client_activity_logs
CREATE POLICY "Users can view logs for own projects"
  ON client_activity_logs
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Service role can access all logs (for API ingestion)
CREATE POLICY "Service role can access all client activity logs"
  ON client_activity_logs
  FOR ALL
  TO service_role
  USING (true);

-- Create api_calls table for tracking API usage
CREATE TABLE IF NOT EXISTS api_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id uuid REFERENCES project_api_keys(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  call_type text NOT NULL,
  request_metadata jsonb DEFAULT '{}'::jsonb,
  response_status integer,
  response_time_ms integer,
  called_at timestamptz DEFAULT now()
);

-- Enable RLS on api_calls
ALTER TABLE api_calls ENABLE ROW LEVEL SECURITY;

-- Create policies for api_calls
CREATE POLICY "Users can view own API calls"
  ON api_calls
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Service role can access all API calls
CREATE POLICY "Service role can access all API calls"
  ON api_calls
  FOR ALL
  TO service_role
  USING (true);

-- Create client_user_stories table for AI-generated summaries
CREATE TABLE IF NOT EXISTS client_user_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  client_uuid text NOT NULL,
  story_text text NOT NULL,
  last_activity_log_id uuid REFERENCES client_activity_logs(id) ON DELETE SET NULL,
  generated_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on client_user_stories
ALTER TABLE client_user_stories ENABLE ROW LEVEL SECURITY;

-- Create policies for client_user_stories
CREATE POLICY "Users can view stories for own projects"
  ON client_user_stories
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage stories for own projects"
  ON client_user_stories
  FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Service role can access all stories
CREATE POLICY "Service role can access all client user stories"
  ON client_user_stories
  FOR ALL
  TO service_role
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_activity_logs_user_id ON client_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_client_activity_logs_project_id ON client_activity_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_client_activity_logs_client_uuid ON client_activity_logs(client_uuid);
CREATE INDEX IF NOT EXISTS idx_client_activity_logs_timestamp ON client_activity_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_client_activity_logs_ingested_at ON client_activity_logs(ingested_at);
CREATE INDEX IF NOT EXISTS idx_client_activity_logs_action ON client_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_client_activity_logs_event ON client_activity_logs(event);

CREATE INDEX IF NOT EXISTS idx_api_calls_user_id ON api_calls(user_id);
CREATE INDEX IF NOT EXISTS idx_api_calls_project_id ON api_calls(project_id);
CREATE INDEX IF NOT EXISTS idx_api_calls_api_key_id ON api_calls(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_calls_called_at ON api_calls(called_at);
CREATE INDEX IF NOT EXISTS idx_api_calls_endpoint ON api_calls(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_calls_call_type ON api_calls(call_type);

CREATE INDEX IF NOT EXISTS idx_client_user_stories_user_id ON client_user_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_client_user_stories_project_id ON client_user_stories(project_id);
CREATE INDEX IF NOT EXISTS idx_client_user_stories_client_uuid ON client_user_stories(client_uuid);
CREATE INDEX IF NOT EXISTS idx_client_user_stories_updated_at ON client_user_stories(updated_at);

-- Function to track API calls
CREATE OR REPLACE FUNCTION track_api_call(
  p_api_key_id uuid,
  p_user_id uuid,
  p_project_id uuid,
  p_endpoint text,
  p_call_type text,
  p_request_metadata jsonb DEFAULT '{}'::jsonb,
  p_response_status integer DEFAULT NULL,
  p_response_time_ms integer DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_call_id uuid;
BEGIN
  INSERT INTO api_calls (
    api_key_id,
    user_id,
    project_id,
    endpoint,
    call_type,
    request_metadata,
    response_status,
    response_time_ms
  ) VALUES (
    p_api_key_id,
    p_user_id,
    p_project_id,
    p_endpoint,
    p_call_type,
    p_request_metadata,
    p_response_status,
    p_response_time_ms
  ) RETURNING id INTO v_call_id;
  
  RETURN v_call_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated function to ingest client activity log entry via API
CREATE OR REPLACE FUNCTION ingest_client_activity_log(
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
  v_key_id uuid;
  v_is_valid boolean;
  v_log_id uuid;
  v_api_call_id uuid;
  v_start_time timestamptz;
BEGIN
  v_start_time := now();
  
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
  
  -- Get API key ID for tracking
  SELECT id INTO v_key_id FROM project_api_keys WHERE api_key = p_api_key;
  
  -- Check if API key is valid
  IF NOT v_is_valid OR v_user_id IS NULL THEN
    -- Track failed API call
    PERFORM track_api_call(
      v_key_id,
      v_user_id,
      p_project_id,
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
      p_project_id,
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
    WHERE p.id = p_project_id 
    AND p.user_id = v_user_id
    AND pak.api_key = p_api_key
  ) THEN
    -- Track failed API call
    PERFORM track_api_call(
      v_key_id,
      v_user_id,
      p_project_id,
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
      p_project_id,
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
    p_project_id,
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
    p_project_id,
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

-- Function to update client_user_stories updated_at timestamp
CREATE OR REPLACE FUNCTION update_client_user_stories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for client_user_stories updated_at
CREATE TRIGGER update_client_user_stories_updated_at
  BEFORE UPDATE ON client_user_stories
  FOR EACH ROW
  EXECUTE FUNCTION update_client_user_stories_updated_at();