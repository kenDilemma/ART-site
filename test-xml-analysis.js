const NextcloudCalendar = require('./nextcloud-calendar.js');
const axios = require('axios');

console.log('='.repeat(50));
console.log('ANALYZING XML RESPONSE STRUCTURE');
console.log('='.repeat(50));

const config = {
  baseUrl: 'http://r7bml6jyfycorb7ir4yub7pvitrgj4a3we2pcuqbnrq364jsfddjnryd.onion',
  username: 'ken',
  password: 'Mu99$y202323',
  calendarName: 'MEETING'
};

async function analyzeXMLResponse() {
  console.log('Creating calendar instance...');
  const calendar = new NextcloudCalendar(config);
  
  const testUrl = 'https://r7bml6jyfycorb7ir4yub7pvitrgj4a3we2pcuqbnrq364jsfddjnryd.onion/remote.php/dav';
  
  try {
    console.log(`\nQuerying: ${testUrl}`);
    
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
    console.log('✅ SUCCESS!');
    console.log('Status:', response.status);
    console.log('\n=== FULL XML RESPONSE ===');
    console.log(response.data);
    console.log('\n=== END XML RESPONSE ===');
    
    // Test our current regex
    console.log('\n=== TESTING CURRENT REGEX ===');
    const currentRegex = /<D:current-user-principal>\s*<D:href>([^<]+)<\/D:href>\s*<\/D:current-user-principal>/;
    const currentMatch = response.data.match(currentRegex);
    console.log('Current regex result:', currentMatch);
    
    // Test alternative regex patterns
    console.log('\n=== TESTING ALTERNATIVE REGEX PATTERNS ===');
    
    const patterns = [
      /<d:current-user-principal>\s*<d:href>([^<]+)<\/d:href>\s*<\/d:current-user-principal>/i,
      /<current-user-principal[^>]*>\s*<href[^>]*>([^<]+)<\/href>\s*<\/current-user-principal>/i,
      /<d:current-user-principal[^>]*>\s*<d:href[^>]*>([^<]+)<\/d:href>\s*<\/d:current-user-principal>/i,
      /<[^:]*:current-user-principal[^>]*>\s*<[^:]*:href[^>]*>([^<]+)<\/[^:]*:href>\s*<\/[^:]*:current-user-principal>/i,
      /current-user-principal[^>]*>[\s\S]*?href[^>]*>([^<]+)<\/[^>]*href[\s\S]*?<\/[^>]*current-user-principal/i
    ];
    
    patterns.forEach((pattern, index) => {
      const match = response.data.match(pattern);
      console.log(`Pattern ${index + 1}:`, match ? match[1] : 'No match');
    });
    
    // Look for any href values in the response
    console.log('\n=== ALL HREF VALUES ===');
    const hrefMatches = response.data.match(/<[^>]*href[^>]*>([^<]+)<\/[^>]*href[^>]*>/gi);
    if (hrefMatches) {
      hrefMatches.forEach((href, index) => {
        console.log(`HREF ${index + 1}:`, href);
      });
    }
    
  } catch (error) {
    console.log('❌ Failed:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
    }
  }
}

analyzeXMLResponse().catch(console.error);
