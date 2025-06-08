const NextcloudCalendar = require('./nextcloud-calendar.js');
const axios = require('axios');

console.log('='.repeat(70));
console.log('INVESTIGATING AUTHENTICATION ISSUE');
console.log('='.repeat(70));
console.log('Script starting...');

const config = {
  baseUrl: 'http://r7bml6jyfycorb7ir4yub7pvitrgj4a3we2pcuqbnrq364jsfddjnryd.onion',
  username: 'ken',
  password: 'Mu99$y202323',
  calendarName: 'MEETING'
};

async function testAuthentication() {
  console.log('\nCreating calendar instance...');
  const calendar = new NextcloudCalendar(config);
  
  // Test the specific HTTPS endpoint that returned 401
  const testUrl = 'https://r7bml6jyfycorb7ir4yub7pvitrgj4a3we2pcuqbnrq364jsfddjnryd.onion/remote.php/dav';
  
  console.log(`\nTesting authentication at: ${testUrl}`);
  console.log(`Username: ${config.username}`);
  console.log(`Password: ${config.password ? '[SET]' : '[NOT SET]'}`);
  
  try {
    // Test 1: Basic AUTH header test
    console.log('\n--- Test 1: Basic HTTP AUTH ---');
    const authString = Buffer.from(`${config.username}:${config.password}`).toString('base64');
    console.log(`Auth header: Basic ${authString}`);
    
    const basicAuthConfig = {
      ...calendar.axiosConfig,
      method: 'PROPFIND',
      url: testUrl,
      headers: {
        ...calendar.axiosConfig.headers,
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/xml',
        'Depth': '0'
      },
      data: `<?xml version="1.0" encoding="utf-8" ?>
        <D:propfind xmlns:D="DAV:">
          <D:prop>
            <D:current-user-principal />
          </D:prop>
        </D:propfind>`
    };

    const response1 = await axios(basicAuthConfig);
    console.log('✓ Basic AUTH successful!', response1.status);
    console.log('Response data:', response1.data.substring(0, 200) + '...');
    
  } catch (error) {
    console.log('✗ Basic AUTH failed:', error.message);
    if (error.response) {
      console.log('  Status:', error.response.status);
      console.log('  Status text:', error.response.statusText);
      console.log('  Headers:', error.response.headers);
      
      // Check for authentication challenge headers
      if (error.response.headers['www-authenticate']) {
        console.log('  WWW-Authenticate:', error.response.headers['www-authenticate']);
      }
    }
  }
  
  try {
    // Test 2: Test with axios auth config (which should be equivalent)
    console.log('\n--- Test 2: Axios auth config ---');
    const axiosAuthConfig = {
      ...calendar.axiosConfig,
      method: 'PROPFIND',
      url: testUrl,
      headers: {
        ...calendar.axiosConfig.headers,
        'Content-Type': 'application/xml',
        'Depth': '0'
      },
      auth: {
        username: config.username,
        password: config.password
      },
      data: `<?xml version="1.0" encoding="utf-8" ?>
        <D:propfind xmlns:D="DAV:">
          <D:prop>
            <D:current-user-principal />
          </D:prop>
        </D:propfind>`
    };

    const response2 = await axios(axiosAuthConfig);
    console.log('✓ Axios auth successful!', response2.status);
    console.log('Response data:', response2.data.substring(0, 200) + '...');
    
  } catch (error) {
    console.log('✗ Axios auth failed:', error.message);
    if (error.response) {
      console.log('  Status:', error.response.status);
      console.log('  Headers:', error.response.headers);
    }
  }
  
  try {
    // Test 3: Simple GET request to check if endpoint is accessible
    console.log('\n--- Test 3: Simple GET request ---');
    const getConfig = {
      ...calendar.axiosConfig,
      method: 'GET',
      url: testUrl,
      auth: {
        username: config.username,
        password: config.password
      }
    };

    const response3 = await axios(getConfig);
    console.log('✓ GET request successful!', response3.status);
    
  } catch (error) {
    console.log('✗ GET request failed:', error.message);
    if (error.response) {
      console.log('  Status:', error.response.status);
      console.log('  Allowed methods:', error.response.headers['allow'] || 'Not specified');
    }
  }
  
  try {
    // Test 4: Test different username combinations
    console.log('\n--- Test 4: Username variations ---');
    const usernames = [
      'ken',
      'Ken',
      'KEN',
      'ken@localhost',
      'ken@' + 'r7bml6jyfycorb7ir4yub7pvitrgj4a3we2pcuqbnrq364jsfddjnryd.onion'
    ];
    
    for (const username of usernames) {
      try {
        console.log(`Trying username: ${username}`);
        const testConfig = {
          ...calendar.axiosConfig,
          method: 'PROPFIND',
          url: testUrl,
          headers: {
            ...calendar.axiosConfig.headers,
            'Content-Type': 'application/xml',
            'Depth': '0'
          },
          auth: {
            username: username,
            password: config.password
          },
          data: `<?xml version="1.0" encoding="utf-8" ?>
            <D:propfind xmlns:D="DAV:">
              <D:prop>
                <D:current-user-principal />
              </D:prop>
            </D:propfind>`
        };

        const response = await axios(testConfig);
        console.log(`✓ SUCCESS with username: ${username} (${response.status})`);
        console.log('Response data:', response.data.substring(0, 300) + '...');
        break;
        
      } catch (error) {
        console.log(`  ${username}: ${error.response?.status || error.message}`);
      }
    }
    
  } catch (error) {
    console.log('Username variation test failed:', error.message);
  }
}

// Run the test
testAuthentication().catch(console.error);
