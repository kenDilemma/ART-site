const NextcloudCalendar = require('./nextcloud-calendar.js');
require('dotenv').config();

async function testVacationSimple() {
  console.log('=== TESTING VACATION CALENDAR ===');
  
  const config = {
    baseUrl: process.env.NEXTCLOUD_URL,
    username: process.env.NEXTCLOUD_USERNAME,
    password: process.env.NEXTCLOUD_PASSWORD,
    calendarName: process.env.NEXTCLOUD_CALENDAR
  };

  console.log('Configuration loaded:', {
    baseUrl: config.baseUrl ? 'SET' : 'NOT SET',
    username: config.username ? 'SET' : 'NOT SET',
    password: config.password ? 'SET' : 'NOT SET'
  });

  const calendar = new NextcloudCalendar(config);
  
  try {
    console.log('Initializing calendar...');
    await calendar.initializeCalendar();
    console.log('Calendar initialized successfully');
    
    console.log('\nAll discovered calendars:');
    calendar.allCalendars.forEach((cal, index) => {
      console.log(`  ${index + 1}. ${cal.name} - ${cal.path}`);
    });
    
    // Find VACA calendar
    const vacaCalendar = calendar.allCalendars.find(cal => 
      cal.name.toLowerCase() === 'vaca'
    );
    
    if (vacaCalendar) {
      console.log(`\nFound VACA calendar: ${vacaCalendar.name}`);
      
      // Test June 26, 2025
      const june26Start = new Date('2025-06-26T00:00:00');
      const june26End = new Date('2025-06-26T23:59:59');
      
      console.log(`\nChecking availability for June 26, 2025...`);
      const busyTimes = await calendar.getBusyTimes(june26Start, june26End);
      
      console.log(`Found ${busyTimes.length} busy periods:`);
      busyTimes.forEach(busy => {
        console.log(`  - ${busy.calendar}: ${busy.start.toISOString()} to ${busy.end.toISOString()}`);
      });
      
      if (busyTimes.length === 0) {
        console.log('\n❌ PROBLEM: No busy times found for June 26 - vacation not blocking availability!');
      } else {
        console.log('\n✅ GOOD: Found busy times that should block availability');
      }
      
    } else {
      console.log('\n❌ VACA calendar not found!');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testVacationSimple().catch(console.error);
