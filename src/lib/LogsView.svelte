<script lang="ts">
  import { onMount } from 'svelte'
  import { supabase } from '../lib/supabaseClient'
  import { authStore } from '../stores/authStore'
  import { projectStore, loadProjects } from '../stores/projectStore'
  import type { ClientActivityLog } from '../types/log'
  
  let logs: ClientActivityLog[] = []
  let loading = false
  let error = ''
  let selectedProject = ''
  let selectedAction = ''
  let searchTerm = ''
  let currentPage = 1
  let logsPerPage = 20
  let totalLogs = 0
  
  onMount(() => {
    loadProjects()
    loadLogs()
  })
  
  async function loadLogs() {
    if (!$authStore.user) return
    
    loading = true
    error = ''
    
    try {
      let query = supabase
        .from('client_activity_logs')
        .select(`
          *,
          projects!inner(name, user_id)
        `, { count: 'exact' })
        .eq('projects.user_id', $authStore.user.id)
        .order('ingested_at', { ascending: false })
      
      // Apply filters
      if (selectedProject) {
        query = query.eq('project_id', selectedProject)
      }
      
      if (selectedAction) {
        query = query.eq('action', selectedAction)
      }
      
      if (searchTerm) {
        query = query.or(`event.ilike.%${searchTerm}%,event_details.ilike.%${searchTerm}%,client_uuid.ilike.%${searchTerm}%`)
      }
      
      // Apply pagination
      const from = (currentPage - 1) * logsPerPage
      const to = from + logsPerPage - 1
      query = query.range(from, to)
      
      const { data, error: queryError, count } = await query
      
      if (queryError) {
        error = queryError.message
        return
      }
      
      logs = data || []
      totalLogs = count || 0
    } catch (err) {
      error = err.message || 'Failed to load logs'
    } finally {
      loading = false
    }
  }
  
  function getProjectName(projectId: string) {
    const project = $projectStore.find(p => p.id === projectId)
    return project?.name || 'Unknown Project'
  }
  
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString()
  }
  
  function getActionColor(action: string) {
    switch (action) {
      case 'create': return 'var(--color-brand-400)'
      case 'update': return 'var(--color-special-orange-500)'
      case 'delete': return '#ef4444'
      default: return 'var(--color-scale-gray-400)'
    }
  }
  
  function handleFilterChange() {
    currentPage = 1
    loadLogs()
  }
  
  function handlePageChange(page: number) {
    currentPage = page
    loadLogs()
  }
  
  $: totalPages = Math.ceil(totalLogs / logsPerPage)
</script>

<div class="logs-view">
  <div class="header">
    <div class="header-content">
      <h1>Activity Logs</h1>
      <p>View and monitor all log entries from your API integrations</p>
    </div>
  </div>
  
  {#if error}
    <div class="error-message">{error}</div>
  {/if}
  
  <div class="filters">
    <div class="search-box">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
      </svg>
      <input
        type="text"
        placeholder="Search logs..."
        bind:value={searchTerm}
        on:input={handleFilterChange}
      />
    </div>
    
    <select bind:value={selectedProject} on:change={handleFilterChange} class="filter-select">
      <option value="">All Projects</option>
      {#each $projectStore as project (project.id)}
        <option value={project.id}>{project.name}</option>
      {/each}
    </select>
    
    <select bind:value={selectedAction} on:change={handleFilterChange} class="filter-select">
      <option value="">All Actions</option>
      <option value="create">Create</option>
      <option value="update">Update</option>
      <option value="delete">Delete</option>
      <option value="other">Other</option>
    </select>
  </div>
  
  <div class="logs-container">
    {#if loading}
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading logs...</p>
      </div>
    {:else if logs.length === 0}
      <div class="empty-state">
        <div class="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
        </div>
        <h3>No logs found</h3>
        <p>No activity logs match your current filters. Try adjusting your search criteria or check if your API integrations are sending logs correctly.</p>
      </div>
    {:else}
      <div class="logs-table">
        <div class="table-header">
          <div class="header-cell">Event</div>
          <div class="header-cell">Action</div>
          <div class="header-cell">Client</div>
          <div class="header-cell">Project</div>
          <div class="header-cell">Event Time</div>
          <div class="header-cell">Ingested</div>
        </div>
        
        {#each logs as log (log.id)}
          <div class="table-row">
            <div class="cell">
              <div class="event-info">
                <span class="event-name">{log.event}</span>
                <span class="event-details">{log.event_details}</span>
              </div>
            </div>
            <div class="cell">
              <span class="action-badge" style="color: {getActionColor(log.action)}; background: {getActionColor(log.action)}20;">
                {log.action}
              </span>
            </div>
            <div class="cell">
              <code class="client-uuid">{log.client_uuid}</code>
            </div>
            <div class="cell">
              <span class="project-name">{getProjectName(log.project_id)}</span>
            </div>
            <div class="cell">
              <span class="timestamp">{formatDate(log.timestamp)}</span>
            </div>
            <div class="cell">
              <span class="ingested-time">{formatDate(log.ingested_at)}</span>
            </div>
          </div>
        {/each}
      </div>
      
      {#if totalPages > 1}
        <div class="pagination">
          <button 
            class="page-button" 
            disabled={currentPage === 1}
            on:click={() => handlePageChange(currentPage - 1)}
          >
            Previous
          </button>
          
          <div class="page-info">
            Page {currentPage} of {totalPages} ({totalLogs} total logs)
          </div>
          
          <button 
            class="page-button" 
            disabled={currentPage === totalPages}
            on:click={() => handlePageChange(currentPage + 1)}
          >
            Next
          </button>
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .logs-view {
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
  }
  
  .header {
    margin-bottom: 2rem;
  }
  
  .header-content h1 {
    margin: 0 0 0.5rem 0;
    color: var(--color-scale-gray-0);
    font-size: 2rem;
    font-weight: 600;
  }
  
  .header-content p {
    margin: 0;
    color: var(--color-scale-gray-400);
    font-size: 1.125rem;
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
  
  .logs-container {
    background: var(--color-scale-gray-900);
    border: 1px solid var(--color-scale-gray-800);
    border-radius: 12px;
    overflow: hidden;
  }
  
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    color: var(--color-scale-gray-400);
  }
  
  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--color-scale-gray-800);
    border-top: 3px solid var(--color-brand-500);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: var(--color-scale-gray-500);
  }
  
  .empty-icon {
    margin-bottom: 1rem;
    color: var(--color-scale-gray-600);
  }
  
  .empty-state h3 {
    margin: 0 0 0.5rem 0;
    color: var(--color-scale-gray-400);
    font-size: 1.25rem;
  }
  
  .empty-state p {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.5;
    max-width: 500px;
    margin: 0 auto;
  }
  
  .logs-table {
    display: flex;
    flex-direction: column;
  }
  
  .table-header {
    display: grid;
    grid-template-columns: 2fr 1fr 1.5fr 1.5fr 1.5fr 1.5fr;
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
    grid-template-columns: 2fr 1fr 1.5fr 1.5fr 1.5fr 1.5fr;
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
  
  .event-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .event-name {
    font-weight: 500;
    color: var(--color-scale-gray-100);
  }
  
  .event-details {
    font-size: 0.875rem;
    color: var(--color-scale-gray-400);
    line-height: 1.4;
  }
  
  .action-badge {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-weight: 600;
    text-transform: uppercase;
  }
  
  .client-uuid {
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
  
  .timestamp,
  .ingested-time {
    color: var(--color-scale-gray-400);
    font-size: 0.875rem;
  }
  
  .pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: var(--color-scale-gray-800);
    border-top: 1px solid var(--color-scale-gray-700);
  }
  
  .page-button {
    background: var(--color-brand-500);
    color: var(--color-scale-gray-0);
    border: none;
    border-radius: 6px;
    padding: 0.5rem 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .page-button:hover:not(:disabled) {
    background: var(--color-brand-600);
  }
  
  .page-button:disabled {
    background: var(--color-scale-gray-700);
    color: var(--color-scale-gray-500);
    cursor: not-allowed;
  }
  
  .page-info {
    color: var(--color-scale-gray-400);
    font-size: 0.875rem;
  }
  
  .error-message {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid #ef4444;
    color: #f87171;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  }
  
  @media (max-width: 768px) {
    .logs-view {
      padding: 1rem;
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
    
    .table-header {
      display: none;
    }
    
    .cell {
      border-bottom: 1px solid var(--color-scale-gray-800);
      padding: 0.75rem;
    }
    
    .pagination {
      flex-direction: column;
      gap: 1rem;
    }
  }
</style>