// Test QAnything API connection
import { createQAnythingService } from './server/qanythingService.js';

async function testQAnythingConnection() {
  console.log('Testing QAnything API connection...');
  
  const service = createQAnythingService();
  if (!service) {
    console.error('Failed to create QAnything service - missing credentials');
    return;
  }
  
  try {
    const isConnected = await service.testConnection();
    if (isConnected) {
      console.log('✅ QAnything API connection successful!');
    } else {
      console.log('❌ QAnything API connection failed');
    }
  } catch (error) {
    console.error('❌ QAnything API test error:', error.message);
  }
}

testQAnythingConnection();