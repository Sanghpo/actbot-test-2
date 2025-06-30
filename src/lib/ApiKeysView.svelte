<script lang="ts">
  import { onMount } from 'svelte'
  import { projectStore, apiKeysStore, loadProjects, loadApiKeys, createApiKey, toggleApiKey, deleteApiKey } from '../stores/projectStore'
  import type { ProjectApiKey, CreateApiKeyData, ApiKeyResponse } from '../types/project'
  
  let showCreateApiKey = false
  let newApiKey: CreateApiKeyData = { project_id: '', name: '' }
  let loading = false
  let error = ''
  let success = ''
  let createdApiKey: ApiKeyResponse | null = null
  let showApiKeyModal = false
  let searchTerm = ''
  let filterProject = ''
  let filterStatus = 'all'
  
  onMount(() => {
    loadProjects()
    loadApiKeys()
  })
  
  $: filteredApiKeys = $apiKeysStore.filter(key => {
    const matchesSearch = key.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesProject = !filterProject || key.project_id === filterProject
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && key.is_active) ||
      (filterStatus === 'inactive' && !key.is_active)
    
    return matchesSearch && matchesProject && matchesStatus
  })
  
  async function handleCreateApiKey() {
    if (!newApiKey.name.trim() || !newApiKey.project_id) {
      error = 'Please fill in all fields'
      return
    }
    
    loading = true
    error = ''
    
    const result = await createApiKey(newApiKey)
    
    if (result.success && result.data) {
      createdApiKey = result.data
      showApiKeyModal = true
      newApiKey = { project_id: '', name: '' }
      showCreateApiKey = false
      success = 'API key created successfully!'
      setTimeout(() => success = '', 3000)
    } else {
      error = result.error || 'Failed to create API key'
    }
    
    loading = false
  }
  
  async function handleToggleApiKey(key: ProjectApiKey) {
    loading = true
    error = ''
    
    const result = await toggleApiKey(key.id, !key.is_active)
    
    if (result.success) {
      success = `API key ${key.is_active ? 'deactivated' : 'activated'} successfully!`
      setTimeout(() => success = '', 3000)
    } else {
      error = result.error || 'Failed to toggle API key'
    }
    
    loading = false
  }
  
  async function handleDeleteApiKey(key: ProjectApiKey) {
    if (!confirm(`Are you sure you want to delete the API key "${key.name}"?`)) {
      return
    }
    
    loading = true
    error = ''
    
    const result = await deleteApiKey(key.id)
    
    if (result.success) {
      success = 'API key deleted successfully!'
      setTimeout(() => success = '', 3000)
    } else {
      error = result.error || 'Failed to delete API key'
    }
    
    loading = false
  }
  
  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      success = 'Copied to clipboard!'
      setTimeout(() => success = '', 2000)
    }).catch(() => {
      error = 'Failed to copy to clipboard'
      setTimeout(() => error = '', 2000)
    })
  }
  
  function getProjectName(projectId: string) {
    const project = $projectStore.find(p => p.id === projectId)
    return project?.name || 'Unknown Project'
  }
  
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString()
  }
</script>

<div class="api-keys-view">
  <div class="header">
    <div class="header-content">
      <h1>API Keys</h1>
      <p>Manage your API keys and monitor their usage</p>
    </div>
    <button class="primary-button" on:click={() => showCreateApiKey = true}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      Create API Key
    </button>
  </div>
  
  {#if error}
    <div class="error-message">{error}</div>
  {/if}
  
  {#if success}
    <div class="success-message">{success}</div>
  {/if}
  
  <div class="filters">
    <div class="search-box">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
      </svg>
      <input
        type="text"
        placeholder="Search API keys..."
        bind:value={searchTerm}
      />
    </div>
    
    <select bind:value={filterProject} class="filter-select">
      <option value="">All Projects</option>
      {#each $projectStore as project (project.id)}
        <option value={project.id}>{project.name}</option>
      {/each}
    </select>
    
    <select bind:value={filterStatus} class="filter-select">
      <option value="all">All Status</option>
      <option value="active">Active</option>
      <option value="inactive">Inactive</option>
    </select>
  </div>
  
  <div class="api-keys-table">
    <div class="table-header">
      <div class="header-cell">Name</div>
      <div class="header-cell">Project</div>
      <div class="header-cell">Status</div>
      <div class="header-cell">Usage</div>
      <div class="header-cell">Last Used</div>
      <div class="header-cell">Created</div>
      <div class="header-cell">Actions</div>
    </div>
    
    {#each filteredApiKeys as key (key.id)}
      <div class="table-row">
        <div class="cell">
          <div class="key-info">
            <span class="key-name">{key.name}</span>
            <code class="key-preview">{key.api_key.substring(0, 12)}...</code>
          </div>
        </div>
        <div class="cell">
          <span class="project-name">{getProjectName(key.project_id)}</span>
        </div>
        <div class="cell">
          <span class="status-badge" class:active={key.is_active} class:inactive={!key.is_active}>
            {key.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div class="cell">
          <span class="usage-count">{key.usage_count.toLocaleString()} requests</span>
        </div>
        <div class="cell">
          <span class="last-used">
            {key.last_used_at ? formatDate(key.last_used_at) : 'Never'}
          </span>
        </div>
        <div class="cell">
          <span class="created-date">{formatDate(key.created_at)}</span>
        </div>
        <div class="cell">
          <div class="actions">
            <button class="action-button" on:click={() => copyToClipboard(key.api_key)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
            <button class="action-button" on:click={() => handleToggleApiKey(key)}>
              {#if key.is_active}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              {:else}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
              {/if}
            </button>
            <button class="action-button delete" on:click={() => handleDeleteApiKey(key)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3,6 5,6 21,6"></polyline>
                <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    {:else}
      <div class="empty-state">
        <div class="empty-icon">🔑</div>
        <h3>No API keys found</h3>
        <p>Create your first API key to start integrating with our platform.</p>
        <button class="primary-button" on:click={() => showCreateApiKey = true}>
          Create API Key
        </button>
      </div>
    {/each}
  </div>
</div>

<!-- Create API Key Modal -->
{#if showCreateApiKey}
  <div class="modal-overlay" on:click={() => showCreateApiKey = false}>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h3>Create New API Key</h3>
        <button class="close-button" on:click={() => showCreateApiKey = false}>×</button>
      </div>
      
      <form on:submit|preventDefault={handleCreateApiKey}>
        <div class="form-group">
          <label for="projectSelect">Project</label>
          <select
            id="projectSelect"
            bind:value={newApiKey.project_id}
            required
            disabled={loading}
          >
            <option value="">Select a project</option>
            {#each $projectStore as project (project.id)}
              <option value={project.id}>{project.name}</option>
            {/each}
          </select>
        </div>
        
        <div class="form-group">
          <label for="apiKeyName">API Key Name</label>
          <input
            id="apiKeyName"
            type="text"
            bind:value={newApiKey.name}
            placeholder="Production API Key"
            required
            disabled={loading}
          />
        </div>
        
        <div class="modal-actions">
          <button type="button" class="secondary-button" on:click={() => showCreateApiKey = false}>
            Cancel
          </button>
          <button type="submit" class="primary-button" disabled={loading}>
            {loading ? 'Creating...' : 'Create API Key'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- API Key Created Modal -->
{#if showApiKeyModal && createdApiKey}
  <div class="modal-overlay" on:click={() => showApiKeyModal = false}>
    <div class="modal api-key-modal" on:click|stopPropagation>
      <div class="modal-header">
        <h3>API Key Created Successfully!</h3>
        <button class="close-button" on:click={() => showApiKeyModal = false}>×</button>
      </div>
      
      <div class="api-key-details">
        <div class="warning-message">
          <strong>⚠️ Important:</strong> Save these credentials now. You won't be able to see the secret again.
        </div>
        
        <div class="credential-item">
          <label>API Key:</label>
          <div class="credential-value">
            <code>{createdApiKey.api_key}</code>
            <button class="copy-button" on:click={() => copyToClipboard(createdApiKey.api_key)}>
              Copy
            </button>
          </div>
        </div>
        
        <div class="credential-item">
          <label>API Secret:</label>
          <div class="credential-value">
            <code>{createdApiKey.api_secret}</code>
            <button class="copy-button" on:click={() => copyToClipboard(createdApiKey.api_secret)}>
              Copy
            </button>
          </div>
        </div>
      </div>
      
      <div class="modal-actions">
        <button class="primary-button" on:click={() => showApiKeyModal = false}>
          I've Saved These Credentials
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .api-keys-view {
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
  }
  
  .header-content h1 {
    margin: 0 0 0.5rem 0;
    color: var(--color-scale-gray-0);
    font-size: 2rem;
    font-weight: 700;
  }
  
  .header-content p {
    margin: 0;
    color: var(--color-scale-gray-400);
    font-size: 1.1rem;
  }
  
  .primary-button {
    background: var(--color-brand-500);
    color: var(--color-scale-gray-0);
    border: none;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .primary-button:hover {
    background: var(--color-brand-600);
    transform: translateY(-1px);
  }
  
  .secondary-button {
    background: var(--color-scale-gray-800);
    color: var(--color-scale-gray-100);
    border: 2px solid var(--color-scale-gray-700);
    border-radius: 8px;
    padding: 0.75rem 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .secondary-button:hover {
    border-color: var(--color-scale-gray-600);
    background: var(--color-scale-gray-700);
  }
  
  .filters {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
    align-items: center;
  }
  
  .search-box {
    position: relative;
    flex: 1;
    max-width: 400px;
  }
  
  .search-box svg {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-scale-gray-500);
  }
  
  .search-box input {
    width: 100%;
    padding: 0.75rem 1rem 0.75rem 3rem;
    border: 2px solid var(--color-scale-gray-800);
    border-radius: 8px;
    font-size: 1rem;
    background: var(--color-scale-gray-900);
    color: var(--color-scale-gray-100);
    transition: border-color 0.2s ease;
  }
  
  .search-box input:focus {
    outline: none;
    border-color: var(--color-brand-500);
  }
  
  .filter-select {
    padding: 0.75rem 1rem;
    border: 2px solid var(--color-scale-gray-800);
    border-radius: 8px;
    font-size: 1rem;
    background: var(--color-scale-gray-900);
    color: var(--color-scale-gray-100);
    cursor: pointer;
    transition: border-color 0.2s ease;
  }
  
  .filter-select:focus {
    outline: none;
    border-color: var(--color-brand-500);
  }
  
  .api-keys-table {
    background: var(--color-scale-gray-900);
    border: 1px solid var(--color-scale-gray-800);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
  
  .table-header {
    display: grid;
    grid-template-columns: 2fr 1.5fr 1fr 1fr 1fr 1fr 1fr;
    background: var(--color-scale-gray-800);
    border-bottom: 1px solid var(--color-scale-gray-700);
  }
  
  .header-cell {
    padding: 1rem;
    font-weight: 600;
    color: var(--color-scale-gray-300);
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .table-row {
    display: grid;
    grid-template-columns: 2fr 1.5fr 1fr 1fr 1fr 1fr 1fr;
    border-bottom: 1px solid var(--color-scale-gray-800);
    transition: background 0.2s ease;
  }
  
  .table-row:hover {
    background: var(--color-scale-gray-800);
  }
  
  .table-row:last-child {
    border-bottom: none;
  }
  
  .cell {
    padding: 1rem;
    display: flex;
    align-items: center;
  }
  
  .key-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .key-name {
    font-weight: 500;
    color: var(--color-scale-gray-100);
  }
  
  .key-preview {
    font-family: 'Courier New', monospace;
    font-size: 0.75rem;
    color: var(--color-scale-gray-400);
    background: var(--color-scale-gray-800);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }
  
  .project-name {
    color: var(--color-scale-gray-300);
    font-weight: 500;
  }
  
  .status-badge {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-weight: 500;
  }
  
  .status-badge.active {
    background: rgba(34, 211, 238, 0.2);
    color: var(--color-brand-400);
  }
  
  .status-badge.inactive {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }
  
  .usage-count {
    color: var(--color-scale-gray-300);
    font-weight: 500;
  }
  
  .last-used,
  .created-date {
    color: var(--color-scale-gray-400);
    font-size: 0.875rem;
  }
  
  .actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .action-button {
    background: var(--color-scale-gray-800);
    border: none;
    border-radius: 6px;
    padding: 0.5rem;
    cursor: pointer;
    color: var(--color-scale-gray-400);
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .action-button:hover {
    background: var(--color-scale-gray-700);
    color: var(--color-scale-gray-200);
  }
  
  .action-button.delete:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }
  
  .empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 4rem 2rem;
    color: var(--color-scale-gray-500);
  }
  
  .empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }
  
  .empty-state h3 {
    margin: 0 0 0.5rem 0;
    color: var(--color-scale-gray-300);
    font-size: 1.5rem;
  }
  
  .empty-state p {
    margin: 0 0 2rem 0;
    font-size: 1.1rem;
  }
  
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }
  
  .modal {
    background: var(--color-scale-gray-900);
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    border: 1px solid var(--color-scale-gray-800);
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-scale-gray-800);
  }
  
  .modal-header h3 {
    margin: 0;
    color: var(--color-scale-gray-0);
  }
  
  .close-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--color-scale-gray-400);
    padding: 0.25rem;
  }
  
  .close-button:hover {
    color: var(--color-scale-gray-200);
  }
  
  .modal form {
    padding: 1.5rem;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--color-scale-gray-300);
  }
  
  .form-group input,
  .form-group select {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid var(--color-scale-gray-800);
    border-radius: 8px;
    font-size: 1rem;
    background: var(--color-scale-gray-800);
    color: var(--color-scale-gray-100);
    transition: border-color 0.2s ease;
  }
  
  .form-group input:focus,
  .form-group select:focus {
    outline: none;
    border-color: var(--color-brand-500);
  }
  
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding: 1.5rem;
    border-top: 1px solid var(--color-scale-gray-800);
  }
  
  .api-key-modal {
    max-width: 600px;
  }
  
  .api-key-details {
    padding: 1.5rem;
  }
  
  .warning-message {
    background: rgba(251, 191, 36, 0.1);
    border: 1px solid var(--color-special-orange-500);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    color: var(--color-special-orange-400);
  }
  
  .credential-item {
    margin-bottom: 1.5rem;
  }
  
  .credential-item label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--color-scale-gray-300);
  }
  
  .credential-value {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: var(--color-scale-gray-800);
    border: 1px solid var(--color-scale-gray-700);
    border-radius: 8px;
    padding: 0.75rem;
  }
  
  .credential-value code {
    flex: 1;
    font-family: 'Courier New', monospace;
    font-size: 0.875rem;
    word-break: break-all;
    color: var(--color-scale-gray-100);
  }
  
  .copy-button {
    background: var(--color-brand-500);
    color: var(--color-scale-gray-0);
    border: none;
    border-radius: 4px;
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
    cursor: pointer;
    transition: background 0.2s ease;
  }
  
  .copy-button:hover {
    background: var(--color-brand-600);
  }
  
  .error-message {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid #ef4444;
    color: #f87171;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  }
  
  .success-message {
    background: rgba(34, 211, 238, 0.1);
    border: 1px solid var(--color-brand-500);
    color: var(--color-brand-400);
    padding: 0.75rem 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  }
  
  @media (max-width: 768px) {
    .api-keys-view {
      padding: 1rem;
    }
    
    .header {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }
    
    .filters {
      flex-direction: column;
      align-items: stretch;
    }
    
    .search-box {
      max-width: none;
    }
    
    .table-header,
    .table-row {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }
    
    .header-cell,
    .cell {
      padding: 0.75rem;
    }
    
    .table-header {
      display: none;
    }
    
    .cell {
      border-bottom: 1px solid var(--color-scale-gray-800);
    }
    
    .cell:before {
      content: attr(data-label);
      font-weight: 600;
      color: var(--color-scale-gray-300);
      margin-right: 1rem;
    }
  }
</style>