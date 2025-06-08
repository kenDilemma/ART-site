// Test just the CalDAV discovery process
const NextcloudCalendar = require('./nextcloud-calendar');
require('dotenv').config();

async function testDiscoveryOnly() {
  console.log('='.repeat(60));
  console.log('TESTING CALDAV DISCOVERY ONLY');
  console.log('='.repeat(60));
  
  const config = {
    baseUrl: 'http://r7bml6jyfycorb7ir4yub7pvitrgj4a3we2pcuqbnrq364jsfddjnryd.onion',
    username: 'ken',
    password: 'Mu99$y202323',
    calendarName: 'MEETING'
  };
  
  console.log('Creating NextcloudCalendar instance...');
  const calendar = new NextcloudCalendar(config);
    try {
    console.log('\nStarting discovery process...');
    console.log('Config:', {
      baseUrl: config.baseUrl,
      username: config.username,
      calendarName: config.calendarName
    });
    
    await calendar.initializeCalendar();
    console.log('\n✅ SUCCESS! Calendar discovery completed!');
  } catch (error) {
    console.log('\n❌ Discovery failed:', error.message);
    console.error('Full error:', error);
  }
}

testDiscoveryOnly().catch(console.error);
