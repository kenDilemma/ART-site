const NextcloudCalendar = require('./nextcloud-calendar.js');
const axios = require('axios');

console.log('='.repeat(50));
console.log('TESTING CALENDAR-HOME-SET DISCOVERY');
console.log('='.repeat(50));

const config = {
  baseUrl: 'http://r7bml6jyfycorb7ir4yub7pvitrgj4a3we2pcuqbnrq364jsfddjnryd.onion',
  username: 'ken',
  password: 'Mu99$y202323',
  calendarName: 'MEETING'
};

async function testCalendarHomeSet() {
  console.log('Creating calendar instance...');
  const calendar = new NextcloudCalendar(config);
  
  // We know the principal is: /remote.php/dav/principals/users/ken/
  const principalPath = '/remote.php/dav/principals/users/ken/';
  const fullUrl = 'https://r7bml6jyfycorb7ir4yub7pvitrgj4a3we2pcuqbnrq364jsfddjnryd.onion' + principalPath;
  
  console.log(`Testing calendar-home-set discovery at: ${fullUrl}`);
  
  try {
    const propfindXML = `<?xml version="1.0" encoding="utf-8" ?>
      <D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
        <D:prop>
          <C:calendar-home-set />
        </D:prop>
      </D:propfind>`;

    const requestConfig = {
      ...calendar.axiosConfig,
      method: 'PROPFIND',
      url: fullUrl,
      headers: {
        ...calendar.axiosConfig.headers,
        'Content-Type': 'application/xml',
        'Depth': '0'
      },
      auth: {
        username: config.username,
        password: config.password
      },
      data: propfindXML
    };

    const response = await axios(requestConfig);
    console.log('✅ SUCCESS!');
    console.log('Status:', response.status);
    console.log('\n=== FULL XML RESPONSE ===');
    console.log(response.data);
    console.log('\n=== END XML RESPONSE ===');
    
    // Test our regex patterns
    console.log('\n=== TESTING REGEX PATTERNS ===');
    
    const patterns = [
      /<[cC]:calendar-home-set>\s*<[dD]:href>([^<]+)<\/[dD]:href>\s*<\/[cC]:calendar-home-set>/,
      /<calendar-home-set[^>]*>\s*<href[^>]*>([^<]+)<\/href>\s*<\/calendar-home-set>/i,
      /<[^:]*:calendar-home-set[^>]*>\s*<[^:]*:href[^>]*>([^<]+)<\/[^:]*:href>\s*<\/[^:]*:calendar-home-set>/i
    ];
    
    patterns.forEach((pattern, index) => {
      const match = response.data.match(pattern);
      console.log(`Pattern ${index + 1}:`, match ? match[1] : 'No match');
    });
    
  } catch (error) {
    console.log('❌ Failed:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

testCalendarHomeSet().catch(console.error);
