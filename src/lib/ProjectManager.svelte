<script lang="ts">
  import { onMount } from 'svelte'
  import { projectStore, apiKeysStore, loadProjects, loadApiKeys, createProject, updateProject, deleteProject, createApiKey, toggleApiKey, deleteApiKey } from '../stores/projectStore'
  import type { Project, ProjectApiKey, CreateProjectData, CreateApiKeyData, ApiKeyResponse } from '../types/project'
  
  let showCreateProject = false
  let showCreateApiKey = false
  let selectedProject: Project | null = null
  let newProject: CreateProjectData = { name: '', description: '' }
  let newApiKey: CreateApiKeyData = { project_id: '', name: '' }
  let loading = false
  let error = ''
  let success = ''
  let createdApiKey: ApiKeyResponse | null = null
  let showApiKeyModal = false
  
  onMount(() => {
    loadProjects()
    loadApiKeys()
  })
  
  async function handleCreateProject() {
    if (!newProject.name.trim()) {
      error = 'Project name is required'
      return
    }
    
    loading = true
    error = ''
    
    const result = await createProject(newProject)
    
    if (result.success) {
      success = 'Project created successfully!'
      newProject = { name: '', description: '' }
      showCreateProject = false
      setTimeout(() => success = '', 3000)
    } else {
      error = result.error || 'Failed to create project'
    }
    
    loading = false
  }
  
  async function handleDeleteProject(project: Project) {
    if (!confirm(`Are you sure you want to delete "${project.name}"? This will also delete all API keys for this project.`)) {
      return
    }
    
    loading = true
    error = ''
    
    const result = await deleteProject(project.id)
    
    if (result.success) {
      success = 'Project deleted successfully!'
      setTimeout(() => success = '', 3000)
    } else {
      error = result.error || 'Failed to delete project'
    }
    
    loading = false
  }
  
  async function handleCreateApiKey() {
    if (!newApiKey.name.trim()) {
      error = 'API key name is required'
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
  
  function openCreateApiKey(project: Project) {
    selectedProject = project
    newApiKey.project_id = project.id
    showCreateApiKey = true
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
  
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString()
  }
  
  function getProjectApiKeys(projectId: string) {
    return $apiKeysStore.filter(key => key.project_id === projectId)
  }
</script>

<div class="project-manager">
  <div class="header">
    <h2>Project Management</h2>
    <button class="primary-button" on:click={() => showCreateProject = true}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      New Project
    </button>
  </div>
  
  {#if error}
    <div class="error-message">{error}</div>
  {/if}
  
  {#if success}
    <div class="success-message">{success}</div>
  {/if}
  
  <div class="projects-grid">
    {#each $projectStore as project (project.id)}
      <div class="project-card">
        <div class="project-header">
          <div class="project-title">
            <h3>{project.name}</h3>
            <div class="project-id">
              <span class="id-label">Project ID:</span>
              <code class="public-id">{project.public_id}</code>
              <button class="copy-id-button" on:click={() => copyToClipboard(project.public_id)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>
          </div>
          <div class="project-actions">
            <button class="action-button" on:click={() => openCreateApiKey(project)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <circle cx="12" cy="16" r="1"></circle>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              New API Key
            </button>
            <button class="action-button delete" on:click={() => handleDeleteProject(project)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3,6 5,6 21,6"></polyline>
                <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
              </svg>
            </button>
          </div>
        </div>
        
        {#if project.description}
          <p class="project-description">{project.description}</p>
        {/if}
        
        <div class="project-meta">
          <span>Created: {formatDate(project.created_at)}</span>
          <span>API Keys: {getProjectApiKeys(project.id).length}</span>
        </div>
        
        <div class="api-keys-section">
          <h4>API Keys</h4>
          {#each getProjectApiKeys(project.id) as key (key.id)}
            <div class="api-key-item">
              <div class="api-key-info">
                <span class="api-key-name">{key.name}</span>
                <span class="api-key-status" class:active={key.is_active} class:inactive={!key.is_active}>
                  {key.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div class="api-key-actions">
                <button class="small-button" on:click={() => copyToClipboard(key.api_key)}>
                  Copy Key
                </button>
                <button class="small-button" on:click={() => handleToggleApiKey(key)}>
                  {key.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button class="small-button delete" on:click={() => handleDeleteApiKey(key)}>
                  Delete
                </button>
              </div>
            </div>
          {:else}
            <p class="no-api-keys">No API keys yet. Create one to get started.</p>
          {/each}
        </div>
      </div>
    {:else}
      <div class="empty-state">
        <div class="empty-icon">📁</div>
        <h3>No projects yet</h3>
        <p>Create your first project to start managing API keys.</p>
        <button class="primary-button" on:click={() => showCreateProject = true}>
          Create Project
        </button>
      </div>
    {/each}
  </div>
</div>

<!-- Create Project Modal -->
{#if showCreateProject}
  <div class="modal-overlay" on:click={() => showCreateProject = false}>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h3>Create New Project</h3>
        <button class="close-button" on:click={() => showCreateProject = false}>×</button>
      </div>
      
      <form on:submit|preventDefault={handleCreateProject}>
        <div class="form-group">
          <label for="projectName">Project Name</label>
          <input
            id="projectName"
            type="text"
            bind:value={newProject.name}
            placeholder="My Awesome Project"
            required
            disabled={loading}
          />
        </div>
        
        <div class="form-group">
          <label for="projectDescription">Description (Optional)</label>
          <textarea
            id="projectDescription"
            bind:value={newProject.description}
            placeholder="Describe your project..."
            disabled={loading}
          ></textarea>
        </div>
        
        <div class="modal-actions">
          <button type="button" class="secondary-button" on:click={() => showCreateProject = false}>
            Cancel
          </button>
          <button type="submit" class="primary-button" disabled={loading}>
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Create API Key Modal -->
{#if showCreateApiKey}
  <div class="modal-overlay" on:click={() => showCreateApiKey = false}>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-header">
        <h3>Create API Key for {selectedProject?.name}</h3>
        <button class="close-button" on:click={() => showCreateApiKey = false}>×</button>
      </div>
      
      <form on:submit|preventDefault={handleCreateApiKey}>
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
  .project-manager {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }
  
  .header h2 {
    margin: 0;
    color: var(--color-scale-gray-0);
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
  
  .projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 1.5rem;
  }
  
  .project-card {
    background: var(--color-scale-gray-900);
    border: 1px solid var(--color-scale-gray-800);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
  
  .project-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }
  
  .project-title {
    flex: 1;
  }
  
  .project-header h3 {
    margin: 0 0 0.5rem 0;
    color: var(--color-scale-gray-0);
    font-size: 1.25rem;
  }
  
  .project-id {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }
  
  .id-label {
    font-size: 0.75rem;
    color: var(--color-scale-gray-500);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .public-id {
    font-family: 'Courier New', monospace;
    font-size: 0.875rem;
    color: var(--color-brand-400);
    background: var(--color-scale-gray-800);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-weight: 600;
  }
  
  .copy-id-button {
    background: none;
    border: none;
    color: var(--color-scale-gray-500);
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .copy-id-button:hover {
    background: var(--color-scale-gray-800);
    color: var(--color-brand-400);
  }
  
  .project-actions {
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
    gap: 0.25rem;
    font-size: 0.875rem;
  }
  
  .action-button:hover {
    background: var(--color-scale-gray-700);
    color: var(--color-scale-gray-200);
  }
  
  .action-button.delete:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }
  
  .project-description {
    color: var(--color-scale-gray-400);
    margin-bottom: 1rem;
    line-height: 1.5;
  }
  
  .project-meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.875rem;
    color: var(--color-scale-gray-500);
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--color-scale-gray-800);
  }
  
  .api-keys-section h4 {
    margin: 0 0 1rem 0;
    color: var(--color-scale-gray-200);
    font-size: 1rem;
  }
  
  .api-key-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: var(--color-scale-gray-800);
    border-radius: 8px;
    margin-bottom: 0.5rem;
  }
  
  .api-key-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .api-key-name {
    font-weight: 500;
    color: var(--color-scale-gray-100);
  }
  
  .api-key-status {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-weight: 500;
    width: fit-content;
  }
  
  .api-key-status.active {
    background: rgba(34, 211, 238, 0.2);
    color: var(--color-brand-400);
  }
  
  .api-key-status.inactive {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }
  
  .api-key-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .small-button {
    background: var(--color-scale-gray-700);
    border: 1px solid var(--color-scale-gray-600);
    border-radius: 4px;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;
    color: var(--color-scale-gray-200);
  }
  
  .small-button:hover {
    background: var(--color-scale-gray-600);
    border-color: var(--color-scale-gray-500);
  }
  
  .small-button.delete:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.3);
  }
  
  .no-api-keys {
    color: var(--color-scale-gray-500);
    font-style: italic;
    text-align: center;
    padding: 1rem;
  }
  
  .empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 3rem;
    color: var(--color-scale-gray-500);
  }
  
  .empty-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
  
  .empty-state h3 {
    margin: 0 0 0.5rem 0;
    color: var(--color-scale-gray-300);
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
  .form-group textarea {
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
  .form-group textarea:focus {
    outline: none;
    border-color: var(--color-brand-500);
  }
  
  .form-group textarea {
    resize: vertical;
    min-height: 80px;
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
    .project-manager {
      padding: 1rem;
    }
    
    .projects-grid {
      grid-template-columns: 1fr;
    }
    
    .project-header {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }
    
    .project-actions {
      justify-content: flex-end;
    }
    
    .api-key-item {
      flex-direction: column;
      align-items: stretch;
      gap: 0.75rem;
    }
    
    .api-key-actions {
      justify-content: center;
    }
  }
</style>