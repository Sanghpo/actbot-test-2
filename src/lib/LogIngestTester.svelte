<script lang="ts">
  import { onMount } from 'svelte'
  import { projectStore, apiKeysStore, loadProjects, loadApiKeys } from '../stores/projectStore'
  import { ingestLog, type IngestLogsRequest } from '../stores/ingestService'
  
  let selectedProject = ''
  let selectedApiKey = ''
  let loading = false
  let error = ''
  let success = ''
  let response = ''
  
  // JSON payload editor
  let payloadJson = JSON.stringify({
    client_uuid: 'user-123',
    action: 'create',
    event: 'user_registration',
    event_details: 'New user registered with email',
    timestamp: new Date().toISOString()
  }, null, 2)
  
  onMount(() => {
    loadProjects()
    loadApiKeys()
  })
  
  $: filteredApiKeys = $apiKeysStore.filter(key => 
    !selectedProject || key.project_id === getProjectIdFromPublicId(selectedProject)
  )
  
  $: selectedApiKeyData = $apiKeysStore.find(key => key.id === selectedApiKey)
  
  function getProjectIdFromPublicId(publicId: string): string {
    const project = $projectStore.find(p => p.public_id === publicId)
    return project?.id || ''
  }
  
  async function handleSendLog() {
    if (!selectedProject || !selectedApiKey) {
      error = 'Please select a project and API key'
      return
    }
    
    if (!selectedApiKeyData) {
      error = 'Selected API key not found'
      return
    }
    
    let parsedPayload
    try {
      parsedPayload = JSON.parse(payloadJson)
    } catch (parseError) {
      error = 'Invalid JSON in payload. Please check your syntax.'
      return
    }
    
    // Validate required payload fields
    const requiredFields = ['client_uuid', 'action', 'event', 'event_details', 'timestamp']
    const missingFields = requiredFields.filter(field => !parsedPayload[field])
    
    if (missingFields.length > 0) {
      error = `Missing required payload fields: ${missingFields.join(', ')}`
      return
    }
    
    // Validate action type
    if (!['create', 'update', 'delete', 'other'].includes(parsedPayload.action)) {
      error = 'Action must be one of: create, update, delete, other'
      return
    }
    
    // Validate timestamp
    if (isNaN(new Date(parsedPayload.timestamp).getTime())) {
      error = 'Invalid timestamp format. Use ISO 8601 format (e.g., 2024-01-15T10:30:00Z)'
      return
    }
    
    loading = true
    error = ''
    success = ''
    response = ''
    
    const requestData: IngestLogsRequest = {
      API_key: selectedApiKeyData.api_key,
      API_secret: selectedApiKeyData.api_secret,
      public_project_id: selectedProject,
      type: 'log',
      payload: parsedPayload
    }
    
    try {
      const result = await ingestLog(requestData)
      
      if (result.success) {
        success = result.message || 'Log ingested successfully!'
        response = JSON.stringify(result, null, 2)
      } else {
        error = result.error || 'Failed to ingest log'
        response = JSON.stringify(result, null, 2)
      }
    } catch (err) {
      error = err.message || 'Failed to send log'
      response = JSON.stringify({ error: err.message }, null, 2)
    } finally {
      loading = false
    }
  }
  
  function clearResponse() {
    response = ''
    error = ''
    success = ''
  }
  
  function resetPayload() {
    payloadJson = JSON.stringify({
      client_uuid: 'user-123',
      action: 'create',
      event: 'user_registration',
      event_details: 'New user registered with email',
      timestamp: new Date().toISOString()
    }, null, 2)
  }
  
  function getProjectName(publicId: string) {
    const project = $projectStore.find(p => p.public_id === publicId)
    return project?.name || 'Unknown Project'
  }
  
  // Auto-filled request data for display
  $: autoFilledData = selectedProject && selectedApiKeyData ? {
    API_key: selectedApiKeyData.api_key,
    API_secret: selectedApiKeyData.api_secret,
    public_project_id: selectedProject,
    type: 'log'
  } : null
</script>

<div class="log-ingest-tester">
  <div class="tester-header">
    <h1>Log Ingest API Tester</h1>
    <p>Test the log ingestion API endpoint with your projects and API keys</p>
  </div>
  
  <div class="tester-config">
    <div class="config-section">
      <h3>Configuration</h3>
      <div class="config-grid">
        <div class="config-field">
          <label for="project">Project</label>
          <select id="project" bind:value={selectedProject}>
            <option value="">Select a project</option>
            {#each $projectStore as project (project.id)}
              <option value={project.public_id}>{project.name}</option>
            {/each}
          </select>
        </div>
        
        <div class="config-field">
          <label for="apiKey">API Key</label>
          <select id="apiKey" bind:value={selectedApiKey} disabled={!selectedProject}>
            <option value="">Select an API key</option>
            {#each filteredApiKeys as apiKey (apiKey.id)}
              <option value={apiKey.id}>{apiKey.name}</option>
            {/each}
          </select>
        </div>
      </div>
      
      {#if autoFilledData}
        <div class="config-summary">
          <h4>Auto-filled Request Data</h4>
          <div class="auto-filled-data">
            <div class="data-field">
              <span class="field-label">API_key:</span>
              <code class="field-value">{autoFilledData.API_key.substring(0, 12)}...</code>
            </div>
            <div class="data-field">
              <span class="field-label">API_secret:</span>
              <code class="field-value">{autoFilledData.API_secret.substring(0, 12)}...</code>
            </div>
            <div class="data-field">
              <span class="field-label">public_project_id:</span>
              <code class="field-value">{autoFilledData.public_project_id}</code>
            </div>
            <div class="data-field">
              <span class="field-label">type:</span>
              <code class="field-value">{autoFilledData.type}</code>
            </div>
          </div>
          <p class="config-note">
            <strong>Project:</strong> {getProjectName(selectedProject)} • 
            <strong>API Key:</strong> {selectedApiKeyData?.name} • 
            <strong>Endpoint:</strong> /functions/v1/ingest-logs
          </p>
        </div>
      {/if}
    </div>
  </div>
  
  {#if error}
    <div class="error-message">{error}</div>
  {/if}
  
  {#if success}
    <div class="success-message">{success}</div>
  {/if}
  
  <div class="payload-editor">
    <div class="editor-header">
      <h3>Payload Editor</h3>
      <div class="editor-actions">
        <button class="reset-button" on:click={resetPayload} disabled={loading}>
          Reset
        </button>
      </div>
    </div>
    
    <div class="editor-container">
      <label for="payloadEditor" class="editor-label">
        Edit the "payload" section of the request:
      </label>
      <textarea
        id="payloadEditor"
        bind:value={payloadJson}
        placeholder="Enter JSON payload..."
        disabled={loading}
        rows="12"
      ></textarea>
      
      <div class="payload-help">
        <h4>Required Fields:</h4>
        <ul>
          <li><code>client_uuid</code> - Unique identifier for the client</li>
          <li><code>action</code> - One of: create, update, delete, other</li>
          <li><code>event</code> - Event name</li>
          <li><code>event_details</code> - Event description</li>
          <li><code>timestamp</code> - ISO 8601 timestamp</li>
        </ul>
      </div>
    </div>
  </div>
  
  <div class="test-actions">
    <button 
      class="send-button" 
      on:click={handleSendLog} 
      disabled={loading || !selectedProject || !selectedApiKey}
    >
      {#if loading}
        <div class="spinner"></div>
        Sending Log...
      {:else}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
        </svg>
        Send Log
      {/if}
    </button>
    
    {#if response}
      <button class="clear-button" on:click={clearResponse} disabled={loading}>
        Clear Response
      </button>
    {/if}
  </div>
  
  {#if response}
    <div class="response-section">
      <h3>API Response</h3>
      <div class="response-container">
        <pre class="response-content">{response}</pre>
      </div>
    </div>
  {/if}
</div>

<style>
  .log-ingest-tester {
    padding: 2rem;
    max-width: 1000px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  
  .tester-header {
    margin-bottom: 1rem;
  }
  
  .tester-header h1 {
    margin: 0 0 0.5rem 0;
    color: var(--color-scale-gray-0);
    font-size: 2rem;
    font-weight: 600;
  }
  
  .tester-header p {
    margin: 0;
    color: var(--color-scale-gray-400);
    font-size: 1.125rem;
  }
  
  .tester-config {
    background: var(--color-scale-gray-900);
    border: 1px solid var(--color-scale-gray-800);
    border-radius: 12px;
    padding: 1.5rem;
  }
  
  .config-section h3 {
    margin: 0 0 1rem 0;
    color: var(--color-scale-gray-0);
    font-size: 1.125rem;
    font-weight: 600;
  }
  
  .config-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .config-field label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--color-scale-gray-300);
    font-size: 0.875rem;
  }
  
  .config-field select {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid var(--color-scale-gray-800);
    border-radius: 8px;
    font-size: 1rem;
    background: var(--color-scale-gray-800);
    color: var(--color-scale-gray-100);
    transition: border-color 0.2s ease;
  }
  
  .config-field select:focus {
    outline: none;
    border-color: var(--color-brand-500);
  }
  
  .config-summary {
    background: var(--color-scale-gray-800);
    border-radius: 8px;
    padding: 1.5rem;
    border-left: 4px solid var(--color-brand-500);
  }
  
  .config-summary h4 {
    margin: 0 0 1rem 0;
    color: var(--color-scale-gray-0);
    font-size: 1rem;
    font-weight: 600;
  }
  
  .auto-filled-data {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  
  .data-field {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .field-label {
    font-size: 0.875rem;
    color: var(--color-scale-gray-400);
    font-weight: 500;
  }
  
  .field-value {
    font-family: 'Courier New', monospace;
    font-size: 0.875rem;
    color: var(--color-brand-400);
    background: var(--color-scale-gray-700);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }
  
  .config-note {
    margin: 0;
    color: var(--color-scale-gray-300);
    font-size: 0.875rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-scale-gray-700);
  }
  
  .payload-editor {
    background: var(--color-scale-gray-900);
    border: 1px solid var(--color-scale-gray-800);
    border-radius: 12px;
    padding: 1.5rem;
  }
  
  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .editor-header h3 {
    margin: 0;
    color: var(--color-scale-gray-0);
    font-size: 1.125rem;
    font-weight: 600;
  }
  
  .editor-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .reset-button {
    background: var(--color-scale-gray-700);
    color: var(--color-scale-gray-200);
    border: none;
    border-radius: 6px;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .reset-button:hover:not(:disabled) {
    background: var(--color-scale-gray-600);
  }
  
  .reset-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .editor-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .editor-label {
    font-weight: 500;
    color: var(--color-scale-gray-300);
    font-size: 0.875rem;
  }
  
  .editor-container textarea {
    width: 100%;
    padding: 1rem;
    border: 2px solid var(--color-scale-gray-800);
    border-radius: 8px;
    font-size: 0.875rem;
    background: var(--color-scale-gray-800);
    color: var(--color-scale-gray-100);
    font-family: 'Courier New', monospace;
    resize: vertical;
    min-height: 200px;
    transition: border-color 0.2s ease;
  }
  
  .editor-container textarea:focus {
    outline: none;
    border-color: var(--color-brand-500);
  }
  
  .editor-container textarea:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .payload-help {
    background: var(--color-scale-gray-800);
    border-radius: 8px;
    padding: 1rem;
  }
  
  .payload-help h4 {
    margin: 0 0 0.5rem 0;
    color: var(--color-scale-gray-200);
    font-size: 0.875rem;
    font-weight: 600;
  }
  
  .payload-help ul {
    margin: 0;
    padding-left: 1.5rem;
    color: var(--color-scale-gray-400);
    font-size: 0.875rem;
  }
  
  .payload-help li {
    margin-bottom: 0.25rem;
  }
  
  .payload-help code {
    color: var(--color-brand-400);
    background: var(--color-scale-gray-700);
    padding: 0.125rem 0.25rem;
    border-radius: 3px;
    font-size: 0.8rem;
  }
  
  .test-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  
  .send-button {
    background: var(--color-brand-500);
    color: var(--color-scale-gray-0);
    border: none;
    border-radius: 8px;
    padding: 0.75rem 1.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
  }
  
  .send-button:hover:not(:disabled) {
    background: var(--color-brand-600);
    transform: translateY(-1px);
  }
  
  .send-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  .clear-button {
    background: var(--color-scale-gray-700);
    color: var(--color-scale-gray-200);
    border: none;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .clear-button:hover:not(:disabled) {
    background: var(--color-scale-gray-600);
  }
  
  .clear-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .response-section {
    background: var(--color-scale-gray-900);
    border: 1px solid var(--color-scale-gray-800);
    border-radius: 12px;
    padding: 1.5rem;
  }
  
  .response-section h3 {
    margin: 0 0 1rem 0;
    color: var(--color-scale-gray-0);
    font-size: 1.125rem;
    font-weight: 600;
  }
  
  .response-container {
    background: var(--color-scale-gray-800);
    border-radius: 8px;
    padding: 1rem;
    overflow-x: auto;
  }
  
  .response-content {
    margin: 0;
    font-family: 'Courier New', monospace;
    font-size: 0.875rem;
    color: var(--color-scale-gray-100);
    white-space: pre-wrap;
    word-break: break-word;
  }
  
  .error-message {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid #ef4444;
    color: #f87171;
    padding: 0.75rem 1rem;
    border-radius: 8px;
  }
  
  .success-message {
    background: rgba(34, 211, 238, 0.1);
    border: 1px solid var(--color-brand-500);
    color: var(--color-brand-400);
    padding: 0.75rem 1rem;
    border-radius: 8px;
  }
  
  @media (max-width: 768px) {
    .log-ingest-tester {
      padding: 1rem;
    }
    
    .config-grid {
      grid-template-columns: 1fr;
    }
    
    .auto-filled-data {
      grid-template-columns: 1fr;
    }
    
    .editor-header {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }
    
    .test-actions {
      flex-direction: column;
      align-items: stretch;
    }
  }
</style>