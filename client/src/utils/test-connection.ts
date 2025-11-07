// Connection test utility
import { API_BASE_URL } from '@/lib/api-config';

export async function testServerConnection(): Promise<{
  connected: boolean;
  message: string;
  details?: any;
}> {
  try {
    console.log('🔍 Testing server connection to:', API_BASE_URL);
    
    // Test 1: Simple health check (if available)
    try {
      const healthResponse = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (healthResponse.ok) {
        return {
          connected: true,
          message: 'Server is reachable (health check passed)',
          details: { status: healthResponse.status }
        };
      }
    } catch (e) {
      // Health endpoint might not exist, continue with other tests
    }

    // Test 2: Try to reach the server with a simple request
    const testResponse = await fetch(`${API_BASE_URL}/api/super-admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@test.com',
        password: 'test'
      })
    });

    // Even if login fails, if we get a response (not a network error), server is reachable
    if (testResponse.status === 401 || testResponse.status === 400) {
      return {
        connected: true,
        message: 'Server is reachable (got response, login failed as expected)',
        details: { status: testResponse.status }
      };
    }

    if (testResponse.ok) {
      return {
        connected: true,
        message: 'Server is reachable and responding',
        details: { status: testResponse.status }
      };
    }

    return {
      connected: true,
      message: 'Server responded (but with error status)',
      details: { status: testResponse.status }
    };
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return {
      connected: false,
      message: error instanceof Error ? error.message : 'Failed to connect to server',
      details: { error: String(error) }
    };
  }
}

// Quick connection check
export function checkConnectionStatus(): void {
  console.log('🔌 Current API Configuration:');
  console.log('  API Base URL:', API_BASE_URL);
  console.log('  Expected Backend:', 'https://asli-stud-back-production.up.railway.app');
  
  // Test if we can at least resolve the URL
  try {
    const url = new URL(API_BASE_URL);
    console.log('  ✅ URL is valid');
    console.log('  Hostname:', url.hostname);
    console.log('  Protocol:', url.protocol);
  } catch (e) {
    console.error('  ❌ Invalid URL:', e);
  }
}

