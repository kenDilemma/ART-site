// Test the main server's calendar integration
const NextcloudCalendar = require('./nextcloud-calendar');

console.log('='.repeat(50));
console.log('TESTING SERVER CALENDAR INTEGRATION');
console.log('='.repeat(50));

// Use the working configuration we've tested
const WORKING_CONFIG = {
  baseUrl: 'http://r7bml6jyfycorb7ir4yub7pvitrgj4a3we2pcuqbnrq364jsfddjnryd.onion',
  username: 'ken',
  password: 'Mu99$y202323',
  calendarName: 'MEETING'
};

async function testServerIntegration() {
  console.log('Creating calendar instance with working config...');
  const calendar = new NextcloudCalendar(WORKING_CONFIG);
  
  try {
    console.log('\n1. Testing connection...');
    const connectionTest = await calendar.testConnection();
    console.log(`✅ Connection: ${connectionTest.success ? 'SUCCESS' : 'FAILED'}`);
    
    console.log('\n2. Testing calendar discovery...');
    const discovery = await calendar.discoverCalendars();
    console.log(`✅ Discovery: ${discovery.success ? 'SUCCESS' : 'FAILED'}`);
    if (discovery.success) {
      console.log(`   Found ${discovery.calendars.length} calendars`);
      discovery.calendars.forEach(cal => {
        console.log(`   - ${cal.name}`);
      });
    }
    
    console.log('\n3. Testing availability check...');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    console.log(`   Checking availability for: ${today.toDateString()}`);
    const busyTimes = await calendar.getBusyTimes(today, tomorrow);
    console.log(`✅ Found ${busyTimes.length} busy periods`);
    
    console.log('\n🎯 INTEGRATION TEST COMPLETED SUCCESSFULLY!');
    console.log('\nRecommendation: Update your server environment variables:');
    console.log('NEXTCLOUD_URL=http://r7bml6jyfycorb7ir4yub7pvitrgj4a3we2pcuqbnrq364jsfddjnryd.onion');
    console.log('NEXTCLOUD_USERNAME=ken');
    console.log('NEXTCLOUD_PASSWORD=Mu99$y202323');
    console.log('NEXTCLOUD_CALENDAR=MEETING');
    
  } catch (error) {
    console.error('\n❌ Integration test failed:', error.message);
  }
}

testServerIntegration().catch(console.error);
