const NextcloudCalendar = require('./nextcloud-calendar.js');
const axios = require('axios');

console.log('='.repeat(50));
console.log('TESTING DIRECT CALENDAR ENUMERATION');
console.log('='.repeat(50));

const config = {
  baseUrl: 'http://r7bml6jyfycorb7ir4yub7pvitrgj4a3we2pcuqbnrq364jsfddjnryd.onion',
  username: 'ken',
  password: 'Mu99$y202323',
  calendarName: 'MEETING'
};

async function testDirectCalendarEnum() {
  console.log('Creating calendar instance...');
  const calendar = new NextcloudCalendar(config);
  
  // Try the standard Nextcloud calendar home path
  const calendarHomePath = '/remote.php/dav/calendars/ken/';
  const fullUrl = 'https://r7bml6jyfycorb7ir4yub7pvitrgj4a3we2pcuqbnrq364jsfddjnryd.onion' + calendarHomePath;
  
  console.log(`Testing direct calendar enumeration at: ${fullUrl}`);
  
  try {
    const propfindXML = `<?xml version="1.0" encoding="utf-8" ?>
      <D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav" xmlns:CS="http://calendarserver.org/ns/">
        <D:prop>
          <D:resourcetype />
          <D:displayname />
          <CS:getctag />
          <C:supported-calendar-component-set />
        </D:prop>
      </D:propfind>`;

    const requestConfig = {
      ...calendar.axiosConfig,
      method: 'PROPFIND',
      url: fullUrl,
      headers: {
        ...calendar.axiosConfig.headers,
        'Content-Type': 'application/xml',
        'Depth': '1'
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
    console.log('\n=== CALENDAR ENUMERATION RESPONSE ===');
    console.log(response.data);
    console.log('\n=== END RESPONSE ===');
    
    // Parse calendars using our method
    console.log('\n=== PARSING CALENDARS ===');
    const calendars = calendar.parseCalendarList(response.data);
    console.log('Found calendars:', calendars);
    
  } catch (error) {
    console.log('❌ Failed:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response data preview:', error.response.data?.substring(0, 500));
    }
  }
}

testDirectCalendarEnum().catch(console.error);
