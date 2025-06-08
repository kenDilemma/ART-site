// Custom Calendar Booking System
class CalendarBooking {
  constructor() {
    this.currentDate = new Date();
    this.selectedDate = null;
    this.selectedTime = null;
    this.guests = [];
    this.init();
  }

  init() {
    this.createCalendarHTML();
    this.bindEvents();
  }

  createCalendarHTML() {
    const calendarSection = document.getElementById('calendar');
    const placeholderBox = calendarSection.querySelector('.placeholder-box');
    
    placeholderBox.innerHTML = `
      <button class="calendar-trigger" id="openCalendar">
        Schedule Your Consultation
      </button>
      
      <div class="calendar-modal" id="calendarModal">
        <div class="modal-content">
          <button class="modal-close" id="closeModal">&times;</button>
          
          <div class="calendar-header">
            <button class="calendar-nav" id="prevMonth">&larr; Previous</button>
            <h3 class="calendar-title" id="calendarTitle"></h3>
            <button class="calendar-nav" id="nextMonth">Next &rarr;</button>
          </div>
          
          <div class="calendar-grid" id="calendarGrid">
            <!-- Calendar days will be inserted here -->
          </div>
          
          <div class="time-slots" id="timeSlots">
            <h4 class="time-slots-title">Available Times</h4>
            <div class="time-slots-grid" id="timeSlotsGrid">
              <!-- Time slots will be inserted here -->
            </div>
          </div>
          
          <div class="booking-form" id="bookingForm">
            <form id="appointmentForm">
              <div class="form-group">
                <label class="form-label" for="clientName">Full Name *</label>
                <input type="text" id="clientName" class="form-input" required>
              </div>
              
              <div class="form-group">
                <label class="form-label" for="clientEmail">Email Address *</label>
                <input type="email" id="clientEmail" class="form-input" required>
              </div>
              
              <div class="form-group">
                <label class="form-label" for="clientNotes">Additional Notes</label>
                <textarea id="clientNotes" class="form-textarea" 
                  placeholder="Tell me about your Rhino3D project or what you'd like to learn..."></textarea>
              </div>
              
              <div class="guests-section">
                <div class="guests-title">Additional Guests (Optional)</div>
                <div id="guestsList"></div>
                <button type="button" class="btn btn-secondary btn-small" id="addGuest">
                  + Add Guest
                </button>
              </div>
              
              <div class="form-actions">
                <button type="button" class="btn btn-secondary" id="cancelBooking">
                  Cancel
                </button>
                <button type="submit" class="btn" id="confirmBooking">
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // Modal controls
    document.getElementById('openCalendar').addEventListener('click', () => this.openModal());
    document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
    document.getElementById('cancelBooking').addEventListener('click', () => this.closeModal());
    
    // Calendar navigation
    document.getElementById('prevMonth').addEventListener('click', () => this.previousMonth());
    document.getElementById('nextMonth').addEventListener('click', () => this.nextMonth());
    
    // Form submission
    document.getElementById('appointmentForm').addEventListener('submit', (e) => this.handleBooking(e));
    
    // Guest management
    document.getElementById('addGuest').addEventListener('click', () => this.addGuest());
    
    // Close modal on outside click
    document.getElementById('calendarModal').addEventListener('click', (e) => {
      if (e.target.id === 'calendarModal') {
        this.closeModal();
      }
    });
    
    // Initial calendar render
    this.renderCalendar();
  }

  openModal() {
    document.getElementById('calendarModal').classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    document.getElementById('calendarModal').classList.remove('active');
    document.body.style.overflow = '';
    this.resetForm();
  }

  resetForm() {
    this.selectedDate = null;
    this.selectedTime = null;
    this.guests = [];
    document.getElementById('timeSlots').classList.remove('active');
    document.getElementById('bookingForm').classList.remove('active');
    document.getElementById('appointmentForm').reset();
    document.getElementById('guestsList').innerHTML = '';
    this.renderCalendar();
  }

  previousMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.renderCalendar();
  }

  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.renderCalendar();
  }

  renderCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    // Update title
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    document.getElementById('calendarTitle').textContent = `${monthNames[month]} ${year}`;
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = `
      <div class="calendar-day-header">Sun</div>
      <div class="calendar-day-header">Mon</div>
      <div class="calendar-day-header">Tue</div>
      <div class="calendar-day-header">Wed</div>
      <div class="calendar-day-header">Thu</div>
      <div class="calendar-day-header">Fri</div>
      <div class="calendar-day-header">Sat</div>
    `;
    
    // Generate calendar days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dayElement = document.createElement('div');
      dayElement.className = 'calendar-day';
      dayElement.textContent = date.getDate();
      
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.getTime() === today.getTime();
      const isPast = date < today;
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      if (!isCurrentMonth) {
        dayElement.classList.add('other-month');
      } else if (isPast || isWeekend) {
        dayElement.classList.add('unavailable');
      } else {
        dayElement.classList.add('available');
        dayElement.addEventListener('click', () => this.selectDate(date));
      }
      
      if (isToday) {
        dayElement.style.fontWeight = 'bold';
      }
      
      grid.appendChild(dayElement);
    }
  }

  async selectDate(date) {
    // Remove previous selection
    document.querySelectorAll('.calendar-day.selected').forEach(day => {
      day.classList.remove('selected');
    });
    
    // Mark new selection
    event.target.classList.add('selected');
    this.selectedDate = date;
    
    // Load available time slots
    await this.loadTimeSlots(date);
  }

  async loadTimeSlots(date) {
    const timeSlotsContainer = document.getElementById('timeSlots');
    const grid = document.getElementById('timeSlotsGrid');
    
    // Show loading state
    grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: var(--color-lime);">Loading available times...</div>';
    timeSlotsContainer.classList.add('active');
      try {
      const dateStr = date.toISOString().split('T')[0];
      const response = await fetch(`http://localhost:3000/api/availability/${dateStr}`);
      const data = await response.json();
      
      if (data.available && data.slots.length > 0) {
        grid.innerHTML = '';
        data.slots.forEach(slot => {
          const slotElement = document.createElement('div');
          slotElement.className = 'time-slot';
          slotElement.textContent = slot.time;
          slotElement.addEventListener('click', () => this.selectTime(slot));
          grid.appendChild(slotElement);
        });
      } else {
        grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: var(--color-gray-400);">No available times for this date</div>';
      }
    } catch (error) {
      console.error('Error loading time slots:', error);
      grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #ff4444;">Error loading available times</div>';
    }
  }

  selectTime(slot) {
    // Remove previous selection
    document.querySelectorAll('.time-slot.selected').forEach(timeSlot => {
      timeSlot.classList.remove('selected');
    });
    
    // Mark new selection
    event.target.classList.add('selected');
    this.selectedTime = slot;
    
    // Show booking form
    document.getElementById('bookingForm').classList.add('active');
  }

  addGuest() {
    const guestsList = document.getElementById('guestsList');
    const guestIndex = this.guests.length;
    
    const guestElement = document.createElement('div');
    guestElement.className = 'guest-input-group';
    guestElement.innerHTML = `
      <input type="text" class="guest-input" placeholder="Guest name" data-guest="${guestIndex}" data-field="name">
      <input type="email" class="guest-input" placeholder="Guest email" data-guest="${guestIndex}" data-field="email">
      <button type="button" class="btn btn-remove btn-small" onclick="this.parentElement.remove(); calendarBooking.removeGuest(${guestIndex});">
        Remove
      </button>
    `;
    
    guestsList.appendChild(guestElement);
    this.guests.push({ name: '', email: '' });
  }

  removeGuest(index) {
    this.guests.splice(index, 1);
  }

  async handleBooking(e) {
    e.preventDefault();
    
    if (!this.selectedDate || !this.selectedTime) {
      alert('Please select a date and time');
      return;
    }
    
    const form = e.target;
    const submitButton = document.getElementById('confirmBooking');
    const originalText = submitButton.textContent;
    
    // Update form state
    submitButton.textContent = 'Booking...';
    submitButton.disabled = true;
    form.classList.add('loading');
    
    try {
      // Collect guest information
      const guestInputs = document.querySelectorAll('.guest-input');
      const guests = [];
      const guestMap = {};
      
      guestInputs.forEach(input => {
        const guestIndex = input.dataset.guest;
        const field = input.dataset.field;
        
        if (!guestMap[guestIndex]) {
          guestMap[guestIndex] = {};
        }
        guestMap[guestIndex][field] = input.value.trim();
      });
      
      Object.values(guestMap).forEach(guest => {
        if (guest.name && guest.email) {
          guests.push(guest);
        }
      });
      
      // Prepare booking data
      const bookingData = {
        name: document.getElementById('clientName').value.trim(),
        email: document.getElementById('clientEmail').value.trim(),
        datetime: this.selectedTime.datetime,
        notes: document.getElementById('clientNotes').value.trim(),
        guests: guests
      };
        // Submit booking
      const response = await fetch('http://localhost:3000/api/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert(`Booking confirmed! You'll receive a confirmation email shortly. Meeting link: ${result.meetingLink}`);
        this.closeModal();
      } else {
        throw new Error(result.error || 'Booking failed');
      }
      
    } catch (error) {
      console.error('Booking error:', error);
      alert(`Booking failed: ${error.message}`);
    } finally {
      submitButton.textContent = originalText;
      submitButton.disabled = false;
      form.classList.remove('loading');
    }
  }
}

// Initialize calendar when page loads
let calendarBooking;
document.addEventListener('DOMContentLoaded', () => {
  calendarBooking = new CalendarBooking();
});
