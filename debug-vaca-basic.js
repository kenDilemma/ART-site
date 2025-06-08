console.log('Starting vacation calendar debug...');

async function main() {
  try {
    console.log('Step 1: Loading modules...');
    const NextcloudCalendar = require('./nextcloud-calendar.js');
    require('dotenv').config();
    
    console.log('Step 2: Creating config...');
    const config = {
      baseUrl: process.env.NEXTCLOUD_URL,
      username: process.env.NEXTCLOUD_USERNAME,
      password: process.env.NEXTCLOUD_PASSWORD,
      calendarName: process.env.NEXTCLOUD_CALENDAR
    };
    
    console.log('Step 3: Creating calendar instance...');
    const calendar = new NextcloudCalendar(config);
    
    console.log('Step 4: Initializing calendar...');
    await calendar.initializeCalendar();
    
    console.log('Step 5: Calendar initialized, checking for VACA calendar...');
    const vacaCalendar = calendar.allCalendars.find(cal => 
      cal.name.toLowerCase() === 'vaca'
    );
    
    if (vacaCalendar) {
      console.log('✅ Found VACA calendar:', vacaCalendar.name);
      
      console.log('Step 6: Testing June 26, 2025 availability...');
      const june26Start = new Date('2025-06-26T00:00:00');
      const june26End = new Date('2025-06-26T23:59:59');
      
      const busyTimes = await calendar.getBusyTimes(june26Start, june26End);
      console.log(`Found ${busyTimes.length} busy periods for June 26, 2025`);
      
      if (busyTimes.length === 0) {
        console.log('❌ ISSUE: No events found - vacation not blocking!');
        
        // Let's check if there are events in VACA calendar at all
        console.log('Step 7: Checking VACA calendar for any events in June 2025...');
        const juneStart = new Date('2025-06-01T00:00:00');
        const juneEnd = new Date('2025-06-30T23:59:59');
        
        const juneBusyTimes = await calendar.getBusyTimes(juneStart, juneEnd);
        console.log(`Found ${juneBusyTimes.length} events in June 2025 across all calendars`);
        
        const vacaEvents = juneBusyTimes.filter(bt => bt.calendar === 'VACA');
        console.log(`Found ${vacaEvents.length} events in VACA calendar for June 2025`);
        
        if (vacaEvents.length > 0) {
          console.log('VACA events in June:');
          vacaEvents.forEach(event => {
            console.log(`  - ${event.start.toISOString()} to ${event.end.toISOString()}`);
          });
        }
        
      } else {
        console.log('✅ Found busy times that should block availability');
        busyTimes.forEach(busy => {
          console.log(`  - ${busy.calendar}: ${busy.start.toISOString()} to ${busy.end.toISOString()}`);
        });
      }
      
    } else {
      console.log('❌ VACA calendar not found!');
      console.log('Available calendars:');
      calendar.allCalendars.forEach(cal => {
        console.log(`  - ${cal.name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error in vacation debug:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

console.log('Calling main function...');
main().then(() => {
  console.log('Vacation debug completed.');
}).catch(error => {
  console.error('Unhandled error:', error);
});
