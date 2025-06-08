const NextcloudCalendar = require('./nextcloud-calendar.js');
require('dotenv').config();

async function debugTimeSlotCheck() {
  console.log('=== DEBUGGING TIME SLOT BUSY CHECK ===');
  
  const config = {
    baseUrl: process.env.NEXTCLOUD_URL,
    username: process.env.NEXTCLOUD_USERNAME,
    password: process.env.NEXTCLOUD_PASSWORD,
    calendarName: process.env.NEXTCLOUD_CALENDAR
  };

  const calendar = new NextcloudCalendar(config);
  
  try {
    await calendar.initializeCalendar();
    
    // Get the vacation busy time for June 26
    const june26Start = new Date('2025-06-26T00:00:00');
    const june26End = new Date('2025-06-26T23:59:59');
    
    console.log('Step 1: Getting busy times for June 26...');
    const busyTimes = await calendar.getBusyTimes(june26Start, june26End);
    console.log(`Found ${busyTimes.length} busy periods:`);
    
    busyTimes.forEach((busy, index) => {
      console.log(`  ${index + 1}. ${busy.start.toISOString()} - ${busy.end.toISOString()} (${busy.calendar})`);
      console.log(`      start type: ${typeof busy.start}, end type: ${typeof busy.end}`);
      console.log(`      start instanceof Date: ${busy.start instanceof Date}`);
      console.log(`      end instanceof Date: ${busy.end instanceof Date}`);
    });
    
    if (busyTimes.length > 0) {
      const vacationBusy = busyTimes[0]; // Should be the VACA event
      
      console.log('\nStep 2: Testing time slot conflicts...');
      
      // Test a 9:00 AM slot (should be blocked by vacation)
      const slotStart = new Date('2025-06-26T13:00:00.000Z'); // 9:00 AM in EST
      const slotEnd = new Date('2025-06-26T13:15:00.000Z');   // 9:15 AM in EST
      
      console.log(`\nTesting slot: ${slotStart.toISOString()} - ${slotEnd.toISOString()}`);
      console.log(`Vacation period: ${vacationBusy.start.toISOString()} - ${vacationBusy.end.toISOString()}`);
      
      // Manual check - should the slot be blocked?
      const shouldBeBlocked = (
        slotStart >= vacationBusy.start && slotStart < vacationBusy.end
      ) || (
        slotEnd > vacationBusy.start && slotEnd <= vacationBusy.end
      ) || (
        slotStart <= vacationBusy.start && slotEnd >= vacationBusy.end
      );
      
      console.log(`\nManual logic check: slot should be blocked = ${shouldBeBlocked}`);
      
      // Test the actual isTimeSlotBusy function
      console.log('\nStep 3: Testing isTimeSlotBusy function...');
      try {
        const isSlotBusy = calendar.isTimeSlotBusy(slotStart, slotEnd, busyTimes);
        console.log(`isTimeSlotBusy result: ${isSlotBusy}`);
        
        if (shouldBeBlocked && !isSlotBusy) {
          console.log('❌ PROBLEM: Slot should be blocked but isTimeSlotBusy returns false!');
        } else if (!shouldBeBlocked && isSlotBusy) {
          console.log('❌ PROBLEM: Slot should NOT be blocked but isTimeSlotBusy returns true!');
        } else {
          console.log('✅ isTimeSlotBusy working correctly');
        }
        
      } catch (error) {
        console.log('❌ ERROR in isTimeSlotBusy:', error.message);
        console.log('This explains why the filtering is not working!');
      }
      
      // Test different time slots
      console.log('\nStep 4: Testing multiple time slots...');
      const testSlots = [
        { time: '09:00', datetime: '2025-06-26T13:00:00.000Z' },
        { time: '12:00', datetime: '2025-06-26T16:00:00.000Z' },
        { time: '15:00', datetime: '2025-06-26T19:00:00.000Z' }
      ];
      
      testSlots.forEach(slot => {
        const testSlotStart = new Date(slot.datetime);
        const testSlotEnd = new Date(testSlotStart.getTime() + 15 * 60 * 1000); // +15 minutes
        
        try {
          const isBusy = calendar.isTimeSlotBusy(testSlotStart, testSlotEnd, busyTimes);
          console.log(`  ${slot.time}: ${isBusy ? 'BUSY' : 'FREE'} (should be BUSY)`);
        } catch (error) {
          console.log(`  ${slot.time}: ERROR - ${error.message}`);
        }
      });
    }
    
  } catch (error) {
    console.error('Debug failed:', error.message);
  }
}

debugTimeSlotCheck().catch(console.error);
