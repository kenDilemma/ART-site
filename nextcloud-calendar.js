const axios = require('axios');
const { parseISO, format, isWithinInterval } = require('date-fns');
const { SocksProxyAgent } = require('socks-proxy-agent');

class NextcloudCalendar {  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.username = config.username;
    this.password = config.password;
    this.calendarName = config.calendarName;
    this.basePath = `/remote.php/dav`;
    this.calendarsPath = `/remote.php/dav/calendars/${this.username}/`;
    this.calendarPath = null; // Will be set after calendar discovery
      // Configure proxy for .onion addresses
    this.axiosConfig = {
      auth: {
        username: this.username,
        password: this.password
      },
      timeout: 30000, // 30 second timeout for Tor
      headers: {
        'Content-Type': 'application/xml',
        'User-Agent': 'RhinoTraining/1.0'
      },
      // Add family: 0 to disable IPv6 preference
      family: 0,
      // Add lookup: false to disable DNS resolution
      lookup: false
    };// Check if we're using a .onion address and configure proxy
    if (this.baseUrl.includes('.onion')) {
      const torProxyHost = process.env.TOR_PROXY_HOST || '127.0.0.1';
      const torProxyPort = process.env.TOR_PROXY_PORT || '9050';
      
      // Try multiple proxy configurations for better compatibility
      try {
        // First, try with socks5h protocol for hostname resolution through proxy
        const proxyAgent = new SocksProxyAgent(`socks5h://${torProxyHost}:${torProxyPort}`);
        this.axiosConfig.httpsAgent = proxyAgent;
        this.axiosConfig.httpAgent = proxyAgent;
        this.axiosConfig.proxy = false;
        
        console.log(`Configured Tor proxy: socks5h://${torProxyHost}:${torProxyPort} for .onion address`);
      } catch (error) {
        console.warn('Failed to configure socks5h proxy, trying alternative...', error.message);
        
        // Fallback to object-based configuration
        const proxyAgent = new SocksProxyAgent({
          hostname: torProxyHost,
          port: parseInt(torProxyPort),
          protocol: 'socks5:',
          lookup: false // Disable local DNS lookup
        });
        this.axiosConfig.httpsAgent = proxyAgent;
        this.axiosConfig.httpAgent = proxyAgent;
        this.axiosConfig.proxy = false;
        
        console.log(`Configured Tor proxy with object config for .onion address`);      }
    }
  }

  async initializeCalendar() {
    if (this.calendarPath) {
      return; // Already initialized
    }

    try {
      console.log(`Discovering calendars for user: ${this.username}`);
      
      const propfindXML = `<?xml version="1.0" encoding="utf-8" ?>
        <D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
          <D:prop>
            <D:displayname />
            <D:resourcetype />
            <C:supported-calendar-component-set />
          </D:prop>
        </D:propfind>`;

      const requestConfig = {
        ...this.axiosConfig,
        method: 'PROPFIND',
        url: this.baseUrl + this.calendarsPath,
        headers: {
          ...this.axiosConfig.headers,
          'Content-Type': 'application/xml',
          'Depth': '1'
        },
        data: propfindXML
      };

      const response = await axios(requestConfig);
      
      // Parse the response to find available calendars
      const availableCalendars = this.parseCalendarList(response.data);
      console.log('Available calendars:', availableCalendars);
      
      // Find the requested calendar or use the first available one
      let targetCalendar = availableCalendars.find(cal => 
        cal.name.toLowerCase() === this.calendarName.toLowerCase()
      );
      
      if (!targetCalendar && availableCalendars.length > 0) {
        targetCalendar = availableCalendars[0];
        console.log(`Calendar "${this.calendarName}" not found, using "${targetCalendar.name}"`);
      }
      
      if (targetCalendar) {
        this.calendarPath = targetCalendar.path;
        console.log(`Using calendar path: ${this.calendarPath}`);
      } else {
        throw new Error('No calendars found');
      }
      
    } catch (error) {
      console.error('Failed to initialize calendar:', error.message);
      // Fallback to the original path construction
      this.calendarPath = `/remote.php/dav/calendars/${this.username}/${this.calendarName}/`;
      console.log(`Using fallback calendar path: ${this.calendarPath}`);
    }
  }

  parseCalendarList(xmlData) {
    const calendars = [];
    try {
      // Simple regex parsing - in production, use a proper XML parser
      const resourceMatches = xmlData.match(/<D:response>([\s\S]*?)<\/D:response>/g);
      
      if (resourceMatches) {
        resourceMatches.forEach(resource => {
          const hrefMatch = resource.match(/<D:href>([^<]+)<\/D:href>/);
          const displayNameMatch = resource.match(/<D:displayname>([^<]*)<\/D:displayname>/);
          const resourceTypeMatch = resource.match(/<C:calendar\s*\/>/);
          
          if (hrefMatch && resourceTypeMatch) {
            const path = hrefMatch[1];
            const name = displayNameMatch ? displayNameMatch[1] : path.split('/').filter(p => p).pop();
            
            // Only include actual calendar resources, not the parent directory
            if (path.endsWith('/') && path !== this.calendarsPath) {
              calendars.push({
                name: name || 'Unnamed Calendar',
                path: path
              });
            }
          }
        });
      }
    } catch (error) {
      console.error('Error parsing calendar list:', error);
    }
    
    return calendars;
  }
  async getBusyTimes(startDate, endDate) {
    try {
      // Initialize calendar path if not already done
      await this.initializeCalendar();
      
      console.log(`Fetching calendar data from: ${this.baseUrl}${this.calendarPath}`);
      console.log(`Date range: ${format(startDate, "yyyy-MM-dd")} to ${format(endDate, "yyyy-MM-dd")}`);
      
      // CalDAV REPORT request to get calendar events
      const reportXML = `<?xml version="1.0" encoding="utf-8" ?>
        <C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
          <D:prop>
            <D:getetag />
            <C:calendar-data />
          </D:prop>
          <C:filter>
            <C:comp-filter name="VCALENDAR">
              <C:comp-filter name="VEVENT">
                <C:time-range start="${format(startDate, "yyyyMMdd'T'HHmmss'Z'")}" 
                             end="${format(endDate, "yyyyMMdd'T'HHmmss'Z'")}" />
              </C:comp-filter>
            </C:comp-filter>
          </C:filter>
        </C:calendar-query>`;

      const requestConfig = {
        ...this.axiosConfig,
        method: 'REPORT',
        url: this.baseUrl + this.calendarPath,
        headers: {
          ...this.axiosConfig.headers,
          'Content-Type': 'application/xml',
          'Depth': '1'
        },
        data: reportXML
      };

      console.log('Making CalDAV request...');
      const response = await axios(requestConfig);
      console.log('CalDAV response received, status:', response.status);

      return this.parseCalendarData(response.data);
    } catch (error) {
      console.error('Error fetching calendar data:');
      console.error('- Error message:', error.message);
      console.error('- Error code:', error.code);
      if (error.response) {
        console.error('- Response status:', error.response.status);
        console.error('- Response data:', error.response.data);
      }
      
      // Return empty array if calendar access fails - you may want to handle this differently
      return [];
    }
  }

  parseCalendarData(xmlData) {
    const busyTimes = [];
    
    try {
      // Simple regex parsing - in production, use a proper XML parser
      const eventRegex = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/g;
      let match;
      
      while ((match = eventRegex.exec(xmlData)) !== null) {
        const eventData = match[1];
        
        // Extract DTSTART and DTEND
        const dtStartMatch = eventData.match(/DTSTART[^:]*:([^\r\n]+)/);
        const dtEndMatch = eventData.match(/DTEND[^:]*:([^\r\n]+)/);
        
        if (dtStartMatch && dtEndMatch) {
          const start = this.parseDateTime(dtStartMatch[1]);
          const end = this.parseDateTime(dtEndMatch[1]);
          
          if (start && end) {
            busyTimes.push({ start, end });
          }
        }
      }
    } catch (error) {
      console.error('Error parsing calendar data:', error);
    }
    
    return busyTimes;
  }

  parseDateTime(dateTimeString) {
    try {
      // Handle different datetime formats
      if (dateTimeString.includes('T')) {
        // Format: 20240608T090000Z or 20240608T090000
        const cleanDate = dateTimeString.replace(/[TZ]/g, '');
        const year = cleanDate.substr(0, 4);
        const month = cleanDate.substr(4, 2);
        const day = cleanDate.substr(6, 2);
        const hour = cleanDate.substr(8, 2) || '00';
        const minute = cleanDate.substr(10, 2) || '00';
        const second = cleanDate.substr(12, 2) || '00';
        
        return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
      } else {
        // Date only format: 20240608
        const year = dateTimeString.substr(0, 4);
        const month = dateTimeString.substr(4, 2);
        const day = dateTimeString.substr(6, 2);
        
        return new Date(`${year}-${month}-${day}`);
      }
    } catch (error) {
      console.error('Error parsing datetime:', dateTimeString, error);
      return null;
    }
  }  isTimeSlotBusy(slotStart, slotEnd, busyTimes) {
    return busyTimes.some(busyTime => {
      return isWithinInterval(slotStart, { start: busyTime.start, end: busyTime.end }) ||
             isWithinInterval(slotEnd, { start: busyTime.start, end: busyTime.end }) ||
             (slotStart <= busyTime.start && slotEnd >= busyTime.end);
    });
  }
  async discoverCalendars() {
    try {
      console.log('Discovering available calendars...');
      
      const propfindXML = `<?xml version="1.0" encoding="utf-8" ?>
        <D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
          <D:prop>
            <D:displayname />
            <D:resourcetype />
            <C:supported-calendar-component-set />
          </D:prop>
        </D:propfind>`;

      const requestConfig = {
        ...this.axiosConfig,
        method: 'PROPFIND',
        url: this.baseUrl + `/remote.php/dav/calendars/${this.username}/`,
        headers: {
          ...this.axiosConfig.headers,
          'Content-Type': 'application/xml',
          'Depth': '1'
        },
        data: propfindXML
      };

      const response = await axios(requestConfig);
      console.log('✓ Calendar discovery successful!');
      console.log('Response data length:', response.data.length);
      return { success: true, calendars: response.data };
    } catch (error) {
      console.error('✗ Calendar discovery failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async testConnection() {
    try {
      console.log('Testing Nextcloud connection...');
      console.log(`URL: ${this.baseUrl}`);
      console.log(`Username: ${this.username}`);
      console.log(`Calendar: ${this.calendarName}`);
      
      // Step 1: Test basic connectivity to the DAV endpoint
      console.log('Step 1: Testing basic DAV connectivity...');
      const basicTestConfig = {
        ...this.axiosConfig,
        method: 'PROPFIND',
        url: this.baseUrl + this.basePath,
        headers: {
          ...this.axiosConfig.headers,
          'Content-Type': 'application/xml',
          'Depth': '0'
        },
        data: `<?xml version="1.0" encoding="utf-8" ?>
          <D:propfind xmlns:D="DAV:">
            <D:prop>
              <D:displayname />
              <D:resourcetype />
            </D:prop>
          </D:propfind>`
      };

      const basicResponse = await axios(basicTestConfig);
      console.log('✓ Basic DAV endpoint accessible!', basicResponse.status);
      
      // Step 2: Discover available calendars
      console.log('Step 2: Discovering calendars...');
      const calendarDiscovery = await this.discoverCalendars();
      
      if (calendarDiscovery.success) {
        console.log('✓ Calendar discovery successful!');
      } else {
        console.warn('⚠ Calendar discovery failed, but basic connection works');
      }
      
      // Step 3: Test specific calendar access
      console.log('Step 3: Testing specific calendar access...');
      const calendarTestConfig = {
        ...this.axiosConfig,
        method: 'PROPFIND',
        url: this.baseUrl + this.calendarPath,
        headers: {
          ...this.axiosConfig.headers,
          'Content-Type': 'application/xml',
          'Depth': '0'
        },
        data: `<?xml version="1.0" encoding="utf-8" ?>
          <D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
            <D:prop>
              <D:displayname />
              <D:resourcetype />
              <C:supported-calendar-component-set />
            </D:prop>
          </D:propfind>`
      };

      const calendarResponse = await axios(calendarTestConfig);
      console.log('✓ Specific calendar accessible!', calendarResponse.status);
      
      return { 
        success: true, 
        basicConnection: basicResponse.status,
        calendarAccess: calendarResponse.status,
        calendarDiscovery: calendarDiscovery.success
      };
    } catch (error) {
      console.error('✗ Nextcloud connection failed:');
      console.error('- Error message:', error.message);
      console.error('- Error code:', error.code);
      if (error.response) {
        console.error('- Response status:', error.response.status);
        console.error('- Response statusText:', error.response.statusText);
        console.error('- Response data preview:', error.response.data?.substring(0, 200));
      }
      return { success: false, error: error.message };
    }
  }
}

module.exports = NextcloudCalendar;
