# Credentials Module

This module provides OAuth2 credential management for WeConnect, allowing users to securely connect their Google accounts and other services.

## Features

- **OAuth2 Authentication**: Complete OAuth2 flow for Google and other providers
- **Secure Storage**: Credentials are encrypted using AES-256-GCM before storage
- **Token Management**: Automatic token refresh and validation
- **Multi-Service Support**: Designed to support multiple OAuth2 providers

## Setup

### Environment Variables

Add these to your `.env` file:

```env
# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key-here

# Google OAuth2
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/oauth2/google/callback

# Frontend URL (for redirects)
FRONTEND_URL=http://localhost:4200
```

### Google OAuth2 Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the following APIs:
   - Gmail API
   - Google Calendar API
   - Google Drive API
   - Google Docs API
   - Google Sheets API
4. Create OAuth2 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URI: `http://localhost:3000/auth/oauth2/google/callback`
   - Copy the Client ID and Client Secret to your `.env`

## API Endpoints

### OAuth2 Endpoints

- `GET /auth/oauth2/google/auth` - Initiate Google OAuth2 flow
- `GET /auth/oauth2/google/callback` - OAuth2 callback (handled automatically)
- `POST /auth/oauth2/google/refresh` - Refresh Google tokens
- `GET /auth/oauth2/google/validate` - Validate Google credential

### Credential Management

- `GET /credentials` - List all user credentials
- `POST /credentials` - Create a credential (for non-OAuth2)
- `GET /credentials/:id` - Get specific credential
- `PUT /credentials/:id` - Update credential
- `DELETE /credentials/:id` - Delete credential
- `GET /credentials/:id/validate` - Validate credential
- `GET /credentials/service/:service` - Get credential by service

## Usage in Nodes

### Using Google Services with OAuth2

```typescript
import { GoogleCredentialsHelper } from '@modules/credentials/application/services/google-credentials.helper';

@Injectable()
export class MyGoogleNode {
  constructor(
    private googleCredentialsHelper: GoogleCredentialsHelper,
  ) {}

  async execute(userId: string) {
    // Check if user has valid credentials
    const hasCredentials = await this.googleCredentialsHelper.hasValidGoogleCredentials(userId);
    if (!hasCredentials) {
      throw new Error('Please connect your Google account first');
    }

    // Get authenticated service
    const gmail = await this.googleCredentialsHelper.getGoogleService(userId, 'gmail');
    
    // Use the service
    const messages = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 10,
    });

    return messages.data;
  }
}
```

### Getting All Google Services

```typescript
const services = await this.googleCredentialsHelper.getGoogleServices(userId);
// services.gmail, services.calendar, services.drive, etc.
```

## Frontend Integration

### Initiating OAuth2 Flow

```typescript
// In your Angular component
connectGoogleAccount() {
  // This will redirect to Google OAuth2
  window.location.href = `${API_URL}/auth/oauth2/google/auth`;
}
```

### Handling Callback

After successful authentication, users are redirected to:
- Success: `${FRONTEND_URL}/credentials?status=success`
- Error: `${FRONTEND_URL}/credentials?status=error`

## Security Considerations

1. **Encryption Key**: Use a strong 32-character key for `ENCRYPTION_KEY`
2. **HTTPS**: Always use HTTPS in production
3. **Token Storage**: Tokens are encrypted at rest
4. **Scopes**: Request only necessary OAuth2 scopes
5. **Token Refresh**: Tokens are automatically refreshed when needed

## Extending to Other Providers

To add support for other OAuth2 providers:

1. Create a new OAuth2 service (e.g., `MicrosoftOAuth2Service`)
2. Add new routes in `OAuth2Controller`
3. Update `CredentialType` enum if needed
4. Follow the same pattern as Google implementation
