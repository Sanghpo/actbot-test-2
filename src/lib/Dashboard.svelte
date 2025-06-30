<script lang="ts">
  import { onMount } from 'svelte'
  import { projectStore, apiKeysStore, loadProjects, loadApiKeys } from '../stores/projectStore'
  import { authStore } from '../stores/authStore'
  
  let stats = {
    totalProjects: 0,
    totalApiKeys: 0,
    activeApiKeys: 0,
    totalRequests: 0
  }
  
  onMount(() => {
    loadProjects()
    loadApiKeys()
  })
  
  // Update stats when stores change
  $: {
    stats.totalProjects = $projectStore.length
    stats.totalApiKeys = $apiKeysStore.length
    stats.activeApiKeys = $apiKeysStore.filter(key => key.is_active).length
    stats.totalRequests = $apiKeysStore.reduce((sum, key) => sum + key.usage_count, 0)
  }
  
  function getRecentProjects() {
    return $projectStore.slice(0, 3)
  }
  
  function getRecentApiKeys() {
    return $apiKeysStore
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
  }
  
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString()
  }
  
  function getProjectName(projectId: string) {
    const project = $projectStore.find(p => p.id === projectId)
    return project?.name || 'Unknown Project'
  }
</script>

<div class="dashboard">
  <div class="dashboard-header">
    <div class="welcome-section">
      <h1>Welcome back, {$authStore.user?.user_metadata?.full_name || 'User'}!</h1>
      <p>Here's what's happening with your projects today.</p>
    </div>
  </div>
  
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-content">
        <div class="stat-header">
          <h3>Total Projects</h3>
          <div class="stat-icon projects">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
        </div>
        <div class="stat-value">{stats.totalProjects}</div>
        <div class="stat-change positive">+2 this month</div>
      </div>
    </div>
    
    <div class="stat-card">
      <div class="stat-content">
        <div class="stat-header">
          <h3>API Keys</h3>
          <div class="stat-icon api-keys">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <circle cx="12" cy="16" r="1"></circle>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
        </div>
        <div class="stat-value">{stats.totalApiKeys}</div>
        <div class="stat-change positive">+{stats.activeApiKeys} active</div>
      </div>
    </div>
    
    <div class="stat-card">
      <div class="stat-content">
        <div class="stat-header">
          <h3>Total Requests</h3>
          <div class="stat-icon requests">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 3v18h18"></path>
              <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path>
            </svg>
          </div>
        </div>
        <div class="stat-value">{stats.totalRequests.toLocaleString()}</div>
        <div class="stat-change positive">+12% this week</div>
      </div>
    </div>
    
    <div class="stat-card">
      <div class="stat-content">
        <div class="stat-header">
          <h3>Uptime</h3>
          <div class="stat-icon uptime">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12,6 12,12 16,14"></polyline>
            </svg>
          </div>
        </div>
        <div class="stat-value">99.9%</div>
        <div class="stat-change positive">All systems operational</div>
      </div>
    </div>
  </div>
  
  <div class="dashboard-content">
    <div class="content-section">
      <div class="section-header">
        <h2>Recent Projects</h2>
        <a href="#" class="view-all">View All</a>
      </div>
      
      <div class="projects-list">
        {#each getRecentProjects() as project (project.id)}
          <div class="project-item">
            <div class="project-info">
              <h4>{project.name}</h4>
              <p>{project.description || 'No description'}</p>
              <span class="project-date">Created {formatDate(project.created_at)}</span>
            </div>
            <div class="project-stats">
              <span class="api-count">
                {$apiKeysStore.filter(key => key.project_id === project.id).length} API Keys
              </span>
            </div>
          </div>
        {:else}
          <div class="empty-state">
            <div class="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <h3>No projects yet</h3>
            <p>Create your first project to get started!</p>
          </div>
        {/each}
      </div>
    </div>
    
    <div class="content-section">
      <div class="section-header">
        <h2>Recent API Activity</h2>
        <a href="#" class="view-all">View All</a>
      </div>
      
      <div class="activity-list">
        {#each getRecentApiKeys() as apiKey (apiKey.id)}
          <div class="activity-item">
            <div class="activity-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <circle cx="12" cy="16" r="1"></circle>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <div class="activity-content">
              <p><strong>{apiKey.name}</strong> in {getProjectName(apiKey.project_id)}</p>
              <span class="activity-meta">
                {apiKey.usage_count} requests • 
                {apiKey.last_used_at ? `Last used ${formatDate(apiKey.last_used_at)}` : 'Never used'}
              </span>
            </div>
            <div class="activity-status">
              <span class="status-badge" class:active={apiKey.is_active} class:inactive={!apiKey.is_active}>
                {apiKey.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        {:else}
          <div class="empty-state">
            <div class="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <circle cx="12" cy="16" r="1"></circle>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h3>No API keys yet</h3>
            <p>Create an API key to start tracking activity!</p>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .dashboard {
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
  }
  
  .dashboard-header {
    margin-bottom: 2rem;
  }
  
  .welcome-section h1 {
    margin: 0 0 0.5rem 0;
    color: var(--color-scale-gray-0);
    font-size: 2rem;
    font-weight: 600;
  }
  
  .welcome-section p {
    margin: 0;
    color: var(--color-scale-gray-400);
    font-size: 1.125rem;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    margin-bottom: 3rem;
  }
  
  .stat-card {
    background: var(--color-scale-gray-900);
    border: 1px solid var(--color-scale-gray-800);
    border-radius: 12px;
    padding: 1.5rem;
    transition: all 0.2s ease;
  }
  
  .stat-card:hover {
    border-color: var(--color-scale-gray-700);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  }
  
  .stat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .stat-header h3 {
    margin: 0;
    color: var(--color-scale-gray-400);
    font-size: 0.875rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .stat-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-scale-gray-0);
  }
  
  .stat-icon.projects {
    background: var(--color-brand-500);
  }
  
  .stat-icon.api-keys {
    background: var(--color-brand-600);
  }
  
  .stat-icon.requests {
    background: var(--color-brand-400);
  }
  
  .stat-icon.uptime {
    background: var(--color-brand-500);
  }
  
  .stat-value {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--color-scale-gray-0);
    margin-bottom: 0.5rem;
    line-height: 1;
  }
  
  .stat-change {
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  .stat-change.positive {
    color: var(--color-brand-400);
  }
  
  .stat-change.negative {
    color: #ef4444;
  }
  
  .stat-change.neutral {
    color: var(--color-scale-gray-400);
  }
  
  .dashboard-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }
  
  .content-section {
    background: var(--color-scale-gray-900);
    border: 1px solid var(--color-scale-gray-800);
    border-radius: 12px;
    padding: 1.5rem;
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  
  .section-header h2 {
    margin: 0;
    color: var(--color-scale-gray-0);
    font-size: 1.25rem;
    font-weight: 600;
  }
  
  .view-all {
    color: var(--color-brand-400);
    text-decoration: none;
    font-weight: 500;
    font-size: 0.875rem;
    transition: color 0.2s ease;
  }
  
  .view-all:hover {
    color: var(--color-brand-300);
  }
  
  .project-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 1rem 0;
    border-bottom: 1px solid var(--color-scale-gray-800);
  }
  
  .project-item:last-child {
    border-bottom: none;
  }
  
  .project-info h4 {
    margin: 0 0 0.25rem 0;
    color: var(--color-scale-gray-0);
    font-weight: 600;
  }
  
  .project-info p {
    margin: 0 0 0.5rem 0;
    color: var(--color-scale-gray-400);
    font-size: 0.875rem;
  }
  
  .project-date {
    font-size: 0.75rem;
    color: var(--color-scale-gray-500);
  }
  
  .api-count {
    font-size: 0.875rem;
    color: var(--color-scale-gray-400);
    font-weight: 500;
  }
  
  .activity-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 0;
    border-bottom: 1px solid var(--color-scale-gray-800);
  }
  
  .activity-item:last-child {
    border-bottom: none;
  }
  
  .activity-icon {
    width: 32px;
    height: 32px;
    background: var(--color-scale-gray-800);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-scale-gray-400);
    flex-shrink: 0;
  }
  
  .activity-content {
    flex: 1;
  }
  
  .activity-content p {
    margin: 0 0 0.25rem 0;
    color: var(--color-scale-gray-0);
    font-size: 0.875rem;
  }
  
  .activity-meta {
    font-size: 0.75rem;
    color: var(--color-scale-gray-500);
  }
  
  .status-badge {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-weight: 500;
  }
  
  .status-badge.active {
    background: rgba(34, 211, 238, 0.1);
    color: var(--color-brand-400);
  }
  
  .status-badge.inactive {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }
  
  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--color-scale-gray-500);
  }
  
  .empty-icon {
    margin-bottom: 1rem;
    color: var(--color-scale-gray-600);
  }
  
  .empty-state h3 {
    margin: 0 0 0.5rem 0;
    color: var(--color-scale-gray-400);
    font-size: 1.125rem;
  }
  
  .empty-state p {
    margin: 0;
    font-size: 0.875rem;
  }
  
  @media (max-width: 768px) {
    .dashboard {
      padding: 1rem;
    }
    
    .dashboard-content {
      grid-template-columns: 1fr;
    }
    
    .stats-grid {
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    }
  }
</style>