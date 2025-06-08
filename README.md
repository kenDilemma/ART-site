# RHINO.TRAINING

A minimalist, professionally-styled single-page website for Rhino3D consulting and training.

## Overview

This is a clean, lean static website built with just HTML, CSS, and minimal JavaScript. The site features a modern aesthetic with lime green and magenta on a dark background.

## Features

- Single HTML file with no framework dependencies
- Pure CSS styling with modern theme
- Minimal JavaScript for smooth scrolling
- Responsive design that works on mobile and desktop
- Fast loading with no build step required

## Sections

- Home - Main landing area
- About - Information about the creator/company
- Services - Rhino3D training and consulting offerings
- Videos - Placeholder for future Nostr feed integration
- Calendar - Placeholder for future scheduling integration
- Contact - Contact information with Nostr profile link

## Customization

To customize this site:

1. Edit the `index.html` file to update content
2. Modify `styles.css` to change the styling
3. Update the logo or add more images as needed
4. Extend `script.js` if more interactivity is required

## Deployment

Simply upload all files to any web hosting service. No build process required!

## License

Copyright © 2025 # Rhino Training Website with Custom Calendar

A modern, terminal-themed website for Rhino3D training consultations featuring a custom calendar booking system integrated with Nextcloud and email notifications.

## Features

- 🗓️ **Custom Calendar System**: Cookie-free calendar booking with date/time selection
- 📧 **Email Integration**: Automatic ICS file generation and email notifications
- 🎥 **Jitsi Integration**: Automatic video meeting links for consultations
- ☁️ **Nextcloud Sync**: Two-way calendar synchronization with your Nextcloud instance
- 📱 **Responsive Design**: Mobile-friendly interface with terminal aesthetics
- 👥 **Guest Support**: Add multiple guests to appointments
- 🔒 **Privacy-Focused**: No third-party cookies or tracking

## Setup Instructions

### 1. Environment Configuration

Copy the example environment file and configure your settings:

```powershell
Copy-Item .env.example .env
```

Edit the `.env` file with your actual credentials:

```bash
# Nextcloud Configuration
NEXTCLOUD_URL=https://your-nextcloud-instance.com
NEXTCLOUD_USERNAME=your-username
NEXTCLOUD_PASSWORD=your-app-password
NEXTCLOUD_CALENDAR=personal

# Email Configuration (Gmail example)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Server Configuration
PORT=3000
```

### 2. Nextcloud Setup

1. **Create App Password**: 
   - Go to Nextcloud Settings → Security
   - Create a new app password for calendar access
   - Use this password in your `.env` file

2. **Calendar Access**:
   - Ensure your calendar is named correctly (default: "personal")
   - The calendar should be accessible via CalDAV

### 3. Email Setup

For Gmail (recommended for development):
1. Enable 2-Factor Authentication
2. Generate an App-Specific Password
3. Use this password in your `.env` file

For production, consider using:
- SendGrid
- Mailgun
- AWS SES

### 4. Running the Application

Start the development server:

```powershell
npm run dev
```

Or for production:

```powershell
npm start
```

The application will be available at `http://localhost:3000`

## How It Works

### Calendar Booking Flow

1. **Date Selection**: Users click "Schedule Your Consultation" to open the calendar modal
2. **Availability Check**: The system queries your Nextcloud calendar for busy times
3. **Time Slot Selection**: Available 15-minute slots from 9 AM to 4:45 PM are displayed
4. **Form Completion**: Users fill in their details and can add guests
5. **Booking Confirmation**: 
   - ICS files are generated and emailed to all participants
   - Event is created in your Nextcloud calendar
   - Jitsi meeting link is included
   - Confirmation emails are sent

### Technical Details

- **Frontend**: Vanilla JavaScript with custom calendar component
- **Backend**: Express.js server with REST API
- **Calendar Integration**: CalDAV protocol for Nextcloud communication
- **Email**: Nodemailer with ICS attachment generation
- **Video Conferencing**: Jitsi Meet with unique room IDs

## API Endpoints

### GET `/api/availability/:date`
Returns available time slots for a specific date.

**Response:**
```json
{
  "available": true,
  "slots": [
    {
      "time": "09:00",
      "datetime": "2024-06-08T09:00:00.000Z"
    }
  ]
}
```

### POST `/api/book`
Creates a new appointment booking.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "datetime": "2024-06-08T09:00:00.000Z",
  "notes": "Need help with advanced surfacing",
  "guests": [
    {
      "name": "Jane Doe",
      "email": "jane@example.com"
    }
  ]
}
```

## Customization

### Business Hours
Modify the `BUSINESS_HOURS` configuration in `server.js`:

```javascript
const BUSINESS_HOURS = {
  start: 9,        // 9 AM
  end: 17,         // 5 PM (last slot at 4:45 PM)
  slotDuration: 15 // 15 minutes
};
```

### Styling
The calendar inherits the terminal theme from `styles.css`. Key CSS classes:
- `.calendar-container` - Main calendar wrapper
- `.calendar-modal` - Modal overlay
- `.calendar-day` - Individual calendar days
- `.time-slot` - Time selection buttons

### Email Templates
Modify the email content in the `/api/book` endpoint in `server.js`.

## Troubleshooting

### Calendar Not Loading
- Check Nextcloud URL and credentials
- Verify calendar name exists
- Test CalDAV access manually

### Email Not Sending
- Verify email service configuration
- Check app-specific passwords
- Review firewall/security settings

### Booking Conflicts
- The system automatically filters out busy times
- Refresh the page if availability seems incorrect
- Check Nextcloud calendar for sync issues

## Security Notes

- Never commit `.env` file to version control
- Use app-specific passwords, not main account passwords
- Consider implementing rate limiting for production
- Regular security updates for dependencies

## License

This project is licensed under the ISC License..training - All rights reserved
