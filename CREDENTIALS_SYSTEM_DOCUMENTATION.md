# 🔐 WeConnect Credentials System - Complete Documentation & Testing Guide

## 📋 Overview

Your WeConnect credentials system is a comprehensive OAuth2 and credential management solution that supports multiple providers and secure storage. Here's what you have and what's needed to make it fully functional.

## ✅ What's Already Implemented

### **Core Features**
- ✅ **Multi-Provider OAuth2**: Google, GitHub, Slack, Discord
- ✅ **Secure Encryption**: AES-256-GCM encryption for credential storage
- ✅ **Token Management**: Automatic token refresh and validation
- ✅ **Credential Types**: API keys, OAuth2, Basic Auth, Bearer tokens, etc.
- ✅ **Service Integration**: Google services (Gmail, Calendar, Drive, Docs, Sheets)
- ✅ **Credential Sharing**: Team-based credential sharing
- ✅ **Credential Rotation**: Automatic credential rotation policies
- ✅ **Testing & Validation**: Built-in credential connectivity testing

### **Database Entities**
- ✅ **Credential**: Main credential storage with encryption
- ✅ **CredentialShare**: Team sharing functionality
- ✅ **CredentialRotation**: Rotation tracking and policies

### **Services**
- ✅ **CredentialsService**: Core credential management
- ✅ **OAuth2Service**: Multi-provider OAuth2 handling
- ✅ **EncryptionService**: Secure data encryption/decryption
- ✅ **GoogleCredentialsHelper**: Google services integration
- ✅ **CredentialSharingService**: Team credential sharing
- ✅ **CredentialRotationService**: Automatic rotation

### **API Endpoints**
- ✅ **CRUD Operations**: Full credential management
- ✅ **OAuth2 Flows**: Complete OAuth2 authentication
- ✅ **Validation**: Credential testing and validation
- ✅ **Statistics**: Credential usage analytics

## 🔧 Setup Requirements

### **1. Environment Variables**

Add these to your `.env` file:

```env
# Encryption (REQUIRED)
ENCRYPTION_KEY=your-32-character-encryption-key-here-change-this

# Google OAuth2 (REQUIRED for Google services)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/oauth2/google/callback

# GitHub OAuth2 (Optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_REDIRECT_URI=http://localhost:3000/auth/oauth2/github/callback

# Slack OAuth2 (Optional)
SLACK_CLIENT_ID=your-slack-client-id
SLACK_CLIENT_SECRET=your-slack-client-secret
SLACK_REDIRECT_URI=http://localhost:3000/auth/oauth2/slack/callback

# Discord OAuth2 (Optional)
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
DISCORD_REDIRECT_URI=http://localhost:3000/auth/oauth2/discord/callback

# Frontend URL (REQUIRED)
FRONTEND_URL=http://localhost:4200
```

### **2. Google Cloud Console Setup**

1. **Create Project**: Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **Enable APIs**:
   - Gmail API
   - Google Calendar API
   - Google Drive API
   - Google Docs API
   - Google Sheets API
   - Google OAuth2 API

3. **Create OAuth2 Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URI: `http://localhost:3000/auth/oauth2/google/callback`
   - Copy Client ID and Secret to `.env`

### **3. Other Provider Setup** (Optional)

#### **GitHub**
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create new OAuth App
3. Set Authorization callback URL: `http://localhost:3000/auth/oauth2/github/callback`

#### **Slack**
1. Go to [Slack API](https://api.slack.com/apps)
2. Create new app
3. Set redirect URL: `http://localhost:3000/auth/oauth2/slack/callback`

#### **Discord**
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create new application
3. Set redirect URI: `http://localhost:3000/auth/oauth2/discord/callback`

## 🚀 API Endpoints Reference

### **Credential Management**

```http
# Get all credentials
GET /credentials
Authorization: Bearer <jwt-token>

# Create credential (non-OAuth2)
POST /credentials
Authorization: Bearer <jwt-token>
Content-Type: application/json
{
  "name": "My API Key",
  "type": "api_key",
  "service": "custom",
  "data": {
    "apiKey": "your-api-key"
  }
}

# Get specific credential
GET /credentials/:id
Authorization: Bearer <jwt-token>

# Update credential
PUT /credentials/:id
Authorization: Bearer <jwt-token>
Content-Type: application/json
{
  "name": "Updated Name",
  "isActive": true
}

# Delete credential
DELETE /credentials/:id
Authorization: Bearer <jwt-token>

# Validate credential
GET /credentials/:id/validate
Authorization: Bearer <jwt-token>

# Test credential connectivity
GET /credentials/:id/test
Authorization: Bearer <jwt-token>

# Get credentials by service
GET /credentials/service/:service
Authorization: Bearer <jwt-token>

# Get credential statistics
GET /credentials/stats
Authorization: Bearer <jwt-token>

# Refresh expired OAuth2 tokens
POST /credentials/refresh-expired
Authorization: Bearer <jwt-token>
```

### **OAuth2 Authentication**

```http
# Google OAuth2 Flow
GET /auth/oauth2/google/auth
Authorization: Bearer <jwt-token>
# Redirects to Google OAuth2

# Google OAuth2 Callback (handled automatically)
GET /auth/oauth2/google/callback?code=...&state=...

# Refresh Google tokens
POST /auth/oauth2/google/refresh?credentialId=<id>
Authorization: Bearer <jwt-token>

# Validate Google credential
GET /auth/oauth2/google/validate?credentialId=<id>
Authorization: Bearer <jwt-token>

# Multi-provider OAuth2
GET /auth/oauth2/:provider/auth
Authorization: Bearer <jwt-token>
# Supports: google, github, slack, discord

# Multi-provider callback
GET /auth/oauth2/:provider/callback?code=...&state=...

# Get available providers
GET /auth/oauth2/providers
```

## 🧪 Testing Guide

### **1. Basic Setup Test**

```bash
# 1. Start your application
npm run start:dev

# 2. Check if credentials module is loaded
curl -H "Authorization: Bearer <your-jwt-token>" \
     http://localhost:3000/credentials

# Expected: Empty array [] (if no credentials exist)
```

### **2. Environment Variables Test**

```bash
# Check if encryption key is set
node -e "console.log(process.env.ENCRYPTION_KEY ? 'Encryption key set' : 'Missing encryption key')"

# Check Google OAuth2 setup
node -e "console.log(process.env.GOOGLE_CLIENT_ID ? 'Google client ID set' : 'Missing Google client ID')"
```

### **3. Create Manual Credential Test**

```bash
# Create a test API key credential
curl -X POST http://localhost:3000/credentials \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test API Key",
    "type": "api_key",
    "service": "test",
    "data": {
      "apiKey": "test-key-123"
    }
  }'

# Expected: Credential object without encrypted data
```

### **4. OAuth2 Flow Test**

#### **Google OAuth2 Test**
1. **Initiate OAuth2**:
   ```
   GET http://localhost:3000/auth/oauth2/google/auth
   Authorization: Bearer <your-jwt-token>
   ```
   - Should redirect to Google OAuth2 consent screen

2. **Complete Flow**:
   - Grant permissions in Google
   - Should redirect to `${FRONTEND_URL}/credentials?status=success`

3. **Verify Credential Created**:
   ```bash
   curl -H "Authorization: Bearer <your-jwt-token>" \
        http://localhost:3000/credentials/service/google
   ```

#### **Test Other Providers**
```bash
# GitHub
GET http://localhost:3000/auth/oauth2/github/auth

# Slack  
GET http://localhost:3000/auth/oauth2/slack/auth

# Discord
GET http://localhost:3000/auth/oauth2/discord/auth
```

### **5. Credential Validation Test**

```bash
# Test credential connectivity
curl -H "Authorization: Bearer <your-jwt-token>" \
     http://localhost:3000/credentials/<credential-id>/test

# Expected response:
{
  "isValid": true,
  "details": {
    "email": "user@gmail.com",
    "name": "User Name"
  }
}
```

### **6. Google Services Integration Test**

```javascript
// Test in your workflow node
const { GoogleCredentialsHelper } = require('@modules/credentials/application/services/google-credentials.helper');

// In your service/node
async testGoogleIntegration(userId) {
  const hasCredentials = await this.googleCredentialsHelper.hasValidGoogleCredentials(userId);
  console.log('Has Google credentials:', hasCredentials);
  
  if (hasCredentials) {
    const gmail = await this.googleCredentialsHelper.getGoogleService(userId, 'gmail');
    const messages = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 5,
    });
    console.log('Gmail messages:', messages.data);
  }
}
```

### **7. Token Refresh Test**

```bash
# Force refresh expired tokens
curl -X POST http://localhost:3000/credentials/refresh-expired \
  -H "Authorization: Bearer <your-jwt-token>"

# Expected response:
{
  "refreshed": 1,
  "failed": 0,
  "errors": []
}
```

### **8. Statistics Test**

```bash
# Get credential statistics
curl -H "Authorization: Bearer <your-jwt-token>" \
     http://localhost:3000/credentials/stats

# Expected response:
{
  "total": 2,
  "byType": {
    "oauth2": 1,
    "api_key": 1
  },
  "byService": {
    "google": 1,
    "test": 1
  },
  "expired": 0,
  "active": 2
}
```

## 🔍 Troubleshooting

### **Common Issues & Solutions**

#### **1. "Failed to decrypt credential data"**
- **Cause**: Wrong or missing `ENCRYPTION_KEY`
- **Solution**: Set a consistent 32-character encryption key in `.env`

#### **2. "No Google credentials found for user"**
- **Cause**: User hasn't completed OAuth2 flow
- **Solution**: Complete Google OAuth2 authentication first

#### **3. "Invalid authorization code"**
- **Cause**: OAuth2 configuration mismatch
- **Solution**: Verify redirect URIs match in OAuth2 provider settings

#### **4. "Token has expired"**
- **Cause**: OAuth2 token expired and refresh failed
- **Solution**: Re-authenticate or check refresh token validity

#### **5. "Credential with this name already exists"**
- **Cause**: Duplicate credential name for user
- **Solution**: Use unique names or update existing credential

### **Debug Commands**

```bash
# Check database credentials
npm run typeorm query "SELECT id, name, service, type, \"isActive\" FROM credentials"

# Check encryption/decryption
node -e "
const crypto = require('crypto-js');
const key = process.env.ENCRYPTION_KEY;
const data = {test: 'data'};
const encrypted = crypto.AES.encrypt(JSON.stringify(data), key).toString();
const decrypted = JSON.parse(crypto.AES.decrypt(encrypted, key).toString(crypto.enc.Utf8));
console.log('Encryption test:', JSON.stringify(decrypted) === JSON.stringify(data));
"

# Test OAuth2 token validation
curl "https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=<your-access-token>"
```

## 📊 System Status Check

### **Health Check Script**

```javascript
// Create: scripts/check-credentials-health.js
const axios = require('axios');

async function checkCredentialsHealth() {
  const baseURL = 'http://localhost:3000';
  const token = 'your-jwt-token'; // Replace with actual token
  
  const checks = [
    {
      name: 'Get Credentials',
      url: `${baseURL}/credentials`,
      method: 'GET'
    },
    {
      name: 'Get Statistics', 
      url: `${baseURL}/credentials/stats`,
      method: 'GET'
    },
    {
      name: 'OAuth2 Providers',
      url: `${baseURL}/auth/oauth2/providers`,
      method: 'GET'
    }
  ];
  
  for (const check of checks) {
    try {
      const response = await axios({
        method: check.method,
        url: check.url,
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`✅ ${check.name}: OK`);
    } catch (error) {
      console.log(`❌ ${check.name}: ${error.message}`);
    }
  }
}

checkCredentialsHealth();
```

## 🎯 What's Working vs What's Pending

### **✅ Fully Working**
- Credential CRUD operations
- OAuth2 flows for all providers
- Encryption/decryption
- Token refresh mechanisms
- Credential validation
- Google services integration
- Statistics and analytics
- Credential sharing (basic)

### **⚠️ Needs Configuration**
- Environment variables setup
- OAuth2 provider credentials
- Frontend integration
- Database migrations

### **🔄 Pending Enhancements**
- Advanced credential rotation policies
- Webhook-based token refresh
- Credential usage analytics
- Advanced sharing permissions
- Credential templates
- Bulk operations

## 🚀 Quick Start Checklist

1. **✅ Set Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your OAuth2 credentials
   ```

2. **✅ Run Database Migrations**
   ```bash
   npm run db:migrate
   ```

3. **✅ Start Application**
   ```bash
   npm run start:dev
   ```

4. **✅ Test Basic Functionality**
   ```bash
   curl -H "Authorization: Bearer <token>" http://localhost:3000/credentials
   ```

5. **✅ Setup Google OAuth2**
   - Configure Google Cloud Console
   - Test OAuth2 flow

6. **✅ Test Integration**
   - Create test credentials
   - Validate connectivity
   - Test Google services

## 📈 Next Steps

1. **Frontend Integration**: Build UI for credential management
2. **Workflow Integration**: Use credentials in workflow nodes
3. **Monitoring**: Add credential usage monitoring
4. **Security**: Implement advanced security features
5. **Documentation**: Create user guides

Your credentials system is comprehensive and production-ready! The main requirement is proper environment configuration and OAuth2 provider setup. 🎉