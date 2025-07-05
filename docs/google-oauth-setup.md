# Google OAuth2 Setup Guide for WeConnect

## Overview

This guide explains how to set up Google OAuth2 authentication for using Google services (Gmail, Calendar, Docs, Drive, Sheets) in WeConnect workflows.

## Prerequisites

1. A Google account
2. Access to Google Cloud Console
3. WeConnect application running

## Step 1: Google Cloud Console Setup

### 1.1 Create a Project
1. Visit [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a project" → "New Project"
3. Name your project (e.g., "WeConnect Integration")
4. Click "Create"

### 1.2 Enable Required APIs
1. In the dashboard, go to "APIs & Services" → "Library"
2. Search and enable these APIs:
   - Gmail API
   - Google Calendar API
   - Google Docs API
   - Google Drive API
   - Google Sheets API

### 1.3 Create OAuth2 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" for testing
   - Fill in required fields (app name, support email)
   - Add your email to test users
4. For Application type, select "Web application"
5. Name it (e.g., "WeConnect OAuth")
6. Add Authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback` (development)
   - `https://yourdomain.com/auth/google/callback` (production)
7. Click "Create"

### 1.4 Save Credentials
Download the JSON file or note down:
- Client ID
- Client Secret

## Step 2: Configure WeConnect

### 2.1 Environment Variables
Add to your `.env` file:
```env
# Google OAuth2
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Optional: Specific scopes for each service
GOOGLE_GMAIL_SCOPES=https://www.googleapis.com/auth/gmail.send,https://www.googleapis.com/auth/gmail.readonly
GOOGLE_CALENDAR_SCOPES=https://www.googleapis.com/auth/calendar
GOOGLE_DRIVE_SCOPES=https://www.googleapis.com/auth/drive
GOOGLE_DOCS_SCOPES=https://www.googleapis.com/auth/documents
GOOGLE_SHEETS_SCOPES=https://www.googleapis.com/auth/spreadsheets
```

### 2.2 Required OAuth Scopes

Each Google service requires specific scopes:

#### Gmail
- `https://www.googleapis.com/auth/gmail.send` - Send emails
- `https://www.googleapis.com/auth/gmail.readonly` - Read emails
- `https://www.googleapis.com/auth/gmail.modify` - Modify emails
- `https://www.googleapis.com/auth/gmail.labels` - Manage labels

#### Google Calendar
- `https://www.googleapis.com/auth/calendar` - Full calendar access
- `https://www.googleapis.com/auth/calendar.events` - Manage events

#### Google Drive
- `https://www.googleapis.com/auth/drive` - Full Drive access
- `https://www.googleapis.com/auth/drive.file` - File access
- `https://www.googleapis.com/auth/drive.readonly` - Read-only access

#### Google Docs
- `https://www.googleapis.com/auth/documents` - Full Docs access
- `https://www.googleapis.com/auth/documents.readonly` - Read-only access

#### Google Sheets
- `https://www.googleapis.com/auth/spreadsheets` - Full Sheets access
- `https://www.googleapis.com/auth/spreadsheets.readonly` - Read-only access

## Step 3: User Authentication Flow

### 3.1 Initial Setup
When a user wants to use a Google node for the first time:

1. User adds a Google node to their workflow
2. System detects missing credentials
3. User clicks "Authenticate with Google"
4. System redirects to Google OAuth consent screen
5. User grants permissions
6. Google redirects back with authorization code
7. System exchanges code for access/refresh tokens
8. Tokens are encrypted and stored in the database

### 3.2 Token Storage
The credentials are stored in the `credentials` table with:
- `type`: 'oauth2'
- `service`: 'gmail', 'google-calendar', etc.
- `encryptedData`: Contains encrypted access and refresh tokens
- `expiresAt`: Token expiration time

### 3.3 Token Refresh
The system automatically refreshes tokens when:
- Access token is expired
- API call returns 401 Unauthorized

## Step 4: Using Google Nodes in Workflows

Once authenticated, users can:

1. **Gmail Node**: Send emails, read inbox, manage labels
2. **Google Calendar**: Create events, manage calendars
3. **Google Drive**: Upload/download files, manage folders
4. **Google Docs**: Create/edit documents
5. **Google Sheets**: Read/write spreadsheet data

## Step 5: Troubleshooting

### Common Issues

1. **"Access blocked" error**
   - Ensure app is in testing mode or published
   - Add user email to test users list

2. **"Invalid redirect URI"**
   - Check that redirect URI matches exactly
   - Include protocol (http/https)

3. **"Insufficient permissions"**
   - Request additional scopes
   - Re-authenticate the user

4. **Token expired**
   - System should auto-refresh
   - If not, user needs to re-authenticate

## Security Best Practices

1. **Never expose credentials in code**
2. **Always use HTTPS in production**
3. **Encrypt stored tokens**
4. **Implement token rotation**
5. **Log authentication events**
6. **Use least privilege principle for scopes**

## Implementation Code Example

```typescript
// Example of handling Google OAuth in a controller
@Post('auth/google')
async authenticateGoogle(@Body() dto: { service: string }) {
  const scopes = this.getScopesForService(dto.service);
  const authUrl = this.oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state: dto.service, // Track which service is being authenticated
  });
  return { authUrl };
}

@Get('auth/google/callback')
async googleCallback(@Query() query: { code: string, state: string }) {
  const { tokens } = await this.oauth2Client.getToken(query.code);
  
  // Store encrypted tokens
  await this.credentialsService.create({
    name: `Google ${query.state}`,
    type: CredentialType.OAUTH2,
    service: query.state,
    encryptedData: this.encryptTokens(tokens),
    expiresAt: new Date(tokens.expiry_date),
  });
  
  return { success: true };
}
```

## Next Steps

1. Implement the OAuth flow in your credentials module
2. Add UI for credential management
3. Test with each Google service
4. Monitor token usage and expiration
5. Set up production OAuth credentials

## Resources

- [Google OAuth2 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google API Client Libraries](https://developers.google.com/api-client-library)
- [OAuth2 Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
