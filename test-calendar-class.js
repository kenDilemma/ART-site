// Test the updated NextcloudCalendar class with socks5h proxy
const NextcloudCalendar = require('./nextcloud-calendar');
require('dotenv').config();

async function testUpdatedCalendarClass() {
  console.log('='.repeat(60));
  console.log('TESTING UPDATED NEXTCLOUD CALENDAR CLASS');
  console.log('='.repeat(60));
  
  const config = {
    baseUrl: process.env.NEXTCLOUD_URL,
    username: process.env.NEXTCLOUD_USERNAME,
    password: process.env.NEXTCLOUD_PASSWORD,
    calendarName: process.env.NEXTCLOUD_CALENDAR
  };
  
  console.log('Creating NextcloudCalendar instance...');
  const calendar = new NextcloudCalendar(config);
  
  console.log('\nTesting connection...');
  const connectionResult = await calendar.testConnection();
  
  console.log('\n' + '='.repeat(60));
  console.log('RESULTS:');
  console.log('='.repeat(60));
  
  if (connectionResult.success) {
    console.log('✅ SUCCESS! The socks5h:// proxy configuration works!');
    console.log(`- Basic connection: ${connectionResult.basicConnection}`);
    console.log(`- Calendar access: ${connectionResult.calendarAccess}`);
    console.log(`- Calendar discovery: ${connectionResult.calendarDiscovery}`);
  } else {
    console.log('❌ Connection failed:', connectionResult.error);
  }
}

testUpdatedCalendarClass().catch(console.error);
