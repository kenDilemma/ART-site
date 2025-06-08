const NextcloudCalendar = require('./nextcloud-calendar.js');
require('dotenv').config();

async function debugVacationCalendar() {
  console.log('=== DEBUGGING VACATION CALENDAR ISSUE ===');
  console.log('Date: Thursday, June 26, 2025');
  console.log('Expected: Should be blocked due to vacation');
  console.log('Actual: Shows as available\n');

  const config = {
    baseUrl: process.env.NEXTCLOUD_URL,
    username: process.env.NEXTCLOUD_USERNAME,
    password: process.env.NEXTCLOUD_PASSWORD,
    calendarName: process.env.NEXTCLOUD_CALENDAR_NAME || 'Personal'
  };

  const calendarClient = new NextcloudCalendar(config);

  try {
    // Initialize and discover all calendars
    await calendarClient.initializeCalendar();
    
    console.log('📅 Available calendars:');
    calendarClient.allCalendars.forEach((cal, index) => {
      console.log(`  ${index + 1}. ${cal.name} (${cal.path})`);
    });
    console.log('');

    // Find the VACA calendar specifically
    const vacaCalendar = calendarClient.allCalendars.find(cal => 
      cal.name.toLowerCase() === 'vaca'
    );

    if (!vacaCalendar) {
      console.error('❌ VACA calendar not found!');
      console.log('Available calendar names:', calendarClient.allCalendars.map(c => c.name));
      return;
    }

    console.log(`✅ Found VACA calendar: ${vacaCalendar.name} at ${vacaCalendar.path}`);
    
    // Check events around June 26, 2025 with broader date range
    const testDate = new Date('2025-06-26T00:00:00');
    const startDate = new Date('2025-06-20T00:00:00'); // Week before
    const endDate = new Date('2025-07-05T23:59:59');   // Week after
    
    console.log(`\n🔍 Checking VACA calendar from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Query VACA calendar directly
    const reportXML = `<?xml version="1.0" encoding="utf-8" ?>
      <C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
        <D:prop>
          <D:getetag />
          <C:calendar-data />
        </D:prop>
        <C:filter>
          <C:comp-filter name="VCALENDAR">
            <C:comp-filter name="VEVENT">
              <C:time-range start="${startDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}" 
                           end="${endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}" />
            </C:comp-filter>
          </C:comp-filter>
        </C:filter>
      </C:calendar-query>`;

    console.log('\n📡 Sending REPORT request to VACA calendar...');
    
    const { default: axios } = await import('axios');
    const requestConfig = {
      ...calendarClient.axiosConfig,
      method: 'REPORT',
      url: calendarClient.baseUrl + vacaCalendar.path,
      headers: {
        ...calendarClient.axiosConfig.headers,
        'Content-Type': 'application/xml',
        'Depth': '1'
      },
      data: reportXML
    };

    const response = await axios(requestConfig);
    console.log(`✅ VACA calendar response: ${response.status}`);
    
    // Log raw response for analysis
    console.log('\n📄 Raw XML response:');
    console.log(response.data);
    console.log('\n' + '='.repeat(80));

    // Parse events from VACA calendar
    const events = calendarClient.parseCalendarData(response.data);
    console.log(`\n📊 Found ${events.length} events in VACA calendar:`);
    
    if (events.length === 0) {
      console.log('❌ No events found in VACA calendar for the specified date range!');
      console.log('This explains why June 26 shows as available.');
      console.log('\nPossible issues:');
      console.log('1. Vacation events might be stored in a different calendar');
      console.log('2. Date format or timezone issues');
      console.log('3. Events might be outside the query date range');
      console.log('4. Events might be stored with different VEVENT structure');
    } else {
      events.forEach((event, index) => {
        console.log(`  ${index + 1}. ${event.start.toISOString()} - ${event.end.toISOString()}`);
        
        // Check if this event covers June 26
        const june26Start = new Date('2025-06-26T00:00:00');
        const june26End = new Date('2025-06-26T23:59:59');
        
        const coversJune26 = (event.start <= june26End && event.end >= june26Start);
        if (coversJune26) {
          console.log(`    ✅ This event covers June 26!`);
        }
      });
    }

    // Also check what the main getBusyTimes function returns for June 26
    console.log('\n🕒 Testing getBusyTimes for June 26...');
    const june26Start = new Date('2025-06-26T00:00:00');
    const june26End = new Date('2025-06-26T23:59:59');
    
    const busyTimes = await calendarClient.getBusyTimes(june26Start, june26End);
    console.log(`\n📅 getBusyTimes returned ${busyTimes.length} busy periods for June 26:`);
    
    busyTimes.forEach((busy, index) => {
      console.log(`  ${index + 1}. ${busy.start.toISOString()} - ${busy.end.toISOString()} (${busy.calendar})`);
    });

    if (busyTimes.length === 0) {
      console.log('\n❌ getBusyTimes shows June 26 as completely free!');
      console.log('This confirms the issue - vacation events are not being detected.');
    }

  } catch (error) {
    console.error('❌ Error during vacation calendar debug:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the debug
debugVacationCalendar().catch(console.error);
