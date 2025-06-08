const axios = require('axios');
const { SocksProxyAgent } = require('socks-proxy-agent');
require('dotenv').config();

async function testWithSocks5h() {
  console.log('Testing with socks5h:// protocol (hostname resolution through proxy)...');
  
  try {
    // Use socks5h to force hostname resolution through proxy
    const agent = new SocksProxyAgent('socks5h://127.0.0.1:9050');
    
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
      maxRedirects: 0
    });
    
    console.log(`✓ Connection successful! Status: ${response.status}`);
    console.log(`Response headers:`, Object.keys(response.headers));
    return true;
    
  } catch (error) {
    console.error('✗ Connection failed:', error.message);
    console.error('Error code:', error.code);
    return false;
  }
}

async function testCalDAVWithSocks5h() {
  console.log('\nTesting CalDAV endpoints with socks5h://...');
  
  try {
    const agent = new SocksProxyAgent('socks5h://127.0.0.1:9050');
    
    // Test base DAV endpoint
    const response = await axios({
      method: 'PROPFIND',
      url: process.env.NEXTCLOUD_URL + '/remote.php/dav',
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
      proxy: false,
      maxRedirects: 0
    });
    
    console.log(`✓ CalDAV base endpoint accessible! Status: ${response.status}`);
    
    // Test calendar discovery
    const calendarResponse = await axios({
      method: 'PROPFIND',
      url: process.env.NEXTCLOUD_URL + `/remote.php/dav/calendars/${process.env.NEXTCLOUD_USERNAME}/`,
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
      proxy: false,
      maxRedirects: 0
    });
    
    console.log(`✓ Calendar discovery successful! Status: ${calendarResponse.status}`);
    
    // Look for calendar names in the response
    if (calendarResponse.data && typeof calendarResponse.data === 'string') {
      const displayNameMatches = calendarResponse.data.match(/<D:displayname>([^<]+)<\/D:displayname>/g);
      if (displayNameMatches) {
        console.log('Found calendars:');
        displayNameMatches.forEach(match => {
          const name = match.replace(/<\/?D:displayname>/g, '');
          console.log(`  - ${name}`);
        });
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('✗ CalDAV test failed:', error.message);
    return false;
  }
}

async function runImprovedTests() {
  console.log('='.repeat(60));
  console.log('IMPROVED SOCKS5H PROXY TEST');
  console.log('='.repeat(60));
  
  const basicTest = await testWithSocks5h();
  
  if (basicTest) {
    console.log('\n🎉 Basic connection works! Proceeding with CalDAV tests...');
    await testCalDAVWithSocks5h();
  } else {
    console.log('\n❌ Basic connection failed. Troubleshooting needed.');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('RESULTS SUMMARY');
  console.log('='.repeat(60));
  
  if (basicTest) {
    console.log('✅ SOCKS5H proxy configuration works!');
    console.log('✅ .onion address is accessible through Tor');
    console.log('📝 Next steps: Update NextcloudCalendar class to use socks5h://');
  } else {
    console.log('❌ SOCKS5H proxy configuration failed');
    console.log('🔧 May need to try alternative Node.js SOCKS libraries');
  }
}

runImprovedTests().catch(console.error);
