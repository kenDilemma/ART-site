const axios = require('axios');
const { parseISO, format, isWithinInterval } = require('date-fns');

class NextcloudCalendar {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.username = config.username;
    this.password = config.password;
    this.calendarName = config.calendarName;
    this.calendarPath = `/remote.php/dav/calendars/${this.username}/${this.calendarName}/`;
  }

  async getBusyTimes(startDate, endDate) {
    try {
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

      const response = await axios({
        method: 'REPORT',
        url: this.baseUrl + this.calendarPath,
        auth: {
          username: this.username,
          password: this.password
        },
        headers: {
          'Content-Type': 'application/xml',
          'Depth': '1'
        },
        data: reportXML
      });

      return this.parseCalendarData(response.data);
    } catch (error) {
      console.error('Error fetching calendar data:', error.message);
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
  }

  async createEvent(eventData) {
    try {
      const { start, end, summary, description, attendees, location } = eventData;
      const eventId = `rhino-training-${Date.now()}`;
      
      // Create iCalendar format
      const icalData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Rhino Training//Calendar//EN
BEGIN:VEVENT
UID:${eventId}@rhino.training
DTSTART:${format(start, "yyyyMMdd'T'HHmmss")}
DTEND:${format(end, "yyyyMMdd'T'HHmmss")}
SUMMARY:${summary}
DESCRIPTION:${description}
LOCATION:${location}
${attendees.map(attendee => `ATTENDEE:mailto:${attendee.email}`).join('\n')}
ORGANIZER:mailto:${this.username}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;

      const response = await axios.put(
        `${this.baseUrl}${this.calendarPath}${eventId}.ics`,
        icalData,
        {
          auth: {
            username: this.username,
            password: this.password
          },
          headers: {
            'Content-Type': 'text/calendar'
          }
        }
      );

      return { success: true, eventId };
    } catch (error) {
      console.error('Error creating calendar event:', error.message);
      return { success: false, error: error.message };
    }
  }

  isTimeSlotBusy(slotStart, slotEnd, busyTimes) {
    return busyTimes.some(busyTime => {
      return isWithinInterval(slotStart, { start: busyTime.start, end: busyTime.end }) ||
             isWithinInterval(slotEnd, { start: busyTime.start, end: busyTime.end }) ||
             (slotStart <= busyTime.start && slotEnd >= busyTime.end);
    });
  }
}

module.exports = NextcloudCalendar;
