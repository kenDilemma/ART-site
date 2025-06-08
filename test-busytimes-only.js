const NextcloudCalendar = require('./nextcloud-calendar.js');

console.log('='.repeat(50));
console.log('TESTING GETBUSYTIMES FUNCTION');
console.log('='.repeat(50));

const config = {
  baseUrl: 'http://r7bml6jyfycorb7ir4yub7pvitrgj4a3we2pcuqbnrq364jsfddjnryd.onion',
  username: 'ken',
  password: 'Mu99$y202323',
  calendarName: 'MEETING'
};

async function testBusyTimes() {
  console.log('Creating calendar instance...');
  const calendar = new NextcloudCalendar(config);
  
  try {
    console.log('Initializing calendar...');
    await calendar.initializeCalendar();
    console.log(`✅ Calendar path: ${calendar.calendarPath}`);
    
    console.log('\nTesting getBusyTimes...');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    console.log(`Fetching events for: ${today.toDateString()}`);
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout after 30 seconds')), 30000)
    );
    
    const busyTimesPromise = calendar.getBusyTimes(today, tomorrow);
    
    const busyTimes = await Promise.race([busyTimesPromise, timeoutPromise]);
    
    console.log(`✅ Success! Found ${busyTimes.length} busy time(s)`);
    busyTimes.forEach((time, index) => {
      console.log(`  ${index + 1}. ${time.start} - ${time.end}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) console.error('Error code:', error.code);
    if (error.response?.status) console.error('HTTP status:', error.response.status);
  }
}

testBusyTimes().catch(console.error);
