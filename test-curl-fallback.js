// Test using system curl as a fallback for SOCKS proxy issues
const { exec } = require('child_process');
const util = require('util');
require('dotenv').config();

const execAsync = util.promisify(exec);

async function testCurlFallback() {
  console.log('Testing curl fallback for CalDAV access...');
  
  try {
    const curlCommand = `curl.exe --socks5-hostname 127.0.0.1:9050 -u "${process.env.NEXTCLOUD_USERNAME}:${process.env.NEXTCLOUD_PASSWORD}" "${process.env.NEXTCLOUD_URL}/remote.php/dav" -X PROPFIND -H "Content-Type: application/xml" -H "Depth: 0" -d "<?xml version=\\"1.0\\" encoding=\\"utf-8\\" ?><D:propfind xmlns:D=\\"DAV:\\"><D:prop><D:displayname /><D:resourcetype /></D:prop></D:propfind>"`;
    
    console.log('Executing curl command...');
    const { stdout, stderr } = await execAsync(curlCommand);
    
    console.log('✓ Curl command successful!');
    console.log('Response length:', stdout.length);
    
    if (stdout.includes('HTTP/1.1 2')) {
      console.log('✓ Got successful HTTP response');
    }
    
    if (stdout.includes('DAV:')) {
      console.log('✓ Response contains DAV XML');
    }
    
    return { success: true, data: stdout };
    
  } catch (error) {
    console.error('✗ Curl fallback failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function testCalDAVDiscovery() {
  console.log('\nTesting CalDAV calendar discovery with curl...');
  
  try {
    const curlCommand = `curl.exe --socks5-hostname 127.0.0.1:9050 -u "${process.env.NEXTCLOUD_USERNAME}:${process.env.NEXTCLOUD_PASSWORD}" "${process.env.NEXTCLOUD_URL}/remote.php/dav/calendars/${process.env.NEXTCLOUD_USERNAME}/" -X PROPFIND -H "Content-Type: application/xml" -H "Depth: 1" -d "<?xml version=\\"1.0\\" encoding=\\"utf-8\\" ?><D:propfind xmlns:D=\\"DAV:\\" xmlns:C=\\"urn:ietf:params:xml:ns:caldav\\"><D:prop><D:displayname /><D:resourcetype /><C:supported-calendar-component-set /></D:prop></D:propfind>"`;
    
    console.log('Testing calendar discovery...');
    const { stdout, stderr } = await execAsync(curlCommand);
    
    console.log('✓ Calendar discovery command successful!');
    console.log('Response length:', stdout.length);
    
    // Look for calendar names in the response
    const displayNameMatches = stdout.match(/<D:displayname>([^<]+)<\/D:displayname>/g);
    if (displayNameMatches) {
      console.log('Found calendars:');
      displayNameMatches.forEach(match => {
        const name = match.replace(/<\/?D:displayname>/g, '');
        console.log(`  - ${name}`);
      });
    }
    
    return { success: true, data: stdout };
    
  } catch (error) {
    console.error('✗ Calendar discovery failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('CURL FALLBACK TEST FOR CALDAV');
  console.log('='.repeat(60));
  
  const basicTest = await testCurlFallback();
  
  if (basicTest.success) {
    await testCalDAVDiscovery();
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('If curl works, we can implement a curl-based fallback');
  console.log('for CalDAV operations when SOCKS proxy fails in Node.js');
  console.log('='.repeat(60));
}

runTests().catch(console.error);
