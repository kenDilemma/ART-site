const axios = require('axios');
const { SocksProxyAgent } = require('socks-proxy-agent');
require('dotenv').config();

async function testWithDNSResolutionDisabled() {
  console.log('Testing with DNS resolution disabled through SOCKS...');
  
  try {
    // Try a different configuration approach
    const agent = new SocksProxyAgent('socks5://127.0.0.1:9050', {
      // Force hostname resolution through SOCKS proxy
      lookup: false
    });
    
    const response = await axios({
      method: 'GET',
      url: process.env.NEXTCLOUD_URL,
      httpsAgent: agent,
      httpAgent: agent,
      timeout: 30000,
      validateStatus: () => true,
      auth: {
        username: process.env.NEXTCLOUD_USERNAME,
        password: process.env.NEXTCLOUD_PASSWORD
      },
      proxy: false,
      // Disable Node.js DNS resolution completely
      family: 0
    });
    
    console.log(`✓ Connection successful! Status: ${response.status}`);
    return true;
    
  } catch (error) {
    console.error('✗ Connection failed:', error.message);
    return false;
  }
}

async function testWithProxyURL() {
  console.log('\nTesting with URL-based proxy configuration...');
  
  try {
    const response = await axios({
      method: 'GET',
      url: process.env.NEXTCLOUD_URL,
      proxy: {
        protocol: 'socks5',
        host: '127.0.0.1',
        port: 9050
      },
      timeout: 30000,
      validateStatus: () => true,
      auth: {
        username: process.env.NEXTCLOUD_USERNAME,
        password: process.env.NEXTCLOUD_PASSWORD
      }
    });
    
    console.log(`✓ URL proxy successful! Status: ${response.status}`);
    return true;
    
  } catch (error) {
    console.error('✗ URL proxy failed:', error.message);
    return false;
  }
}

async function testWithHttpsProxyAgent() {
  console.log('\nTesting with alternative proxy agent...');
  
  try {
    // Try using tunnel for SOCKS
    const { SocksProxyAgent } = require('socks-proxy-agent');
    
    // Different agent configuration
    const proxyOptions = {
      hostname: '127.0.0.1',
      port: 9050,
      userId: '', 
      password: ''
    };
    
    const agent = new SocksProxyAgent(`socks5h://127.0.0.1:9050`);
    
    const response = await axios({
      method: 'GET',
      url: process.env.NEXTCLOUD_URL,
      httpsAgent: agent,
      httpAgent: agent,
      timeout: 30000,
      validateStatus: () => true,
      auth: {
        username: process.env.NEXTCLOUD_USERNAME,
        password: process.env.NEXTCLOUD_PASSWORD
      },
      proxy: false
    });
    
    console.log(`✓ Alternative agent successful! Status: ${response.status}`);
    return true;
    
  } catch (error) {
    console.error('✗ Alternative agent failed:', error.message);
    return false;
  }
}

async function runSocksTests() {
  console.log('='.repeat(50));
  console.log('DIRECT SOCKS CONFIGURATION TESTS');
  console.log('='.repeat(50));
  
  const test1 = await testWithDNSResolutionDisabled();
  const test2 = await testWithProxyURL();
  const test3 = await testWithHttpsProxyAgent();
  
  if (!test1 && !test2 && !test3) {
    console.log('\n❌ All SOCKS tests failed. This suggests:');
    console.log('1. The .onion address might be incorrect');
    console.log('2. The Nextcloud server might be down');
    console.log('3. There might be a configuration issue with Tor');
    console.log('\nTry testing manually with curl:');
    console.log(`curl --socks5-hostname 127.0.0.1:9050 ${process.env.NEXTCLOUD_URL}`);
  }
}

runSocksTests().catch(console.error);
