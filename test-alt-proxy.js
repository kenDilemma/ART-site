// Alternative SOCKS configuration test
const axios = require('axios');
const { SocksProxyAgent } = require('socks-proxy-agent');
require('dotenv').config();

async function testAlternativeProxyConfig() {
  console.log('Testing alternative SOCKS proxy configurations...');
  
  const configs = [
    // Config 1: socks5h with explicit options
    {
      name: 'socks5h with options',
      agent: new SocksProxyAgent('socks5h://127.0.0.1:9050', {
        timeout: 30000,
        // Force hostname resolution through proxy
        lookup: false
      })
    },
    
    // Config 2: Object-based configuration
    {
      name: 'Object-based config',
      agent: new SocksProxyAgent({
        hostname: '127.0.0.1',
        port: 9050,
        protocol: 'socks5:',
        lookup: false
      })
    },
    
    // Config 3: socks5 with explicit host resolution
    {
      name: 'socks5 with host config',
      agent: new SocksProxyAgent({
        host: '127.0.0.1',
        port: 9050,
        type: 5
      })
    }
  ];
  
  for (const config of configs) {
    console.log(`\nTesting: ${config.name}`);
    try {
      const response = await axios({
        method: 'GET',
        url: process.env.NEXTCLOUD_URL,
        httpsAgent: config.agent,
        httpAgent: config.agent,
        timeout: 30000,
        validateStatus: () => true,
        auth: {
          username: process.env.NEXTCLOUD_USERNAME,
          password: process.env.NEXTCLOUD_PASSWORD
        },
        proxy: false,
        family: 0
      });
      
      console.log(`✅ ${config.name} SUCCESS - Status: ${response.status}`);
      return config; // Return the first working config
      
    } catch (error) {
      console.log(`❌ ${config.name} FAILED - ${error.code}: ${error.message.substring(0, 100)}`);
    }
  }
  
  return null;
}

testAlternativeProxyConfig()
  .then(result => {
    if (result) {
      console.log(`\n🎉 Found working configuration: ${result.name}`);
    } else {
      console.log('\n💔 No configurations worked');
    }
  })
  .catch(console.error);
