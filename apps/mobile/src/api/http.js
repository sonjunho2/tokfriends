// Deprecated: Use src/api/client.js instead
// This file is kept for backward compatibility
import client, { apiClient } from './client';

export { client as http, apiClient };
export { setAuthToken, clearToken, saveToken, getStoredToken } from './client';
export default client;
