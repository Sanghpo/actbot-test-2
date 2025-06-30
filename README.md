# Svelte + TS + Vite SaaS Application

This template provides a complete SaaS application with user authentication, external log ingestion capabilities, and AI-powered insights.

## Features

- **User Authentication**: Email, phone (SMS), and Google OAuth support
- **Activity Logging**: Automatic logging of user actions with intelligent descriptions
- **External Log Ingestion**: REST API for ingesting logs from external applications
- **User Story Generation**: Automatic generation of user activity summaries
- **SaaS API**: Secure API key authentication for external integrations
- **AI Integration**: Google Gemini Pro for processing user activity data

## Getting Started

### Prerequisites

- Node.js 18+ 
- Supabase account
- Google Gemini API key (for AI functionality)

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Supabase:**
   - Create a new Supabase project
   - Update `.env` with your Supabase credentials:
     ```
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

3. **Set up Gemini API:**
   - Get a Gemini API key from Google AI Studio
   - Add it to your Supabase Edge Function secrets:
     ```bash
     supabase secrets set Gemini_api_key=your_gemini_api_key
     ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

## SaaS Integration

### API Key Management

This application provides a SaaS model where external applications can securely send logs using API keys.

#### Creating API Keys

API keys are managed through the database. You can create new API keys using the provided database function:

```sql
-- Create a new API key for a client
SELECT * FROM create_api_key(
  'Client Name',
  '{"description": "API key for production environment", "environment": "production"}'::jsonb
);
```

This will return:
- `api_key`: The actual API key (starts with `sk_`)
- `client_id`: Unique identifier for the client
- `client_name`: The provided client name

#### API Key Format

API keys follow the format: `sk_` followed by a base64-encoded random string.
Example: `sk_dGVzdGluZ19hcGlfa2V5XzEyMzQ1Ng==`

### External Log Ingestion API

The application provides a REST API endpoint for ingesting logs from external applications:

#### Endpoint
```
POST https://your-supabase-url.supabase.co/functions/v1/ingest-logs
```

#### Headers
```
Content-Type: application/json
X-API-Key: your_api_key_here
```

#### Request Format
```json
{
  "logs": [
    {
      "user_id": "uuid-of-end-user-in-your-system",
      "event_type": "user_login",
      "timestamp": "2024-01-15T10:30:00Z",
      "data": {
        "method": "email",
        "ip_address": "192.168.1.1",
        "user_agent": "Mozilla/5.0..."
      }
    },
    {
      "user_id": "uuid-of-end-user-in-your-system", 
      "event_type": "file_upload",
      "timestamp": "2024-01-15T10:35:00Z",
      "data": {
        "filename": "document.pdf",
        "size": "2.5MB",
        "folder": "/uploads"
      }
    }
  ]
}
```

#### Important Notes

- **user_id**: This should be a unique identifier for the end-user in your system. It doesn't need to correspond to any authentication system - it's just a way to group activities by user.
- **API Key Security**: Your API key authenticates your application with our service. Keep it secure and don't expose it in client-side code.
- **No End-User Authentication Required**: End-users don't need to authenticate with our system. Your application handles user authentication, and you send us the activity data with your user identifiers.

### Supported Event Types

The system recognizes and provides intelligent descriptions for these event types:

- `user_login` / `login`
- `user_logout` / `logout`
- `file_upload` / `upload`
- `file_download` / `download`
- `payment_processed` / `payment`
- `profile_update` / `profile_updated`
- `settings_change` / `settings_updated`
- `api_call` / `api_request`
- `error` / `error_occurred`

For unknown event types, the system will generate a generic description.

### Response Format
```json
{
  "message": "Processed 2 out of 2 logs",
  "processed": 2,
  "total": 2,
  "errors": [],
  "client": "Your Client Name"
}
```

### Example Usage

```javascript
// Example: Send logs from your application
const logs = [
  {
    user_id: "user-123-from-your-system", // Your internal user ID
    event_type: "user_login",
    timestamp: new Date().toISOString(),
    data: {
      method: "email",
      ip_address: "192.168.1.1"
    }
  }
];

const response = await fetch('https://your-project.supabase.co/functions/v1/ingest-logs', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'sk_your_api_key_here'
  },
  body: JSON.stringify({ logs })
});

const result = await response.json();
console.log('Ingestion result:', result);
```

### Error Handling

The API returns different HTTP status codes:

- `200`: All logs processed successfully
- `207`: Some logs processed successfully, some failed (check `errors` array)
- `400`: Invalid request format
- `401`: Invalid or missing API key
- `405`: Method not allowed (only POST is supported)
- `500`: Internal server error

### Security Features

- **API Key Validation**: Each request is validated against the `saas_api_keys` table
- **Usage Tracking**: API key usage is tracked (last used time, usage count)
- **Rate Limiting**: Can be implemented at the database level
- **Client Identification**: Each log entry includes client information for auditing

## How It Works

1. **API Key Authentication**: External applications authenticate using API keys
2. **Log Ingestion**: Applications send user activity logs via the REST API
3. **Processing**: Logs are validated, transformed, and stored in the database
4. **Story Generation**: Each log automatically updates the user's activity story
5. **AI Context**: The user story serves as context for AI interactions
6. **Real-time Updates**: Activity data is processed and stored in real-time

## Architecture

- **Frontend**: Svelte + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **AI**: Google Gemini Pro via Edge Functions
- **Authentication**: 
  - End-user auth: Supabase Auth (Email, Phone, OAuth)
  - SaaS API auth: Custom API key system
- **Real-time**: Supabase Realtime subscriptions

## Database Schema

- `logs`: Activity logs (both internal and external)
- `user_stories`: Generated user activity summaries
- `user_profiles`: Extended user profile data
- `saas_api_keys`: API keys for SaaS clients

## Development

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run check`: Type checking

### Project Structure

```
src/
├── lib/           # Svelte components
├── stores/        # State management
├── types/         # TypeScript type definitions
└── main.ts        # Application entry point

supabase/
├── functions/     # Edge Functions
└── migrations/    # Database migrations
```

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode).

## Technical Considerations

**Why use this over SvelteKit?**

- It brings its own routing solution which might not be preferable for some users.
- It is first and foremost a framework that just happens to use Vite under the hood, not a Vite app.

This template contains as little as possible to get started with Vite + TypeScript + Svelte, while taking into account the developer experience with regards to HMR and intellisense. It demonstrates capabilities on par with the other `create-vite` templates and is a good starting point for beginners dipping their toes into a Vite + Svelte project.

Should you later need the extended capabilities and extensibility provided by SvelteKit, the template has been structured similarly to SvelteKit so that it is easy to migrate.