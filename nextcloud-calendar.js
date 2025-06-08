const axios = require('axios');
const { parseISO, format, isWithinInterval } = require('date-fns');
const { SocksProxyAgent } = require('socks-proxy-agent');

class NextcloudCalendar {  constructor(config) {    this.baseUrl = config.baseUrl;
    this.username = config.username;
    this.password = config.password;
    this.calendarName = config.calendarName;
    this.basePath = `/remote.php/dav`;
    this.calendarPath = null; // Will be set after calendar discovery      // Configure proxy for .onion addresses
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
      lookup: false,
      // Disable SSL verification for .onion addresses (they often use self-signed certs)
      rejectUnauthorized: false
    };// Check if we're using a .onion address and configure proxy
    if (this.baseUrl.includes('.onion')) {
      const torProxyHost = process.env.TOR_PROXY_HOST || '127.0.0.1';
      const torProxyPort = process.env.TOR_PROXY_PORT || '9050';
      
      // Try multiple proxy configurations for better compatibility
      try {
        // First, try with socks5h protocol for hostname resolution through proxy
        const proxyAgent = new SocksProxyAgent(`socks5h://${torProxyHost}:${torProxyPort}`);
        
        // Configure SSL rejection for .onion self-signed certificates
        if (proxyAgent.options) {
          proxyAgent.options.rejectUnauthorized = false;
        }
        
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
          lookup: false, // Disable local DNS lookup
          rejectUnauthorized: false // Disable SSL verification
        });
        this.axiosConfig.httpsAgent = proxyAgent;
        this.axiosConfig.httpAgent = proxyAgent;
        this.axiosConfig.proxy = false;
        
        console.log(`Configured Tor proxy with object config for .onion address`);      }
    }
  }  async initializeCalendar() {
    if (this.allCalendars && this.allCalendars.length > 0) {
      return; // Already initialized
    }    try {
      console.log('Starting CalDAV discovery process...');
      
      let availableCalendars = [];
      
      // Try standard RFC 4791 discovery first
      try {
        console.log('Step 1: Discovering current-user-principal...');
        const currentUserPrincipal = await this.discoverCurrentUserPrincipal();
        console.log(`Found current-user-principal: ${currentUserPrincipal}`);
        
        console.log('Step 2: Discovering calendar-home-set...');
        const calendarHomeSet = await this.discoverCalendarHomeSet(currentUserPrincipal);
        console.log(`Found calendar-home-set: ${calendarHomeSet}`);
        
        console.log('Step 3: Enumerating calendars...');
        availableCalendars = await this.enumerateCalendars(calendarHomeSet);
        console.log('Available calendars:', availableCalendars);
      } catch (standardError) {
        console.warn('Standard discovery failed, using direct enumeration fallback...', standardError.message);
        
        // Fallback: direct calendar enumeration (which we know works)
        const directCalendarPath = `/remote.php/dav/calendars/${this.username}/`;
        console.log(`Using direct enumeration at: ${directCalendarPath}`);
        availableCalendars = await this.enumerateCalendars(directCalendarPath);
        console.log('Available calendars (direct):', availableCalendars);
      }
      
      // Store ALL calendars for availability checking
      this.allCalendars = availableCalendars;
      console.log(`Stored ${this.allCalendars.length} calendars for availability checking:`, 
        this.allCalendars.map(cal => cal.name));
      
      // Find the primary calendar for booking events (still using calendarName)
      let targetCalendar = availableCalendars.find(cal => 
        cal.name.toLowerCase() === this.calendarName.toLowerCase()
      );
      
      if (!targetCalendar && availableCalendars.length > 0) {
        targetCalendar = availableCalendars[0];
        console.log(`Calendar "${this.calendarName}" not found, using "${targetCalendar.name}"`);
      }
      
      if (targetCalendar) {
        this.calendarPath = targetCalendar.path;
        console.log(`Primary calendar path: ${this.calendarPath}`);
      } else {
        throw new Error('No calendars found');
      }
      
    } catch (error) {
      console.error('Failed to initialize calendar:', error.message);
      // Fallback to the original path construction
      this.calendarPath = `/remote.php/dav/calendars/${this.username}/${this.calendarName}/`;
      console.log(`Using fallback calendar path: ${this.calendarPath}`);
    }  }  async discoverCurrentUserPrincipal() {
    // For .onion addresses, try specific URL combinations first
    if (this.baseUrl.includes('.onion')) {
      const specificUrls = [
        'https://r7bml6jyfycorb7ir4yub7pvitrgj4a3we2pcuqbnrq364jsfddjnryd.onion/remote.php/dav',
        'http://r7bml6jyfycorb7ir4yub7pvitrgj4a3we2pcuqbnrq364jsfddjnryd.onion/remote.php/dav',
        'https://r7bml6jyfycorb7ir4yub7pvitrgj4a3we2pcuqbnrq364jsfddjnryd.onion',
        'http://r7bml6jyfycorb7ir4yub7pvitrgj4a3we2pcuqbnrq364jsfddjnryd.onion'
      ];

      for (const fullUrl of specificUrls) {
        try {
          console.log(`Trying specific .onion URL: ${fullUrl}`);
          
          const propfindXML = `<?xml version="1.0" encoding="utf-8" ?>
            <D:propfind xmlns:D="DAV:">
              <D:prop>
                <D:current-user-principal />
              </D:prop>
            </D:propfind>`;

          // Create custom config for this specific URL
          const requestConfig = {
            ...this.axiosConfig,
            method: 'PROPFIND',
            url: fullUrl,
            headers: {
              ...this.axiosConfig.headers,
              'Content-Type': 'application/xml',
              'Depth': '0'
            },
            data: propfindXML
          };

          const response = await axios(requestConfig);
          console.log(`✓ Found working .onion URL: ${fullUrl}`);
          
          // Update baseUrl and basePath based on working URL
          if (fullUrl.includes('/remote.php/dav')) {
            this.baseUrl = fullUrl.replace('/remote.php/dav', '');
            this.basePath = '/remote.php/dav';
          } else {
            this.baseUrl = fullUrl;
            this.basePath = '';
          }
          
          console.log(`Updated baseUrl: ${this.baseUrl}`);
          console.log(`Updated basePath: ${this.basePath}`);
            // Extract current-user-principal from response
          const principalMatch = response.data.match(/<[dD]:current-user-principal>\s*<[dD]:href>([^<]+)<\/[dD]:href>\s*<\/[dD]:current-user-principal>/);
          if (principalMatch) {
            console.log(`Found current-user-principal: ${principalMatch[1]}`);
            return principalMatch[1];
          }
          
          // If no principal found but endpoint works, continue to next URL
          console.log(`URL ${fullUrl} works but no current-user-principal found`);
          
        } catch (error) {
          console.log(`URL ${fullUrl} failed: ${error.message}`);
          if (error.response) {
            console.log(`  Response status: ${error.response.status}`);
          }
          continue;
        }
      }
    }

    // Fallback to standard endpoint discovery for non-.onion or if specific URLs failed
    const hostname = this.baseUrl.replace(/^https?:\/\//, '');
    const url_combinations = [
      `https://${hostname}/remote.php/dav`,
      `http://${hostname}/remote.php/dav`,
      `https://${hostname}`,
      `http://${hostname}`,
      `${this.baseUrl}/remote.php/dav`,
      `${this.baseUrl}/remote.php/webdav`,
      `${this.baseUrl}/remote.php/caldav`,
      `${this.baseUrl}/.well-known/caldav`,
      `${this.baseUrl}/.well-known/carddav`,
      `${this.baseUrl}/dav`,
      `${this.baseUrl}/caldav`,
      `${this.baseUrl}/webdav`,
      `${this.baseUrl}/nextcloud/remote.php/dav`,
      `${this.baseUrl}/owncloud/remote.php/dav`,
      `${this.baseUrl}/apps/calendar/`,
      `${this.baseUrl}/index.php/apps/calendar/`
    ];

    for (const fullUrl of url_combinations) {
      try {
        console.log(`Trying full URL: ${fullUrl}`);
        
        const propfindXML = `<?xml version="1.0" encoding="utf-8" ?>
          <D:propfind xmlns:D="DAV:">
            <D:prop>
              <D:current-user-principal />
            </D:prop>
          </D:propfind>`;

        const requestConfig = {
          ...this.axiosConfig,
          method: 'PROPFIND',
          url: fullUrl,
          headers: {
            ...this.axiosConfig.headers,
            'Content-Type': 'application/xml',
            'Depth': '0'
          },
          data: propfindXML
        };

        const response = await axios(requestConfig);
        console.log(`✓ Found working URL: ${fullUrl}`);
        
        // Update baseUrl and basePath for future requests
        if (fullUrl.includes('/remote.php/dav')) {
          this.baseUrl = fullUrl.replace('/remote.php/dav', '');
          this.basePath = '/remote.php/dav';
        } else {
          this.baseUrl = fullUrl;
          this.basePath = '';
        }
        
        console.log(`Updated baseUrl: ${this.baseUrl}`);
        console.log(`Updated basePath: ${this.basePath}`);
          // Extract current-user-principal from response
        const principalMatch = response.data.match(/<[dD]:current-user-principal>\s*<[dD]:href>([^<]+)<\/[dD]:href>\s*<\/[dD]:current-user-principal>/);
        if (principalMatch) {
          return principalMatch[1];
        }
        
        // If no principal found but endpoint works, continue to next endpoint
        console.log(`URL ${fullUrl} works but no current-user-principal found`);
        
      } catch (error) {
        console.log(`URL ${fullUrl} failed: ${error.message}`);
        continue;
      }
    }
    
    throw new Error('Could not discover current-user-principal from any URL combination');
  }

  async discoverCalendarHomeSet(principalPath) {
    const propfindXML = `<?xml version="1.0" encoding="utf-8" ?>
      <D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
        <D:prop>
          <C:calendar-home-set />
        </D:prop>
      </D:propfind>`;

    const requestConfig = {
      ...this.axiosConfig,
      method: 'PROPFIND',
      url: this.baseUrl + principalPath,
      headers: {
        ...this.axiosConfig.headers,
        'Content-Type': 'application/xml',
        'Depth': '0'
      },
      data: propfindXML
    };

    const response = await axios(requestConfig);
      // Extract calendar-home-set from response
    const calendarHomeMatch = response.data.match(/<[cC]:calendar-home-set>\s*<[dD]:href>([^<]+)<\/[dD]:href>\s*<\/[cC]:calendar-home-set>/);
    if (calendarHomeMatch) {
      return calendarHomeMatch[1];
    }
    
    throw new Error('Could not discover calendar-home-set');
  }

  async enumerateCalendars(calendarHomePath) {
    const propfindXML = `<?xml version="1.0" encoding="utf-8" ?>
      <D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav" xmlns:CS="http://calendarserver.org/ns/">
        <D:prop>
          <D:resourcetype />
          <D:displayname />
          <CS:getctag />
          <C:supported-calendar-component-set />
        </D:prop>
      </D:propfind>`;

    const requestConfig = {
      ...this.axiosConfig,
      method: 'PROPFIND',
      url: this.baseUrl + calendarHomePath,
      headers: {
        ...this.axiosConfig.headers,
        'Content-Type': 'application/xml',
        'Depth': '1'
      },
      data: propfindXML
    };

    const response = await axios(requestConfig);
    return this.parseCalendarList(response.data);
  }  parseCalendarList(xmlData) {
    const calendars = [];
    try {      
      // Simple regex parsing - in production, use a proper XML parser
      // Support both uppercase and lowercase namespace prefixes
      const resourceMatches = xmlData.match(/<[dD]:response>([\s\S]*?)<\/[dD]:response>/g);
      
      if (resourceMatches) {
        resourceMatches.forEach(resource => {
          const hrefMatch = resource.match(/<[dD]:href>([^<]+)<\/[dD]:href>/);
          const displayNameMatch = resource.match(/<[dD]:displayname>([^<]*)<\/[dD]:displayname>/);
          
          // Updated regex to match actual XML structure: <cal:calendar/> or <C:calendar/>
          const resourceTypeMatch = resource.match(/<(?:cal|[cC]):calendar\s*\/>/);
          
          if (hrefMatch && resourceTypeMatch) {
            const path = hrefMatch[1];
            const name = displayNameMatch ? displayNameMatch[1] : path.split('/').filter(p => p).pop();
            
            // Only include actual calendar resources, not the parent directory
            // Calendar paths should end with / and have meaningful names
            if (path.endsWith('/') && name && name.trim() !== '') {
              calendars.push({
                name: name || 'Unnamed Calendar',
                path: path
              });
              console.log(`Found calendar: "${name}" at path: ${path}`);
            }
          }
        });
      }
      
      console.log(`Parsed ${calendars.length} calendars from XML response`);
    } catch (error) {
      console.error('Error parsing calendar list:', error);
    }
    
    return calendars;
  }  async getBusyTimes(startDate, endDate) {
    try {
      // Initialize calendar path if not already done
      await this.initializeCalendar();
      
      console.log(`Checking availability across multiple calendars...`);
      console.log(`Date range: ${format(startDate, "yyyy-MM-dd")} to ${format(endDate, "yyyy-MM-dd")}`);
      
      // Define the calendars to check for availability
      const calendarsToCheck = ['Personal', 'MEETING', 'VACA'];
      const allBusyTimes = [];
      
      // Find the relevant calendars from our discovered calendars
      const relevantCalendars = this.allCalendars.filter(cal => 
        calendarsToCheck.some(checkName => 
          cal.name.toLowerCase() === checkName.toLowerCase()
        )
      );
      
      console.log(`Found ${relevantCalendars.length} calendars to check:`, 
        relevantCalendars.map(cal => cal.name));
      
      // Query each calendar for busy times
      for (const calendar of relevantCalendars) {
        try {
          console.log(`Fetching events from calendar: ${calendar.name}`);
          
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
            url: this.baseUrl + calendar.path,
            headers: {
              ...this.axiosConfig.headers,
              'Content-Type': 'application/xml',
              'Depth': '1'
            },
            data: reportXML
          };

          const response = await axios(requestConfig);
          console.log(`✓ Calendar ${calendar.name} response received, status: ${response.status}`);
          
          const calendarBusyTimes = this.parseCalendarData(response.data);
          console.log(`  Found ${calendarBusyTimes.length} events in ${calendar.name}`);
          
          // Add calendar name to each busy time for debugging
          calendarBusyTimes.forEach(busyTime => {
            busyTime.calendar = calendar.name;
          });
          
          allBusyTimes.push(...calendarBusyTimes);
          
        } catch (calendarError) {
          console.warn(`Failed to fetch events from ${calendar.name}:`, calendarError.message);
          // Continue with other calendars even if one fails
        }
      }
      
      console.log(`Total busy times found: ${allBusyTimes.length}`);
      if (allBusyTimes.length > 0) {
        console.log('Busy time summary:');
        allBusyTimes.forEach((busyTime, index) => {
          console.log(`  ${index + 1}. ${format(busyTime.start, 'yyyy-MM-dd HH:mm')} - ${format(busyTime.end, 'yyyy-MM-dd HH:mm')} (${busyTime.calendar})`);
        });
      }

      return allBusyTimes;} catch (error) {
      console.error('Error fetching calendar data:');
      console.error('- Error message:', error.message);
      console.error('- Error code:', error.code);
      if (error.response) {
        console.error('- Response status:', error.response.status);
        console.error('- Response data:', error.response.data);
      }
      
      // IMPORTANT: Throw error instead of returning empty array
      // This prevents false availability when calendar is unreachable
      throw new Error(`Calendar service unavailable: ${error.message}`);
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
  }  async discoverCalendars() {
    try {
      console.log('Discovering available calendars...');
      
      // Try the standard RFC 4791 discovery process first
      try {
        const currentUserPrincipal = await this.discoverCurrentUserPrincipal();
        const calendarHomeSet = await this.discoverCalendarHomeSet(currentUserPrincipal);
        const calendars = await this.enumerateCalendars(calendarHomeSet);
        
        console.log('✓ Standard CalDAV discovery successful!');
        console.log(`Found ${calendars.length} calendars via RFC 4791 discovery`);
        return { success: true, calendars: calendars };
      } catch (standardError) {
        console.warn('Standard CalDAV discovery failed, trying direct enumeration...', standardError.message);
        
        // Fallback to direct calendar enumeration (which we know works)
        const directCalendarPath = `/remote.php/dav/calendars/${this.username}/`;
        console.log(`Trying direct enumeration at: ${directCalendarPath}`);
        
        const calendars = await this.enumerateCalendars(directCalendarPath);
        
        if (calendars.length > 0) {
          console.log('✓ Direct calendar enumeration successful!');
          console.log(`Found ${calendars.length} calendars via direct enumeration`);
          return { success: true, calendars: calendars };
        } else {
          throw new Error('No calendars found via direct enumeration');
        }
      }
    } catch (error) {
      console.error('✗ All calendar discovery methods failed:', error.message);
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
