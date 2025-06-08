const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const ical = require('ical-generator');
const axios = require('axios');
const { format, addMinutes, parseISO, isAfter, isBefore, startOfDay, endOfDay } = require('date-fns');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const NextcloudCalendar = require('./nextcloud-calendar');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

// Configuration - You'll need to update these with your actual credentials
const NEXTCLOUD_CONFIG = {
  baseUrl: process.env.NEXTCLOUD_URL || 'https://your-nextcloud-instance.com',
  username: process.env.NEXTCLOUD_USERNAME || 'your-username',
  password: process.env.NEXTCLOUD_PASSWORD || 'your-app-password',
  calendarName: process.env.NEXTCLOUD_CALENDAR || 'personal'
};

const EMAIL_CONFIG = {
  service: process.env.EMAIL_SERVICE || 'gmail',
  user: process.env.EMAIL_USER || 'your-email@gmail.com',
  password: process.env.EMAIL_PASSWORD || 'your-app-password'
};

// Initialize Nextcloud calendar
const nextcloudCalendar = new NextcloudCalendar(NEXTCLOUD_CONFIG);

// Create email transporter
const transporter = nodemailer.createTransport({
  service: EMAIL_CONFIG.service,
  auth: {
    user: EMAIL_CONFIG.user,
    pass: EMAIL_CONFIG.password
  }
});

// Business hours configuration
const BUSINESS_HOURS = {
  start: 9, // 9 AM
  end: 17, // 5 PM (last slot at 4:45 PM)
  slotDuration: 15 // 15 minutes
};

// Generate available time slots for a given date
function generateTimeSlots(date) {
  const slots = [];
  const startHour = BUSINESS_HOURS.start;
  const endHour = BUSINESS_HOURS.end;
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minutes = 0; minutes < 60; minutes += BUSINESS_HOURS.slotDuration) {
      const slotTime = new Date(date);
      slotTime.setHours(hour, minutes, 0, 0);
      
      // Don't add the last slot if it would be at or after end hour
      if (slotTime.getHours() < endHour - 1 || 
          (slotTime.getHours() === endHour - 1 && slotTime.getMinutes() <= 45)) {
        slots.push({
          time: format(slotTime, 'HH:mm'),
          datetime: slotTime.toISOString()
        });
      }
    }
  }
  
  return slots;
}

// Get busy times from Nextcloud calendar
async function getBusyTimes(startDate, endDate) {
  try {
    return await nextcloudCalendar.getBusyTimes(startDate, endDate);
  } catch (error) {
    console.error('Error fetching calendar data:', error.message);
    return [];
  }
}

// API Routes

// Get available time slots for a specific date
app.get('/api/availability/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const requestedDate = parseISO(date);
    
    // Check if date is in the past
    const now = new Date();
    if (isBefore(requestedDate, now)) {
      return res.json({ available: false, slots: [] });
    }
    
    // Check if it's a weekend (optional - remove if you work weekends)
    const dayOfWeek = requestedDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return res.json({ available: false, slots: [] });
    }
      // Generate all possible time slots
    const allSlots = generateTimeSlots(requestedDate);
    
    // Get busy times from calendar
    const startOfRequestedDate = startOfDay(requestedDate);
    const endOfRequestedDate = endOfDay(requestedDate);
    const busyTimes = await getBusyTimes(startOfRequestedDate, endOfRequestedDate);
    
    // Filter out busy slots
    const availableSlots = allSlots.filter(slot => {
      const slotStart = parseISO(slot.datetime);
      const slotEnd = addMinutes(slotStart, BUSINESS_HOURS.slotDuration);
      
      // Check if slot conflicts with any busy time
      return !nextcloudCalendar.isTimeSlotBusy(slotStart, slotEnd, busyTimes);
    });
    
    res.json({
      available: availableSlots.length > 0,
      slots: availableSlots
    });
  } catch (error) {
    console.error('Error getting availability:', error);
    res.status(500).json({ error: 'Failed to get availability' });
  }
});

// Book an appointment
app.post('/api/book', async (req, res) => {
  try {
    const { name, email, datetime, notes, guests = [] } = req.body;
    
    if (!name || !email || !datetime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const appointmentDate = parseISO(datetime);
    const endDate = addMinutes(appointmentDate, BUSINESS_HOURS.slotDuration);
    
    // Generate unique meeting ID for Jitsi
    const meetingId = uuidv4();
    const jitsiLink = `https://meet.jit.si/rhino-training-${meetingId}`;
    
    // Create ICS calendar event
    const calendar = ical({
      name: 'Rhino Training Consultation',
      timezone: 'America/New_York' // Adjust to your timezone
    });
    
    const event = calendar.createEvent({
      start: appointmentDate,
      end: endDate,
      summary: 'Rhino Training Consultation',
      description: `
Consultation with ${name}

Notes: ${notes || 'No additional notes'}

Join the video call:
${jitsiLink}

If you need to reschedule, please contact us as soon as possible.
      `.trim(),
      location: jitsiLink,
      organizer: {
        name: 'Kurt - Rhino Training',
        email: EMAIL_CONFIG.user
      },
      attendees: [
        { email, name },
        ...guests.map(guest => ({ email: guest.email, name: guest.name }))
      ]
    });
    
    // Prepare email content
    const emailContent = `
<h2>Rhino Training Consultation Scheduled</h2>
<p>Hello ${name},</p>
<p>Your consultation has been scheduled for:</p>
<ul>
  <li><strong>Date:</strong> ${format(appointmentDate, 'EEEE, MMMM do, yyyy')}</li>
  <li><strong>Time:</strong> ${format(appointmentDate, 'h:mm a')} - ${format(endDate, 'h:mm a')}</li>
  <li><strong>Duration:</strong> ${BUSINESS_HOURS.slotDuration} minutes</li>
</ul>

<p><strong>Video Call Link:</strong> <a href="${jitsiLink}">${jitsiLink}</a></p>

${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}

<p>Please save the attached calendar file (.ics) to add this appointment to your calendar.</p>

<p>If you need to reschedule or have any questions, please reply to this email.</p>

<p>Looking forward to our consultation!</p>
<p>Best regards,<br>Kurt<br>Rhino Training</p>
    `;
      // Send emails to all participants
    const allEmails = [email, ...guests.map(g => g.email), EMAIL_CONFIG.user];
    
    for (const recipientEmail of allEmails) {
      await transporter.sendMail({
        from: EMAIL_CONFIG.user,
        to: recipientEmail,
        subject: `Rhino Training Consultation - ${format(appointmentDate, 'MMM do, yyyy')}`,
        html: emailContent,
        attachments: [
          {
            filename: 'consultation.ics',
            content: calendar.toString(),
            contentType: 'text/calendar'
          }
        ]
      });
    }
    
    // Create event in Nextcloud calendar
    try {
      const nextcloudEventData = {
        start: appointmentDate,
        end: endDate,
        summary: `Rhino Training Consultation - ${name}`,
        description: `
Consultation with ${name} (${email})

Notes: ${notes || 'No additional notes'}

Video Call: ${jitsiLink}

Guests: ${guests.map(g => `${g.name} (${g.email})`).join(', ') || 'None'}
        `.trim(),
        location: jitsiLink,
        attendees: [{ email, name }, ...guests]
      };
      
      const nextcloudResult = await nextcloudCalendar.createEvent(nextcloudEventData);
      if (!nextcloudResult.success) {
        console.warn('Failed to create Nextcloud calendar event:', nextcloudResult.error);
      }
    } catch (error) {
      console.warn('Error creating Nextcloud calendar event:', error.message);
    }
    
    res.json({
      success: true,
      message: 'Appointment booked successfully',
      meetingLink: jitsiLink,
      appointmentId: meetingId
    });
    
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ error: 'Failed to book appointment' });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Make sure to set your environment variables:');
  console.log('- NEXTCLOUD_URL');
  console.log('- NEXTCLOUD_USERNAME');
  console.log('- NEXTCLOUD_PASSWORD');
  console.log('- EMAIL_USER');
  console.log('- EMAIL_PASSWORD');
});
