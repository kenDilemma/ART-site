const NextcloudCalendar = require('./nextcloud-calendar.js');

console.log('='.repeat(60));
console.log('COMPREHENSIVE CALDAV CLIENT TEST');
console.log('='.repeat(60));

const config = {
  baseUrl: 'http://r7bml6jyfycorb7ir4yub7pvitrgj4a3we2pcuqbnrq364jsfddjnryd.onion',
  username: 'ken',
  password: 'Mu99$y202323',
  calendarName: 'MEETING'
};

async function testCompleteFunctionality() {
  console.log('Creating NextcloudCalendar instance...');
  const calendar = new NextcloudCalendar(config);
  
  try {
    console.log('\n📊 STEP 1: Testing Connection...');
    const connectionTest = await calendar.testConnection();
    console.log('Connection test result:', connectionTest);
    
    console.log('\n📅 STEP 2: Initializing Calendar...');
    await calendar.initializeCalendar();
    console.log('✅ Calendar initialization completed!');
    
    console.log('\n🔍 STEP 3: Testing Calendar Discovery...');
    const discoveryResult = await calendar.discoverCalendars();
    console.log('Discovery result:', discoveryResult);
    
    console.log('\n📋 STEP 4: Fetching Calendar Events...');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    console.log(`Fetching events between ${today.toDateString()} and ${tomorrow.toDateString()}`);
    const busyTimes = await calendar.getBusyTimes(today, tomorrow);
    console.log('📊 Busy times found:', busyTimes);
    
    console.log('\n🎯 STEP 5: Testing Time Slot Checking...');
    // Test a specific time slot
    const testSlotStart = new Date(today);
    testSlotStart.setHours(10, 0, 0, 0);
    const testSlotEnd = new Date(today);
    testSlotEnd.setHours(11, 0, 0, 0);
    
    const isSlotBusy = calendar.isTimeSlotBusy(testSlotStart, testSlotEnd, busyTimes);
    console.log(`Time slot ${testSlotStart.toLocaleTimeString()} - ${testSlotEnd.toLocaleTimeString()} is ${isSlotBusy ? 'BUSY' : 'FREE'}`);
    
    console.log('\n✅ ALL TESTS COMPLETED SUCCESSFULLY! 🎉');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    if (error.response) {
      console.error('HTTP Status:', error.response.status);
      console.error('Response preview:', error.response.data?.substring(0, 200));
    }
  }
}

testCompleteFunctionality().catch(console.error);
