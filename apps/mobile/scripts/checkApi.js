#!/usr/bin/env node
const axios = require('axios');

const DEFAULT_BASE_URL = 'https://tok-friends-api.onrender.com';
const baseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
const endpointCandidates = ['/health', '/api/health', '/'];

(async () => {
  console.log(`🔍 Checking Tok Friends API connectivity for base URL: ${baseUrl}`);
  let lastError;

  for (const path of endpointCandidates) {
    const url = `${baseUrl}${path}`;
    try {
      const start = Date.now();
      const response = await axios.get(url, { timeout: 5000 });
      const ms = Date.now() - start;
      console.log(`✅ Success via ${path || '/'} (${ms}ms)`);
      console.log('Status:', response.status);
      if (response.data) {
        console.log('Body:', typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : response.data);
      }
      process.exit(0);
    } catch (error) {
      lastError = error;
      const status = error?.response?.status;
      if (status) {
        console.log(`⚠️  ${url} responded with status ${status}`);
      } else if (error.code === 'ECONNABORTED') {
        console.log(`⚠️  ${url} timed out after 5s`);
      } else {
        console.log(`⚠️  Failed to reach ${url}:`, error.message);
      }
    }
  }

  console.error('\n❌ Unable to verify the Tok Friends API.');
  if (lastError?.response?.data) {
    console.error('Last response body:', lastError.response.data);
  }
  process.exit(1);
})();
