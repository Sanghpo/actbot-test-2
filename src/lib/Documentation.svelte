<script lang="ts">
  let activeSection = 'getting-started'
  
  const sections = [
    { id: 'getting-started', title: 'Getting Started' },
    { id: 'authentication', title: 'Authentication' },
    { id: 'log-ingestion', title: 'Log Ingestion API' },
    { id: 'chat-question', title: 'Chat Question API' },
    { id: 'rate-limits', title: 'Rate Limits' },
    { id: 'errors', title: 'Error Handling' },
    { id: 'examples', title: 'Code Examples' }
  ]
  
  function scrollToSection(sectionId: string) {
    activeSection = sectionId
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }
</script>

<div class="documentation">
  <div class="doc-sidebar">
    <div class="sidebar-header">
      <h3>API Documentation</h3>
    </div>
    <nav class="doc-nav">
      {#each sections as section (section.id)}
        <button
          class="nav-item"
          class:active={activeSection === section.id}
          on:click={() => scrollToSection(section.id)}
        >
          {section.title}
        </button>
      {/each}
    </nav>
  </div>
  
  <div class="doc-content">
    <section id="getting-started" class="doc-section">
      <h1>Getting Started</h1>
      <p>Welcome to our AI-powered Activity Analytics API! This platform allows you to integrate intelligent chatbot capabilities into your applications by analyzing user activity logs.</p>
      
      <h2>Quick Start</h2>
      <p>Follow these steps to start using our APIs:</p>
      
      <ol>
        <li>Create a project in your dashboard</li>
        <li>Generate an API key and secret for your project</li>
        <li>Start sending activity logs using our Log Ingestion API</li>
        <li>Query user insights using our Chat Question API</li>
        <li>View analytics and user stories in the dashboard</li>
      </ol>
      
      <div class="code-block">
        <div class="code-header">
          <span>Example Log Ingestion Request</span>
          <button class="copy-button">Copy</button>
        </div>
        <pre><code>curl -X POST https://your-project.supabase.co/functions/v1/ingest-logs \
  -H "Content-Type: application/json" \
  -d '&#123;
    "API_key": "pk_your_api_key_here",
    "API_secret": "sk_your_api_secret_here",
    "public_project_id": "YOUR_PUBLIC_PROJECT_ID",
    "type": "log",
    "payload": &#123;
      "client_uuid": "user-123",
      "action": "create",
      "event": "user_registration",
      "event_details": "New user registered with email",
      "timestamp": "2024-01-15T10:30:00Z"
    &#125;
  &#125;'</code></pre>
      </div>
    </section>
    
    <section id="authentication" class="doc-section">
      <h1>Authentication</h1>
      <p>All API requests must be authenticated using your project's API key and secret.</p>
      
      <h2>API Key & Secret Authentication</h2>
      <p>Include both your API key and secret in the request body:</p>
      
      <div class="code-block">
        <div class="code-header">
          <span>Authentication Fields</span>
          <button class="copy-button">Copy</button>
        </div>
        <pre><code>&#123;
  "API_key": "pk_your_api_key_here",
  "API_secret": "sk_your_api_secret_here",
  ...
&#125;</code></pre>
      </div>
      
      <div class="info-box">
        <h4>🔒 Keep Your Credentials Secure</h4>
        <p>Never expose your API keys and secrets in client-side code. Always use them from your server-side applications.</p>
      </div>
    </section>
    
    <section id="log-ingestion" class="doc-section">
      <h1>Log Ingestion API</h1>
      <p>Send activity logs from your applications to build user activity stories for AI analysis.</p>
      
      <h2>Ingest Logs Endpoint</h2>
      <div class="endpoint-card">
        <div class="endpoint-method">POST</div>
        <div class="endpoint-url">/functions/v1/ingest-logs</div>
      </div>
      
      <h3>Request Body</h3>
      <div class="code-block">
        <div class="code-header">
          <span>JSON Schema</span>
          <button class="copy-button">Copy</button>
        </div>
        <pre><code>&#123;
  "API_key": "string",           // Required: Your project API key
  "API_secret": "string",        // Required: Your project API secret
  "public_project_id": "string", // Required: Public ID of your project
  "type": "log",                 // Required: Must be "log"
  "payload": &#123;                  // Required: Log entry data
    "client_uuid": "string",     // Required: Unique client identifier
    "action": "string",          // Required: create|update|delete|other
    "event": "string",           // Required: Event name
    "event_details": "string",   // Required: Event description
    "timestamp": "string"        // Required: ISO 8601 timestamp
  &#125;
&#125;</code></pre>
      </div>
      
      <h3>Response</h3>
      <div class="code-block">
        <div class="code-header">
          <span>Success Response</span>
          <button class="copy-button">Copy</button>
        </div>
        <pre><code>&#123;
  "success": true,
  "message": "Client activity log entry created successfully",
  "log_id": "uuid-of-created-log"
&#125;</code></pre>
      </div>
    </section>
    
    <section id="chat-question" class="doc-section">
      <h1>Chat Question API</h1>
      <p>Send user questions to get AI-powered answers based on their activity history.</p>
      
      <h2>Chat Question Endpoint</h2>
      <div class="endpoint-card">
        <div class="endpoint-method">POST</div>
        <div class="endpoint-url">/functions/v1/chat-question</div>
      </div>
      
      <h3>Request Body</h3>
      <div class="code-block">
        <div class="code-header">
          <span>JSON Schema</span>
          <button class="copy-button">Copy</button>
        </div>
        <pre><code>&#123;
  "API_key": "string",           // Required: Your project API key
  "API_secret": "string",        // Required: Your project API secret
  "public_project_id": "string", // Required: Public ID of your project
  "type": "chat",                // Required: Must be "chat"
  "payload": &#123;                  // Required: Chat data
    "client_uuid": "string",     // Required: Unique client identifier
    "questions": "string"        // Required: User's question
  &#125;
&#125;</code></pre>
      </div>
      
      <h3>Response</h3>
      <div class="code-block">
        <div class="code-header">
          <span>Success Response</span>
          <button class="copy-button">Copy</button>
        </div>
        <pre><code>&#123;
  "success": true,
  "answer": "AI-generated response based on user activity"
&#125;</code></pre>
      </div>
      
      <h3>How It Works</h3>
      <ol>
        <li>Your application sends user activity logs via the Log Ingestion API</li>
        <li>Our AI automatically generates comprehensive user stories from the activity data</li>
        <li>When a user asks a question, our AI analyzes their activity story to provide contextual answers</li>
        <li>The response is returned in real-time for immediate use in your application</li>
      </ol>
    </section>
    
    <section id="rate-limits" class="doc-section">
      <h1>Rate Limits</h1>
      <p>API rate limits help ensure fair usage and system stability.</p>
      
      <div class="rate-limit-table">
        <div class="table-header">
          <div>Plan</div>
          <div>Requests per minute</div>
          <div>Requests per day</div>
        </div>
        <div class="table-row">
          <div>Free</div>
          <div>100</div>
          <div>10,000</div>
        </div>
        <div class="table-row">
          <div>Pro</div>
          <div>1,000</div>
          <div>100,000</div>
        </div>
        <div class="table-row">
          <div>Enterprise</div>
          <div>Custom</div>
          <div>Custom</div>
        </div>
      </div>
    </section>
    
    <section id="errors" class="doc-section">
      <h1>Error Handling</h1>
      <p>The API uses conventional HTTP response codes to indicate success or failure.</p>
      
      <div class="error-codes">
        <div class="error-code">
          <div class="code">200</div>
          <div class="description">
            <strong>OK</strong> - Request successful
          </div>
        </div>
        <div class="error-code">
          <div class="code">400</div>
          <div class="description">
            <strong>Bad Request</strong> - Invalid request format
          </div>
        </div>
        <div class="error-code">
          <div class="code">401</div>
          <div class="description">
            <strong>Unauthorized</strong> - Invalid API key or secret
          </div>
        </div>
        <div class="error-code">
          <div class="code">403</div>
          <div class="description">
            <strong>Forbidden</strong> - Access denied to project
          </div>
        </div>
        <div class="error-code">
          <div class="code">500</div>
          <div class="description">
            <strong>Internal Server Error</strong> - Something went wrong
          </div>
        </div>
      </div>
      
      <h3>Error Response Format</h3>
      <div class="code-block">
        <div class="code-header">
          <span>Error Response</span>
          <button class="copy-button">Copy</button>
        </div>
        <pre><code>&#123;
  "success": false,
  "error": "Invalid API key",
  "error_code": "INVALID_API_KEY"
&#125;</code></pre>
      </div>
    </section>
    
    <section id="examples" class="doc-section">
      <h1>Code Examples</h1>
      <p>Example implementations in different programming languages.</p>
      
      <h2>JavaScript/Node.js - Log Ingestion</h2>
      <div class="code-block">
        <div class="code-header">
          <span>Log Ingestion Example</span>
          <button class="copy-button">Copy</button>
        </div>
        <pre><code>const logData = &#123;
  API_key: 'pk_your_api_key_here',
  API_secret: 'sk_your_api_secret_here',
  public_project_id: 'YOUR_PUBLIC_PROJECT_ID',
  type: 'log',
  payload: &#123;
    client_uuid: 'user-123',
    action: 'create',
    event: 'user_registration',
    event_details: 'New user registered with email',
    timestamp: new Date().toISOString()
  &#125;
&#125;;

const response = await fetch('https://your-project.supabase.co/functions/v1/ingest-logs', &#123;
  method: 'POST',
  headers: &#123;
    'Content-Type': 'application/json'
  &#125;,
  body: JSON.stringify(logData)
&#125;);

const result = await response.json();
console.log('Log ingestion result:', result);</code></pre>
      </div>
      
      <h2>JavaScript/Node.js - Chat Question</h2>
      <div class="code-block">
        <div class="code-header">
          <span>Chat Question Example</span>
          <button class="copy-button">Copy</button>
        </div>
        <pre><code>const chatData = &#123;
  API_key: 'pk_your_api_key_here',
  API_secret: 'sk_your_api_secret_here',
  public_project_id: 'YOUR_PUBLIC_PROJECT_ID',
  type: 'chat',
  payload: &#123;
    client_uuid: 'user-123',
    questions: 'What activities have I done recently?'
  &#125;
&#125;;

const response = await fetch('https://your-project.supabase.co/functions/v1/chat-question', &#123;
  method: 'POST',
  headers: &#123;
    'Content-Type': 'application/json'
  &#125;,
  body: JSON.stringify(chatData)
&#125;);

const result = await response.json();
console.log('Chat response:', result.answer);</code></pre>
      </div>
      
      <h2>Python - Complete Integration</h2>
      <div class="code-block">
        <div class="code-header">
          <span>Python Example</span>
          <button class="copy-button">Copy</button>
        </div>
        <pre><code>import requests
import json
from datetime import datetime

class ActivityAnalyticsAPI:
    def __init__(self, api_key, api_secret, public_project_id, base_url):
        self.api_key = api_key
        self.api_secret = api_secret
        self.public_project_id = public_project_id
        self.base_url = base_url
    
    def send_log(self, client_uuid, action, event, event_details):
        log_data = &#123;
            "API_key": self.api_key,
            "API_secret": self.api_secret,
            "public_project_id": self.public_project_id,
            "type": "log",
            "payload": &#123;
                "client_uuid": client_uuid,
                "action": action,
                "event": event,
                "event_details": event_details,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            &#125;
        &#125;
        
        response = requests.post(
            f'&#123;self.base_url&#125;/functions/v1/ingest-logs',
            headers=&#123;'Content-Type': 'application/json'&#125;,
            data=json.dumps(log_data)
        )
        
        return response.json()
    
    def ask_question(self, client_uuid, question):
        chat_data = &#123;
            "API_key": self.api_key,
            "API_secret": self.api_secret,
            "public_project_id": self.public_project_id,
            "type": "chat",
            "payload": &#123;
                "client_uuid": client_uuid,
                "questions": question
            &#125;
        &#125;
        
        response = requests.post(
            f'&#123;self.base_url&#125;/functions/v1/chat-question',
            headers=&#123;'Content-Type': 'application/json'&#125;,
            data=json.dumps(chat_data)
        )
        
        return response.json()

# Usage
api = ActivityAnalyticsAPI(
    api_key='pk_your_api_key_here',
    api_secret='sk_your_api_secret_here',
    public_project_id='YOUR_PUBLIC_PROJECT_ID',
    base_url='https://your-project.supabase.co'
)

# Send a log
log_result = api.send_log(
    client_uuid='user-123',
    action='create',
    event='user_login',
    event_details='User logged in successfully'
)

# Ask a question
chat_result = api.ask_question(
    client_uuid='user-123',
    question='What was my last activity?'
)

print('Answer:', chat_result.get('answer'))</code></pre>
      </div>
    </section>
  </div>
</div>

<style>
  .documentation {
    display: flex;
    min-height: calc(100vh - 64px);
    background: var(--color-scale-gray-950);
  }
  
  .doc-sidebar {
    width: 280px;
    background: var(--color-scale-gray-900);
    border-right: 1px solid var(--color-scale-gray-800);
    position: sticky;
    top: 0;
    height: calc(100vh - 64px);
    overflow-y: auto;
  }
  
  .sidebar-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-scale-gray-800);
  }
  
  .sidebar-header h3 {
    margin: 0;
    color: var(--color-scale-gray-0);
    font-size: 1.125rem;
    font-weight: 600;
  }
  
  .doc-nav {
    padding: 1rem 0;
  }
  
  .nav-item {
    width: 100%;
    display: block;
    padding: 0.75rem 1.5rem;
    border: none;
    background: none;
    color: var(--color-scale-gray-400);
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  .nav-item:hover {
    background: var(--color-scale-gray-800);
    color: var(--color-scale-gray-200);
  }
  
  .nav-item.active {
    background: var(--color-brand-500);
    color: var(--color-scale-gray-0);
  }
  
  .doc-content {
    flex: 1;
    padding: 2rem;
    max-width: 800px;
    margin: 0 auto;
  }
  
  .doc-section {
    margin-bottom: 4rem;
  }
  
  .doc-section h1 {
    margin: 0 0 1rem 0;
    color: var(--color-scale-gray-0);
    font-size: 2.5rem;
    font-weight: 700;
  }
  
  .doc-section h2 {
    margin: 2rem 0 1rem 0;
    color: var(--color-scale-gray-0);
    font-size: 1.5rem;
    font-weight: 600;
  }
  
  .doc-section h3 {
    margin: 1.5rem 0 0.75rem 0;
    color: var(--color-scale-gray-0);
    font-size: 1.25rem;
    font-weight: 600;
  }
  
  .doc-section h4 {
    margin: 1rem 0 0.5rem 0;
    color: var(--color-scale-gray-0);
    font-size: 1.1rem;
    font-weight: 600;
  }
  
  .doc-section p {
    margin: 0 0 1rem 0;
    color: var(--color-scale-gray-300);
    line-height: 1.6;
  }
  
  .doc-section ol,
  .doc-section ul {
    margin: 0 0 1rem 0;
    padding-left: 1.5rem;
    color: var(--color-scale-gray-300);
    line-height: 1.6;
  }
  
  .doc-section li {
    margin-bottom: 0.5rem;
  }
  
  .code-block {
    background: var(--color-scale-gray-900);
    border: 1px solid var(--color-scale-gray-800);
    border-radius: 8px;
    overflow: hidden;
    margin: 1rem 0;
  }
  
  .code-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: var(--color-scale-gray-800);
    color: var(--color-scale-gray-200);
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  .copy-button {
    background: var(--color-scale-gray-700);
    color: var(--color-scale-gray-200);
    border: none;
    border-radius: 4px;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    cursor: pointer;
    transition: background 0.2s ease;
  }
  
  .copy-button:hover {
    background: var(--color-scale-gray-600);
  }
  
  .code-block pre {
    margin: 0;
    padding: 1rem;
    overflow-x: auto;
  }
  
  .code-block code {
    color: var(--color-scale-gray-100);
    font-family: 'Courier New', monospace;
    font-size: 0.875rem;
    line-height: 1.5;
  }
  
  .doc-section code {
    background: var(--color-scale-gray-800);
    color: var(--color-brand-400);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 0.875rem;
  }
  
  .endpoint-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: var(--color-scale-gray-900);
    border: 1px solid var(--color-scale-gray-800);
    border-radius: 8px;
    padding: 1rem;
    margin: 1rem 0;
  }
  
  .endpoint-method {
    background: var(--color-brand-500);
    color: var(--color-scale-gray-0);
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.875rem;
  }
  
  .endpoint-url {
    font-family: 'Courier New', monospace;
    font-size: 1rem;
    color: var(--color-scale-gray-100);
  }
  
  .info-box {
    background: rgba(34, 211, 238, 0.1);
    border: 1px solid var(--color-brand-500);
    border-radius: 8px;
    padding: 1rem;
    margin: 1rem 0;
  }
  
  .info-box h4 {
    margin: 0 0 0.5rem 0;
    color: var(--color-brand-400);
  }
  
  .info-box p {
    margin: 0;
    color: var(--color-brand-300);
  }
  
  .rate-limit-table {
    background: var(--color-scale-gray-900);
    border: 1px solid var(--color-scale-gray-800);
    border-radius: 8px;
    overflow: hidden;
    margin: 1rem 0;
  }
  
  .table-header {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    background: var(--color-scale-gray-800);
    border-bottom: 1px solid var(--color-scale-gray-700);
  }
  
  .table-header div {
    padding: 0.75rem 1rem;
    font-weight: 600;
    color: var(--color-scale-gray-200);
    font-size: 0.875rem;
  }
  
  .table-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    border-bottom: 1px solid var(--color-scale-gray-800);
  }
  
  .table-row:last-child {
    border-bottom: none;
  }
  
  .table-row div {
    padding: 0.75rem 1rem;
    color: var(--color-scale-gray-300);
  }
  
  .error-codes {
    display: grid;
    gap: 0.75rem;
    margin: 1rem 0;
  }
  
  .error-code {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: var(--color-scale-gray-900);
    border: 1px solid var(--color-scale-gray-800);
    border-radius: 8px;
    padding: 1rem;
  }
  
  .error-code .code {
    background: #ef4444;
    color: var(--color-scale-gray-0);
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.875rem;
    min-width: 60px;
    text-align: center;
  }
  
  .error-code .description {
    color: var(--color-scale-gray-300);
  }
  
  @media (max-width: 768px) {
    .documentation {
      flex-direction: column;
    }
    
    .doc-sidebar {
      width: 100%;
      height: auto;
      position: static;
    }
    
    .doc-content {
      padding: 1rem;
    }
    
    .doc-section h1 {
      font-size: 2rem;
    }
    
    .endpoint-card {
      flex-direction: column;
      align-items: stretch;
      gap: 0.5rem;
    }
    
    .table-header,
    .table-row {
      grid-template-columns: 1fr;
    }
    
    .error-code {
      flex-direction: column;
      align-items: stretch;
      gap: 0.5rem;
    }
  }
</style>