const NextcloudCalendar = require('./nextcloud-calendar.js');
const axios = require('axios');

console.log('='.repeat(50));
console.log('SIMPLE AUTHENTICATION TEST');
console.log('='.repeat(50));

const config = {
  baseUrl: 'https://r7bml6jyfycorb7ir4yub7pvitrgj4a3we2pcuqbnrq364jsfddjnryd.onion',
  username: 'ken',
  password: 'Mu99$y202323',
  calendarName: 'MEETING'
};

async function simpleAuthTest() {
  console.log('Creating calendar instance...');
  const calendar = new NextcloudCalendar(config);
  
  const testUrl = 'https://r7bml6jyfycorb7ir4yub7pvitrgj4a3we2pcuqbnrq364jsfddjnryd.onion/remote.php/dav';
  
  console.log(`Testing: ${testUrl}`);
  console.log(`Username: ${config.username}`);
  console.log('Password: [UPDATED]');
  
  try {
    console.log('\nSending single PROPFIND request...');
    
    const authConfig = {
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

    const response = await axios(authConfig);
    console.log('✅ SUCCESS! Authentication worked!');
    console.log('Status:', response.status);
    console.log('Response preview:', response.data.substring(0, 300) + '...');
    
    // Look for current-user-principal
    const principalMatch = response.data.match(/<D:current-user-principal>\s*<D:href>([^<]+)<\/D:href>\s*<\/D:current-user-principal>/);
    if (principalMatch) {
      console.log('✅ Found current-user-principal:', principalMatch[1]);
    }
    
  } catch (error) {
    console.log('❌ Authentication failed:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Status text:', error.response.statusText);
      
      if (error.response.status === 429) {
        console.log('⏱️ Rate limited - wait a few minutes and try again');
      } else if (error.response.status === 401) {
        console.log('🔐 Invalid credentials - check username/password');
      }
    }
  }
}

simpleAuthTest().catch(console.error);
