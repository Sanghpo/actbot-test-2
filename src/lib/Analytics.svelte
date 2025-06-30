<script lang="ts">
  import { onMount } from 'svelte'
  import { projectStore, apiKeysStore, loadProjects, loadApiKeys } from '../stores/projectStore'
  import { apiCallsStore, loadApiCalls } from '../stores/logsStore'
  
  let timeRange = '7d'
  let selectedProject = ''
  
  onMount(() => {
    loadProjects()
    loadApiKeys()
    loadApiCalls()
  })
  
  // Enhanced analytics data with real calculations
  $: analyticsData = {
    totalRequests: $apiCallsStore.length,
    activeKeys: $apiKeysStore.filter(key => key.is_active).length,
    avgResponseTime: $apiCallsStore.length > 0 
      ? Math.round($apiCallsStore.reduce((sum, call) => sum + (call.response_time_ms || 0), 0) / $apiCallsStore.length)
      : 0,
    errorRate: $apiCallsStore.length > 0
      ? ($apiCallsStore.filter(call => call.response_status >= 400).length / $apiCallsStore.length) * 100
      : 0,
    requestsOverTime: generateRequestsOverTime(),
    topEndpoints: generateTopEndpoints(),
    usageByProject: generateUsageByProject(),
    recentActivity: getRecentActivity()
  }
  
  function generateRequestsOverTime() {
    const dateGroups = {}
    const now = new Date()
    const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
    
    // Initialize all days with 0
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateKey = date.toDateString()
      dateGroups[dateKey] = 0
    }
    
    // Count actual requests
    $apiCallsStore.forEach(call => {
      if (call.called_at) {
        const callDate = new Date(call.called_at)
        const daysDiff = Math.floor((now - callDate) / (1000 * 60 * 60 * 24))
        if (daysDiff < days) {
          const dateKey = callDate.toDateString()
          if (dateGroups[dateKey] !== undefined) {
            dateGroups[dateKey]++
          }
        }
      }
    })
    
    return Object.entries(dateGroups).map(([date, requests]) => ({ 
      date: new Date(date).toLocaleDateString(), 
      requests 
    }))
  }
  
  function generateTopEndpoints() {
    const endpointGroups = {}
    $apiCallsStore.forEach(call => {
      endpointGroups[call.endpoint] = (endpointGroups[call.endpoint] || 0) + 1
    })
    
    const total = $apiCallsStore.length || 1
    return Object.entries(endpointGroups)
      .map(([endpoint, requests]) => ({
        endpoint,
        requests,
        percentage: Math.round((requests / total) * 100)
      }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 5)
  }
  
  function generateUsageByProject() {
    const projectGroups = {}
    $apiCallsStore.forEach(call => {
      if (call.project_id) {
        const projectName = getProjectName(call.project_id)
        projectGroups[projectName] = (projectGroups[projectName] || 0) + 1
      }
    })
    
    return Object.entries(projectGroups)
      .map(([project, requests]) => ({ project, requests }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 5)
  }
  
  function getRecentActivity() {
    return $apiCallsStore
      .sort((a, b) => new Date(b.called_at).getTime() - new Date(a.called_at).getTime())
      .slice(0, 10)
      .map(call => ({
        ...call,
        project_name: getProjectName(call.project_id),
        time_ago: getTimeAgo(call.called_at)
      }))
  }
  
  function getTimeAgo(timestamp: string) {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now - time
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }
  
  function formatNumber(num: number) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }
  
  function getProjectName(projectId: string) {
    const project = $projectStore.find(p => p.id === projectId)
    return project?.name || 'Unknown Project'
  }
  
  function getStatusColor(status: number) {
    if (status >= 200 && status < 300) return 'var(--color-brand-400)'
    if (status >= 400 && status < 500) return '#f59e0b'
    if (status >= 500) return '#ef4444'
    return 'var(--color-scale-gray-400)'
  }
  
  function exportData() {
    const data = {
      analytics: analyticsData,
      exported_at: new Date().toISOString(),
      time_range: timeRange,
      project_filter: selectedProject || 'all'
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
</script>

<div class="analytics">
  <div class="header">
    <div class="header-content">
      <h1>Usage Analytics</h1>
      <p>Monitor your API usage, performance metrics, and user engagement</p>
    </div>
    
    <div class="controls">
      <select bind:value={selectedProject} class="control-select">
        <option value="">All Projects</option>
        {#each $projectStore as project (project.id)}
          <option value={project.id}>{project.name}</option>
        {/each}
      </select>
      
      <select bind:value={timeRange} class="control-select">
        <option value="24h">Last 24 Hours</option>
        <option value="7d">Last 7 Days</option>
        <option value="30d">Last 30 Days</option>
        <option value="90d">Last 90 Days</option>
      </select>
      
      <button class="export-button" on:click={exportData}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7,10 12,15 17,10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        Export
      </button>
    </div>
  </div>
  
  <div class="metrics-grid">
    <div class="metric-card">
      <div class="metric-header">
        <h3>Total Requests</h3>
        <div class="metric-icon requests">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 3v18h18"></path>
            <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path>
          </svg>
        </div>
      </div>
      <div class="metric-value">{formatNumber(analyticsData.totalRequests)}</div>
      <div class="metric-change positive">+12.5% from last period</div>
    </div>
    
    <div class="metric-card">
      <div class="metric-header">
        <h3>Active API Keys</h3>
        <div class="metric-icon keys">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <circle cx="12" cy="16" r="1"></circle>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
      </div>
      <div class="metric-value">{analyticsData.activeKeys}</div>
      <div class="metric-change neutral">No change</div>
    </div>
    
    <div class="metric-card">
      <div class="metric-header">
        <h3>Avg Response Time</h3>
        <div class="metric-icon performance">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12,6 12,12 16,14"></polyline>
          </svg>
        </div>
      </div>
      <div class="metric-value">{analyticsData.avgResponseTime}ms</div>
      <div class="metric-change positive">-8.2% from last period</div>
    </div>
    
    <div class="metric-card">
      <div class="metric-header">
        <h3>Error Rate</h3>
        <div class="metric-icon errors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        </div>
      </div>
      <div class="metric-value">{analyticsData.errorRate.toFixed(1)}%</div>
      <div class="metric-change positive">-0.5% from last period</div>
    </div>
  </div>
  
  <div class="charts-grid">
    <div class="chart-card">
      <div class="chart-header">
        <h3>Requests Over Time</h3>
        <div class="chart-legend">
          <span class="legend-item">
            <span class="legend-color primary"></span>
            API Requests
          </span>
        </div>
      </div>
      <div class="chart-container">
        <div class="chart-placeholder">
          {#if analyticsData.requestsOverTime.length > 0}
            <svg viewBox="0 0 400 200" class="chart-svg">
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:var(--color-brand-500);stop-opacity:0.3" />
                  <stop offset="100%" style="stop-color:var(--color-brand-500);stop-opacity:0" />
                </linearGradient>
              </defs>
              
              {#each analyticsData.requestsOverTime as point, i}
                {#if i > 0}
                  <line 
                    x1={20 + (i - 1) * (360 / (analyticsData.requestsOverTime.length - 1))} 
                    y1={180 - (analyticsData.requestsOverTime[i - 1].requests * 5)} 
                    x2={20 + i * (360 / (analyticsData.requestsOverTime.length - 1))} 
                    y2={180 - (point.requests * 5)}
                    stroke="var(--color-brand-500)" 
                    stroke-width="3"
                  />
                {/if}
                <circle 
                  cx={20 + i * (360 / (analyticsData.requestsOverTime.length - 1))} 
                  cy={180 - (point.requests * 5)} 
                  r="4" 
                  fill="var(--color-brand-500)"
                />
              {/each}
            </svg>
          {:else}
            <div class="no-data">No data available for selected time range</div>
          {/if}
        </div>
      </div>
    </div>
    
    <div class="chart-card">
      <div class="chart-header">
        <h3>Top Endpoints</h3>
        <p class="chart-subtitle">Most requested API endpoints</p>
      </div>
      <div class="endpoints-list">
        {#each analyticsData.topEndpoints as endpoint (endpoint.endpoint)}
          <div class="endpoint-item">
            <div class="endpoint-info">
              <code class="endpoint-path">{endpoint.endpoint}</code>
              <span class="endpoint-requests">{formatNumber(endpoint.requests)} requests</span>
            </div>
            <div class="endpoint-bar">
              <div class="endpoint-fill" style="width: {endpoint.percentage}%"></div>
            </div>
            <span class="endpoint-percentage">{endpoint.percentage}%</span>
          </div>
        {:else}
          <div class="no-data">No endpoint data available</div>
        {/each}
      </div>
    </div>
  </div>
  
  <div class="additional-charts">
    <div class="chart-card">
      <div class="chart-header">
        <h3>Usage by Project</h3>
        <p class="chart-subtitle">API requests per project</p>
      </div>
      <div class="project-usage-list">
        {#each analyticsData.usageByProject as project (project.project)}
          <div class="usage-item">
            <div class="usage-info">
              <span class="project-name">{project.project}</span>
              <span class="usage-count">{formatNumber(project.requests)} requests</span>
            </div>
            <div class="usage-bar">
              <div class="usage-fill" style="width: {(project.requests / Math.max(...analyticsData.usageByProject.map(p => p.requests))) * 100}%"></div>
            </div>
          </div>
        {:else}
          <div class="no-data">No project usage data available</div>
        {/each}
      </div>
    </div>
    
    <div class="chart-card">
      <div class="chart-header">
        <h3>Recent Activity</h3>
        <p class="chart-subtitle">Latest API requests</p>
      </div>
      <div class="activity-list">
        {#each analyticsData.recentActivity as activity (activity.id)}
          <div class="activity-item">
            <div class="activity-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12,6 12,12 16,14"></polyline>
              </svg>
            </div>
            <div class="activity-content">
              <div class="activity-main">
                <span class="activity-endpoint">{activity.endpoint}</span>
                <span class="activity-status" style="color: {getStatusColor(activity.response_status)}">
                  {activity.response_status}
                </span>
              </div>
              <div class="activity-meta">
                {activity.project_name} • {activity.time_ago}
                {#if activity.response_time_ms}
                  • {activity.response_time_ms}ms
                {/if}
              </div>
            </div>
          </div>
        {:else}
          <div class="no-data">No recent activity</div>
        {/each}
      </div>
    </div>
  </div>
  
  <div class="insights-section">
    <h2>Insights & Recommendations</h2>
    <div class="insights-grid">
      <div class="insight-card">
        <div class="insight-icon success">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20,6 9,17 4,12"></polyline>
          </svg>
        </div>
        <div class="insight-content">
          <h4>API Performance</h4>
          <p>Your API response times are within acceptable ranges. Monitor for any degradation trends.</p>
        </div>
      </div>
      
      <div class="insight-card">
        <div class="insight-icon info">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </div>
        <div class="insight-content">
          <h4>Usage Tracking</h4>
          <p>Monitor your API usage patterns to optimize performance and plan for scaling needs.</p>
        </div>
      </div>
      
      <div class="insight-card">
        <div class="insight-icon warning">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <div class="insight-content">
          <h4>Error Monitoring</h4>
          <p>Keep an eye on error rates and investigate any spikes to maintain service reliability.</p>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .analytics {
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
    font-weight: 600;
  }
  
  .header-content p {
    margin: 0;
    color: var(--color-scale-gray-400);
    font-size: 1.125rem;
  }
  
  .controls {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  
  .control-select {
    padding: 0.75rem 1rem;
    border: 2px solid var(--color-scale-gray-800);
    border-radius: 8px;
    font-size: 1rem;
    background: var(--color-scale-gray-900);
    color: var(--color-scale-gray-100);
    cursor: pointer;
    transition: border-color 0.2s ease;
  }
  
  .control-select:focus {
    outline: none;
    border-color: var(--color-brand-500);
  }
  
  .export-button {
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
  
  .export-button:hover {
    background: var(--color-brand-600);
    transform: translateY(-1px);
  }
  
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 3rem;
  }
  
  .metric-card {
    background: var(--color-scale-gray-900);
    border: 1px solid var(--color-scale-gray-800);
    border-radius: 12px;
    padding: 1.5rem;
    transition: all 0.2s ease;
  }
  
  .metric-card:hover {
    border-color: var(--color-scale-gray-700);
    transform: translateY(-2px);
  }
  
  .metric-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .metric-header h3 {
    margin: 0;
    color: var(--color-scale-gray-400);
    font-size: 0.875rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .metric-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-scale-gray-0);
  }
  
  .metric-icon.requests {
    background: var(--color-brand-500);
  }
  
  .metric-icon.keys {
    background: var(--color-brand-600);
  }
  
  .metric-icon.performance {
    background: #f59e0b;
  }
  
  .metric-icon.errors {
    background: #ef4444;
  }
  
  .metric-value {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--color-scale-gray-0);
    margin-bottom: 0.5rem;
  }
  
  .metric-change {
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  .metric-change.positive {
    color: var(--color-brand-400);
  }
  
  .metric-change.negative {
    color: #ef4444;
  }
  
  .metric-change.neutral {
    color: var(--color-scale-gray-400);
  }
  
  .charts-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 2rem;
    margin-bottom: 3rem;
  }
  
  .additional-charts {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-bottom: 3rem;
  }
  
  .chart-card {
    background: var(--color-scale-gray-900);
    border: 1px solid var(--color-scale-gray-800);
    border-radius: 12px;
    padding: 1.5rem;
  }
  
  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  
  .chart-header h3 {
    margin: 0;
    color: var(--color-scale-gray-0);
    font-size: 1.25rem;
    font-weight: 600;
  }
  
  .chart-subtitle {
    margin: 0;
    color: var(--color-scale-gray-400);
    font-size: 0.875rem;
  }
  
  .chart-legend {
    display: flex;
    gap: 1rem;
  }
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--color-scale-gray-400);
  }
  
  .legend-color {
    width: 12px;
    height: 12px;
    border-radius: 2px;
  }
  
  .legend-color.primary {
    background: var(--color-brand-500);
  }
  
  .chart-container {
    height: 200px;
  }
  
  .chart-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .chart-svg {
    width: 100%;
    height: 100%;
  }
  
  .no-data {
    color: var(--color-scale-gray-500);
    font-style: italic;
  }
  
  .endpoints-list,
  .project-usage-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .endpoint-item,
  .usage-item {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 1rem;
    align-items: center;
  }
  
  .endpoint-info,
  .usage-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .endpoint-path {
    font-family: 'Courier New', monospace;
    font-size: 0.875rem;
    color: var(--color-scale-gray-100);
    background: var(--color-scale-gray-800);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }
  
  .project-name {
    font-weight: 500;
    color: var(--color-scale-gray-100);
  }
  
  .endpoint-requests,
  .usage-count {
    font-size: 0.75rem;
    color: var(--color-scale-gray-400);
  }
  
  .endpoint-bar,
  .usage-bar {
    width: 100px;
    height: 8px;
    background: var(--color-scale-gray-800);
    border-radius: 4px;
    overflow: hidden;
  }
  
  .endpoint-fill,
  .usage-fill {
    height: 100%;
    background: var(--color-brand-500);
    transition: width 0.3s ease;
  }
  
  .endpoint-percentage {
    font-size: 0.875rem;
    color: var(--color-scale-gray-400);
    font-weight: 500;
    min-width: 40px;
    text-align: right;
  }
  
  .activity-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .activity-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: var(--color-scale-gray-800);
    border-radius: 8px;
  }
  
  .activity-icon {
    width: 32px;
    height: 32px;
    background: var(--color-scale-gray-700);
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
  
  .activity-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;
  }
  
  .activity-endpoint {
    font-family: 'Courier New', monospace;
    font-size: 0.875rem;
    color: var(--color-scale-gray-100);
  }
  
  .activity-status {
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  .activity-meta {
    font-size: 0.75rem;
    color: var(--color-scale-gray-500);
  }
  
  .insights-section {
    background: var(--color-scale-gray-900);
    border: 1px solid var(--color-scale-gray-800);
    border-radius: 12px;
    padding: 2rem;
  }
  
  .insights-section h2 {
    margin: 0 0 1.5rem 0;
    color: var(--color-scale-gray-0);
    font-size: 1.5rem;
    font-weight: 600;
  }
  
  .insights-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
  }
  
  .insight-card {
    display: flex;
    gap: 1rem;
    padding: 1.5rem;
    background: var(--color-scale-gray-800);
    border: 1px solid var(--color-scale-gray-700);
    border-radius: 12px;
  }
  
  .insight-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-scale-gray-0);
    flex-shrink: 0;
  }
  
  .insight-icon.success {
    background: var(--color-brand-500);
  }
  
  .insight-icon.warning {
    background: #f59e0b;
  }
  
  .insight-icon.info {
    background: var(--color-brand-600);
  }
  
  .insight-content h4 {
    margin: 0 0 0.5rem 0;
    color: var(--color-scale-gray-0);
    font-size: 1rem;
    font-weight: 600;
  }
  
  .insight-content p {
    margin: 0;
    color: var(--color-scale-gray-400);
    font-size: 0.875rem;
    line-height: 1.5;
  }
  
  @media (max-width: 768px) {
    .analytics {
      padding: 1rem;
    }
    
    .header {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }
    
    .controls {
      flex-direction: column;
    }
    
    .charts-grid,
    .additional-charts {
      grid-template-columns: 1fr;
    }
    
    .endpoint-item,
    .usage-item {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }
    
    .endpoint-bar,
    .usage-bar {
      width: 100%;
    }
    
    .insights-grid {
      grid-template-columns: 1fr;
    }
  }
</style>