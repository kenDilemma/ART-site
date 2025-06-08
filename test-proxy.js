const axios = require('axios');
const { SocksProxyAgent } = require('socks-proxy-agent');
require('dotenv').config();

async function testProxyConnection() {
  console.log('Testing proxy connection to .onion address...');
  
  const torProxyHost = process.env.TOR_PROXY_HOST || '127.0.0.1';
  const torProxyPort = process.env.TOR_PROXY_PORT || '9050';
  const proxyUrl = `socks5://${torProxyHost}:${torProxyPort}`;
  
  console.log(`Proxy URL: ${proxyUrl}`);
  console.log(`Target URL: ${process.env.NEXTCLOUD_URL}`);
 
  // Create SOCKS proxy agent with proper configuration
  const agent = new SocksProxyAgent(proxyUrl);
  
  try {
    console.log('1. Testing basic proxy connection...');
    
    const response = await axios({
      method: 'GET',
      url: process.env.NEXTCLOUD_URL,
      httpsAgent: agent,
      httpAgent: agent,
      timeout: 30000,
      validateStatus: () => true, // Accept any status code
      auth: {
        username: process.env.NEXTCLOUD_USERNAME,
        password: process.env.NEXTCLOUD_PASSWORD
      },
      // Important: Disable proxy and let the agent handle it
      proxy: false
    });
    
    console.log(`✓ Connection successful! Status: ${response.status}`);
    console.log(`Response headers:`, Object.keys(response.headers));
    
  } catch (error) {
    console.error('✗ Connection failed:');
    console.error(`Error code: ${error.code}`);
    console.error(`Error message: ${error.message}`);
    
    if (error.code === 'ENOTFOUND') {
      console.log('\nTroubleshooting ENOTFOUND error:');
      console.log('1. Check if the .onion address is correct');
      console.log('2. Verify Tor is running and accessible on port 9050');
      console.log('3. Test if Tor can resolve .onion addresses manually');
      console.log('4. Try: curl --socks5-hostname 127.0.0.1:9050 ' + process.env.NEXTCLOUD_URL);
    }
  }
}

async function testCalDAVWithImprovedProxy() {
  console.log('\n2. Testing CalDAV with improved proxy configuration...');
  
  try {
    // Create agent with explicit SOCKS5 hostname resolution
    const agent = new SocksProxyAgent({
      hostname: '127.0.0.1',
      port: 9050,
      protocol: 'socks5:'
    });
    
    // Test base DAV endpoint first
    const basePath = '/remote.php/dav';
    const fullUrl = process.env.NEXTCLOUD_URL + basePath;
    
    console.log(`Testing base DAV endpoint: ${fullUrl}`);
    
    const response = await axios({
      method: 'PROPFIND',
      url: fullUrl,
      httpsAgent: agent,
      httpAgent: agent,
      timeout: 30000,
      validateStatus: () => true,
      auth: {
        username: process.env.NEXTCLOUD_USERNAME,
        password: process.env.NEXTCLOUD_PASSWORD
      },
      headers: {
        'Content-Type': 'application/xml',
        'Depth': '0'
      },
      data: `<?xml version="1.0" encoding="utf-8" ?>
        <D:propfind xmlns:D="DAV:">
          <D:prop>
            <D:displayname />
            <D:resourcetype />
          </D:prop>
        </D:propfind>`,
      proxy: false // Important: disable built-in proxy
    });
    
    console.log(`✓ Base DAV endpoint accessible! Status: ${response.status}`);
    console.log(`Response content type: ${response.headers['content-type']}`);
    
  } catch (error) {
    console.error('✗ Improved proxy config failed:');
    console.error(`Error: ${error.message}`);
    console.error(`Code: ${error.code}`);
  }
}

async function testCalendarDiscovery() {
  console.log('\n3. Testing calendar discovery...');
  
  const agent = new SocksProxyAgent(`socks5://127.0.0.1:9050`);
  const calendarPath = `/remote.php/dav/calendars/${process.env.NEXTCLOUD_USERNAME}/`;
  const fullUrl = process.env.NEXTCLOUD_URL + calendarPath;
  
  console.log(`Calendar discovery URL: ${fullUrl}`);
  
  try {
    const response = await axios({
      method: 'PROPFIND',
      url: fullUrl,
      httpsAgent: agent,
      httpAgent: agent,
      timeout: 30000,
      validateStatus: () => true,
      auth: {
        username: process.env.NEXTCLOUD_USERNAME,
        password: process.env.NEXTCLOUD_PASSWORD
      },
      headers: {
        'Content-Type': 'application/xml',
        'Depth': '1'
      },
      data: `<?xml version="1.0" encoding="utf-8" ?>
        <D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
          <D:prop>
            <D:displayname />
            <D:resourcetype />
            <C:supported-calendar-component-set />
          </D:prop>
        </D:propfind>`,
      proxy: false
    });
    
    console.log(`✓ Calendar discovery successful! Status: ${response.status}`);
    console.log(`Response length: ${response.data?.length || 0} characters`);
    
    // Look for calendar names in the response
    if (response.data && typeof response.data === 'string') {
      const displayNameMatches = response.data.match(/<D:displayname>([^<]+)<\/D:displayname>/g);
      if (displayNameMatches) {
        console.log('Found calendars:');
        displayNameMatches.forEach(match => {
          const name = match.replace(/<\/?D:displayname>/g, '');
          console.log(`  - ${name}`);
        });
      }
    }
    
  } catch (error) {
    console.error('✗ Calendar discovery failed:');
    console.error(`Error: ${error.message}`);
  }
}

async function testSpecificCalendar() {
  console.log('\n4. Testing specific calendar access...');
  
  const agent = new SocksProxyAgent(`socks5://127.0.0.1:9050`);
  const calendarPath = `/remote.php/dav/calendars/${process.env.NEXTCLOUD_USERNAME}/${process.env.NEXTCLOUD_CALENDAR}/`;
  const fullUrl = process.env.NEXTCLOUD_URL + calendarPath;
  
  console.log(`Specific calendar URL: ${fullUrl}`);
  
  try {
    const response = await axios({
      method: 'PROPFIND',
      url: fullUrl,
      httpsAgent: agent,
      httpAgent: agent,
      timeout: 30000,
      validateStatus: () => true,
      auth: {
        username: process.env.NEXTCLOUD_USERNAME,
        password: process.env.NEXTCLOUD_PASSWORD
      },
      headers: {
        'Content-Type': 'application/xml',
        'Depth': '0'
      },
      data: `<?xml version="1.0" encoding="utf-8" ?>
        <D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
          <D:prop>
            <D:displayname />
            <D:resourcetype />
            <C:supported-calendar-component-set />
          </D:prop>
        </D:propfind>`,
      proxy: false
    });
    
    console.log(`✓ Specific calendar accessible! Status: ${response.status}`);
    
  } catch (error) {
    console.error('✗ Specific calendar access failed:');
    console.error(`Error: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
    }
  }
}

// Run all tests
async function runTests() {
  console.log('='.repeat(60));
  console.log('COMPREHENSIVE TOR PROXY AND CALDAV TEST');
  console.log('='.repeat(60));
  
  await testProxyConnection();
  await testCalDAVWithImprovedProxy();
  await testCalendarDiscovery();
  await testSpecificCalendar();
  
  console.log('\n' + '='.repeat(60));
  console.log('Test completed. Check results above for diagnosis.');
  console.log('\nIf all tests fail with ENOTFOUND:');
  console.log('1. Ensure Tor is running: netstat -an | findstr 9050');
  console.log('2. Test manual connection: curl --socks5-hostname 127.0.0.1:9050 ' + process.env.NEXTCLOUD_URL);
  console.log('3. Check if .onion address is correct and accessible');
  console.log('='.repeat(60));
}

runTests().catch(console.error);
