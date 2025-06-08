const NextcloudCalendar = require('./nextcloud-calendar.js');
require('dotenv').config();

console.log('='.repeat(60));
console.log('TESTING MULTI-CALENDAR AVAILABILITY CHECKING');
console.log('='.repeat(60));

async function testMultiCalendarAvailability() {
  const config = {
    baseUrl: process.env.NEXTCLOUD_URL,
    username: process.env.NEXTCLOUD_USERNAME,
    password: process.env.NEXTCLOUD_PASSWORD,
    calendarName: process.env.NEXTCLOUD_CALENDAR
  };

  console.log('\n1. Creating calendar instance and initializing...');
  const calendar = new NextcloudCalendar(config);
  
  try {
    await calendar.initializeCalendar();
    console.log('✅ Calendar initialization successful');
    
    // Show which calendars were discovered
    console.log('\n2. Discovered calendars:');
    calendar.allCalendars.forEach((cal, index) => {
      console.log(`   ${index + 1}. ${cal.name} - ${cal.path}`);
    });
    
    console.log('\n3. Testing availability check for tomorrow...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);
    
    console.log(`Checking availability for: ${tomorrow.toISOString().split('T')[0]}`);
    
    const busyTimes = await calendar.getBusyTimes(tomorrow, endOfTomorrow);
    
    console.log('\n4. Availability Results:');
    console.log(`Total events found across all calendars: ${busyTimes.length}`);
    
    if (busyTimes.length > 0) {
      console.log('\nBusy times breakdown by calendar:');
      const byCalendar = {};
      busyTimes.forEach(bt => {
        if (!byCalendar[bt.calendar]) byCalendar[bt.calendar] = [];
        byCalendar[bt.calendar].push(bt);
      });
      
      Object.keys(byCalendar).forEach(calName => {
        console.log(`\n   ${calName} (${byCalendar[calName].length} events):`);
        byCalendar[calName].forEach((bt, index) => {
          const startTime = bt.start.toTimeString().substring(0, 5);
          const endTime = bt.end.toTimeString().substring(0, 5);
          console.log(`     ${index + 1}. ${startTime} - ${endTime}`);
        });
      });
    } else {
      console.log('✅ No conflicts found - completely available!');
    }
    
    console.log('\n5. Testing specific time slot conflict detection...');
    
    // Test a 9:00 AM slot
    const nineAM = new Date(tomorrow);
    nineAM.setHours(9, 0, 0, 0);
    const nineAmEnd = new Date(nineAM);
    nineAmEnd.setMinutes(15);
    
    const isNineAmBusy = calendar.isTimeSlotBusy(nineAM, nineAmEnd, busyTimes);
    console.log(`9:00-9:15 AM slot available: ${!isNineAmBusy ? '✅ YES' : '❌ NO (busy)'}`);
    
    // Test a 2:00 PM slot
    const twoPM = new Date(tomorrow);
    twoPM.setHours(14, 0, 0, 0);
    const twoPmEnd = new Date(twoPM);
    twoPmEnd.setMinutes(15);
    
    const isTwoPmBusy = calendar.isTimeSlotBusy(twoPM, twoPmEnd, busyTimes);
    console.log(`2:00-2:15 PM slot available: ${!isTwoPmBusy ? '✅ YES' : '❌ NO (busy)'}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testMultiCalendarAvailability().catch(console.error);
