#!/usr/bin/env node

/**
 * WeConnect Credentials Environment Setup Script
 * 
 * This script helps set up the environment variables for the credentials system
 * Run with: node scripts/setup-credentials-env.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class CredentialsEnvSetup {
  constructor() {
    this.envPath = path.join(process.cwd(), '.env');
    this.envConfig = {};
  }

  async run() {
    console.log('🔐 WeConnect Credentials Environment Setup\n');
    console.log('This script will help you configure the credentials system.\n');

    // Load existing .env if it exists
    await this.loadExistingEnv();

    // Setup required variables
    await this.setupEncryptionKey();
    await this.setupGoogleOAuth2();
    await this.setupOptionalProviders();
    await this.setupFrontendURL();

    // Save configuration
    await this.saveEnvFile();

    console.log('\n✅ Environment setup complete!');
    console.log('\n🚀 Next steps:');
    console.log('1. Restart your application: npm run start:dev');
    console.log('2. Test the credentials system: node scripts/test-credentials-system.js');
    console.log('3. Set up OAuth2 providers in their respective consoles');

    rl.close();
  }

  async loadExistingEnv() {
    if (fs.existsSync(this.envPath)) {
      const envContent = fs.readFileSync(this.envPath, 'utf8');
      const lines = envContent.split('\n');
      
      lines.forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          this.envConfig[key.trim()] = valueParts.join('=').trim();
        }
      });
      
      console.log('📄 Loaded existing .env file');
    }
  }

  async setupEncryptionKey() {
    console.log('\n🔑 Encryption Key Setup');
    console.log('The encryption key is used to securely store credentials.');
    
    if (this.envConfig.ENCRYPTION_KEY) {
      console.log('✅ Encryption key already set');
      const useExisting = await this.askQuestion('Use existing encryption key? (y/n): ');
      if (useExisting.toLowerCase() === 'y') {
        return;
      }
    }

    console.log('⚠️  WARNING: Changing the encryption key will make existing credentials unreadable!');
    const generateNew = await this.askQuestion('Generate new 32-character encryption key? (y/n): ');
    
    if (generateNew.toLowerCase() === 'y') {
      this.envConfig.ENCRYPTION_KEY = crypto.randomBytes(16).toString('hex');
      console.log('✅ Generated new encryption key');
    } else {
      const customKey = await this.askQuestion('Enter your 32-character encryption key: ');
      if (customKey.length !== 32) {
        console.log('❌ Key must be exactly 32 characters. Using generated key instead.');
        this.envConfig.ENCRYPTION_KEY = crypto.randomBytes(16).toString('hex');
      } else {
        this.envConfig.ENCRYPTION_KEY = customKey;
      }
    }
  }

  async setupGoogleOAuth2() {
    console.log('\n🔵 Google OAuth2 Setup');
    console.log('Required for Gmail, Calendar, Drive, Docs, and Sheets integration.');
    
    const setupGoogle = await this.askQuestion('Set up Google OAuth2? (y/n): ');
    if (setupGoogle.toLowerCase() !== 'y') {
      console.log('⏭️  Skipping Google OAuth2 setup');
      return;
    }

    console.log('\n📋 You need to:');
    console.log('1. Go to https://console.cloud.google.com/');
    console.log('2. Create a project or select existing');
    console.log('3. Enable Gmail, Calendar, Drive, Docs, and Sheets APIs');
    console.log('4. Create OAuth2 credentials');
    console.log('5. Add redirect URI: http://localhost:3000/auth/oauth2/google/callback');

    this.envConfig.GOOGLE_CLIENT_ID = await this.askQuestion('Google Client ID: ');
    this.envConfig.GOOGLE_CLIENT_SECRET = await this.askQuestion('Google Client Secret: ');
    this.envConfig.GOOGLE_REDIRECT_URI = 'http://localhost:3000/auth/oauth2/google/callback';
    
    console.log('✅ Google OAuth2 configured');
  }

  async setupOptionalProviders() {
    console.log('\n🔧 Optional OAuth2 Providers');
    
    const providers = [
      {
        name: 'GitHub',
        envPrefix: 'GITHUB',
        setupUrl: 'https://github.com/settings/developers',
        redirectUri: 'http://localhost:3000/auth/oauth2/github/callback'
      },
      {
        name: 'Slack',
        envPrefix: 'SLACK',
        setupUrl: 'https://api.slack.com/apps',
        redirectUri: 'http://localhost:3000/auth/oauth2/slack/callback'
      },
      {
        name: 'Discord',
        envPrefix: 'DISCORD',
        setupUrl: 'https://discord.com/developers/applications',
        redirectUri: 'http://localhost:3000/auth/oauth2/discord/callback'
      }
    ];

    for (const provider of providers) {
      const setup = await this.askQuestion(`Set up ${provider.name} OAuth2? (y/n): `);
      if (setup.toLowerCase() === 'y') {
        console.log(`\n📋 ${provider.name} Setup:`);
        console.log(`1. Go to ${provider.setupUrl}`);
        console.log(`2. Create new OAuth2 application`);
        console.log(`3. Set redirect URI: ${provider.redirectUri}`);

        this.envConfig[`${provider.envPrefix}_CLIENT_ID`] = await this.askQuestion(`${provider.name} Client ID: `);
        this.envConfig[`${provider.envPrefix}_CLIENT_SECRET`] = await this.askQuestion(`${provider.name} Client Secret: `);
        this.envConfig[`${provider.envPrefix}_REDIRECT_URI`] = provider.redirectUri;
        
        console.log(`✅ ${provider.name} OAuth2 configured`);
      }
    }
  }

  async setupFrontendURL() {
    console.log('\n🌐 Frontend URL Setup');
    console.log('This is where users will be redirected after OAuth2 authentication.');
    
    if (this.envConfig.FRONTEND_URL) {
      console.log(`Current frontend URL: ${this.envConfig.FRONTEND_URL}`);
      const useExisting = await this.askQuestion('Use existing frontend URL? (y/n): ');
      if (useExisting.toLowerCase() === 'y') {
        return;
      }
    }

    const frontendUrl = await this.askQuestion('Frontend URL (default: http://localhost:4200): ');
    this.envConfig.FRONTEND_URL = frontendUrl || 'http://localhost:4200';
    
    console.log('✅ Frontend URL configured');
  }

  async saveEnvFile() {
    console.log('\n💾 Saving environment configuration...');
    
    // Read existing .env content to preserve other variables
    let existingContent = '';
    if (fs.existsSync(this.envPath)) {
      existingContent = fs.readFileSync(this.envPath, 'utf8');
    }

    // Parse existing content
    const existingLines = existingContent.split('\n');
    const existingVars = new Set();
    
    existingLines.forEach(line => {
      const [key] = line.split('=');
      if (key && key.trim()) {
        existingVars.add(key.trim());
      }
    });

    // Build new content
    let newContent = '';
    
    // Add credentials section header
    newContent += '\n# Credentials System Configuration\n';
    
    // Add new/updated variables
    Object.entries(this.envConfig).forEach(([key, value]) => {
      newContent += `${key}=${value}\n`;
      existingVars.add(key);
    });

    // Preserve existing variables that we didn't modify
    existingLines.forEach(line => {
      const [key] = line.split('=');
      if (key && key.trim() && !this.envConfig.hasOwnProperty(key.trim())) {
        if (!newContent.includes(line)) {
          newContent = line + '\n' + newContent;
        }
      }
    });

    // Write the file
    fs.writeFileSync(this.envPath, newContent);
    
    console.log(`✅ Environment configuration saved to ${this.envPath}`);
    
    // Show summary
    console.log('\n📋 Configuration Summary:');
    Object.entries(this.envConfig).forEach(([key, value]) => {
      const displayValue = key.includes('SECRET') || key.includes('KEY') 
        ? '*'.repeat(8) 
        : value;
      console.log(`   ${key}: ${displayValue}`);
    });
  }

  async askQuestion(question) {
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }
}

// Run the setup
if (require.main === module) {
  const setup = new CredentialsEnvSetup();
  setup.run().catch(console.error);
}

module.exports = CredentialsEnvSetup;