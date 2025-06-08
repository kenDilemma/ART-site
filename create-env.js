// Create .env file with working configuration
const fs = require('fs');

const envContent = `# Nextcloud CalDAV Configuration
NEXTCLOUD_URL=http://r7bml6jyfycorb7ir4yub7pvitrgj4a3we2pcuqbnrq364jsfddjnryd.onion
NEXTCLOUD_USERNAME=ken
NEXTCLOUD_PASSWORD=Mu99$y202323
NEXTCLOUD_CALENDAR=MEETING

# Email Configuration (update with your email settings)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Server Configuration
PORT=3000
`;

try {
  fs.writeFileSync('.env', envContent);
  console.log('✅ Created .env file with working CalDAV configuration!');
  console.log('\nConfiguration details:');
  console.log('- Nextcloud URL: .onion address (Tor proxy required)');
  console.log('- Username: ken');
  console.log('- Calendar: MEETING');
  console.log('- Password: [configured]');
  console.log('\nNext steps:');
  console.log('1. Update EMAIL_USER and EMAIL_PASSWORD in .env');
  console.log('2. Ensure Tor is running on localhost:9050');
  console.log('3. Start the server with: node server.js');
} catch (error) {
  console.error('❌ Failed to create .env file:', error.message);
}
