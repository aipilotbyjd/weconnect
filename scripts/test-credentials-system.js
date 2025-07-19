#!/usr/bin/env node

/**
 * WeConnect Credentials System Test Script
 * 
 * This script tests the credentials system functionality
 * Run with: node scripts/test-credentials-system.js
 */

const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class CredentialsSystemTester {
  constructor() {
    this.baseURL = process.env.API_URL || 'http://localhost:3000';
    this.token = null;
    this.testResults = [];
  }

  async run() {
    console.log('🔐 WeConnect Credentials System Tester\n');
    
    // Get JWT token
    await this.getJWTToken();
    
    // Run tests
    await this.runAllTests();
    
    // Show results
    this.showResults();
    
    rl.close();
  }

  async getJWTToken() {
    return new Promise((resolve) => {
      rl.question('Enter your JWT token: ', (token) => {
        this.token = token.trim();
        resolve();
      });
    });
  }

  async runAllTests() {
    console.log('\n🧪 Running Credentials System Tests...\n');

    const tests = [
      { name: 'Environment Check', fn: () => this.testEnvironment() },
      { name: 'API Connectivity', fn: () => this.testAPIConnectivity() },
      { name: 'Get Credentials', fn: () => this.testGetCredentials() },
      { name: 'Create Test Credential', fn: () => this.testCreateCredential() },
      { name: 'Validate Credential', fn: () => this.testValidateCredential() },
      { name: 'Get Statistics', fn: () => this.testGetStatistics() },
      { name: 'OAuth2 Providers', fn: () => this.testOAuth2Providers() },
      { name: 'Google Service Check', fn: () => this.testGoogleServiceCheck() },
      { name: 'Token Refresh', fn: () => this.testTokenRefresh() },
      { name: 'Cleanup Test Data', fn: () => this.cleanupTestData() }
    ];

    for (const test of tests) {
      try {
        console.log(`⏳ ${test.name}...`);
        const result = await test.fn();
        this.testResults.push({ name: test.name, status: 'PASS', result });
        console.log(`✅ ${test.name}: PASSED`);
      } catch (error) {
        this.testResults.push({ name: test.name, status: 'FAIL', error: error.message });
        console.log(`❌ ${test.name}: FAILED - ${error.message}`);
      }
      console.log('');
    }
  }

  async testEnvironment() {
    const requiredEnvVars = [
      'ENCRYPTION_KEY',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'FRONTEND_URL'
    ];

    const missing = requiredEnvVars.filter(env => !process.env[env]);
    
    if (missing.length > 0) {
      throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }

    return { message: 'All required environment variables are set' };
  }

  async testAPIConnectivity() {
    const response = await this.makeRequest('GET', '/credentials');
    
    if (response.status !== 200) {
      throw new Error(`API not accessible: ${response.status}`);
    }

    return { message: 'API is accessible', status: response.status };
  }

  async testGetCredentials() {
    const response = await this.makeRequest('GET', '/credentials');
    
    return { 
      message: `Found ${response.data.length} credentials`,
      count: response.data.length,
      credentials: response.data.map(c => ({ id: c.id, name: c.name, service: c.service }))
    };
  }

  async testCreateCredential() {
    const testCredential = {
      name: 'Test API Key - ' + Date.now(),
      type: 'api_key',
      service: 'test',
      data: {
        apiKey: 'test-key-' + Math.random().toString(36).substr(2, 9)
      }
    };

    const response = await this.makeRequest('POST', '/credentials', testCredential);
    
    if (!response.data.id) {
      throw new Error('Credential creation failed - no ID returned');
    }

    this.testCredentialId = response.data.id;
    
    return { 
      message: 'Test credential created successfully',
      credentialId: response.data.id,
      name: response.data.name
    };
  }

  async testValidateCredential() {
    if (!this.testCredentialId) {
      throw new Error('No test credential available');
    }

    const response = await this.makeRequest('GET', `/credentials/${this.testCredentialId}/validate`);
    
    return {
      message: 'Credential validation completed',
      isValid: response.data.isValid,
      credentialId: response.data.credentialId
    };
  }

  async testGetStatistics() {
    const response = await this.makeRequest('GET', '/credentials/stats');
    
    return {
      message: 'Statistics retrieved successfully',
      stats: response.data
    };
  }

  async testOAuth2Providers() {
    const response = await this.makeRequest('GET', '/auth/oauth2/providers');
    
    return {
      message: 'OAuth2 providers retrieved',
      providers: response.data.providers
    };
  }

  async testGoogleServiceCheck() {
    try {
      const response = await this.makeRequest('GET', '/credentials/service/google');
      
      if (response.data) {
        return {
          message: 'Google credentials found',
          hasGoogleCredentials: true,
          credentialName: response.data.name
        };
      } else {
        return {
          message: 'No Google credentials found (this is normal if not set up)',
          hasGoogleCredentials: false
        };
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return {
          message: 'No Google credentials found (this is normal if not set up)',
          hasGoogleCredentials: false
        };
      }
      throw error;
    }
  }

  async testTokenRefresh() {
    const response = await this.makeRequest('POST', '/credentials/refresh-expired');
    
    return {
      message: 'Token refresh completed',
      refreshed: response.data.refreshed,
      failed: response.data.failed,
      errors: response.data.errors
    };
  }

  async cleanupTestData() {
    if (!this.testCredentialId) {
      return { message: 'No test data to cleanup' };
    }

    try {
      await this.makeRequest('DELETE', `/credentials/${this.testCredentialId}`);
      return { message: 'Test credential deleted successfully' };
    } catch (error) {
      return { message: 'Failed to cleanup test credential', error: error.message };
    }
  }

  async makeRequest(method, path, data = null) {
    const config = {
      method,
      url: `${this.baseURL}${path}`,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    try {
      return await axios(config);
    } catch (error) {
      if (error.response) {
        throw new Error(`HTTP ${error.response.status}: ${error.response.data?.message || error.response.statusText}`);
      }
      throw error;
    }
  }

  showResults() {
    console.log('\n📊 Test Results Summary\n');
    console.log('='.repeat(50));
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    
    console.log(`Total Tests: ${this.testResults.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${Math.round((passed / this.testResults.length) * 100)}%`);
    
    console.log('\n📋 Detailed Results:\n');
    
    this.testResults.forEach((result, index) => {
      const status = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.name}`);
      
      if (result.status === 'FAIL') {
        console.log(`   Error: ${result.error}`);
      } else if (result.result && result.result.message) {
        console.log(`   ${result.result.message}`);
      }
    });

    console.log('\n🎯 Recommendations:\n');
    
    if (failed === 0) {
      console.log('🎉 All tests passed! Your credentials system is working correctly.');
      console.log('✅ You can now:');
      console.log('   - Set up OAuth2 providers (Google, GitHub, Slack, Discord)');
      console.log('   - Integrate credentials into your workflow nodes');
      console.log('   - Build frontend credential management UI');
    } else {
      console.log('⚠️  Some tests failed. Please check:');
      console.log('   - Environment variables are properly set');
      console.log('   - Database is running and migrated');
      console.log('   - JWT token is valid');
      console.log('   - API server is running');
    }
  }
}

// Run the tester
if (require.main === module) {
  const tester = new CredentialsSystemTester();
  tester.run().catch(console.error);
}

module.exports = CredentialsSystemTester;