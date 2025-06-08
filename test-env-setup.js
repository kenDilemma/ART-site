// Simple test to verify server can load with environment variables
require('dotenv').config();

console.log('='.repeat(50));
console.log('TESTING SERVER ENVIRONMENT SETUP');
console.log('='.repeat(50));

console.log('Environment variables loaded:');
console.log('- NEXTCLOUD_URL:', process.env.NEXTCLOUD_URL);
console.log('- NEXTCLOUD_USERNAME:', process.env.NEXTCLOUD_USERNAME);
console.log('- NEXTCLOUD_CALENDAR:', process.env.NEXTCLOUD_CALENDAR);
console.log('- PORT:', process.env.PORT);

// Test CalDAV initialization
const NextcloudCalendar = require('./nextcloud-calendar.js');

const calendarConfig = {
  baseUrl: process.env.NEXTCLOUD_URL,
  username: process.env.NEXTCLOUD_USERNAME,
  password: process.env.NEXTCLOUD_PASSWORD,
  calendarName: process.env.NEXTCLOUD_CALENDAR
};

console.log('\n🔧 Testing CalDAV initialization...');
const calendar = new NextcloudCalendar(calendarConfig);

async function quickTest() {
  try {
    console.log('Initializing calendar...');
    await calendar.initializeCalendar();
    console.log('✅ Server environment setup is working correctly!');
    console.log(`📅 Calendar path: ${calendar.calendarPath}`);
  } catch (error) {
    console.error('❌ Server environment test failed:', error.message);
  }
}

quickTest().catch(console.error);
