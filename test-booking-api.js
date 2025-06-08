const axios = require('axios');

async function testBookingAPI() {
  console.log('='.repeat(50));
  console.log('TESTING BOOKING API ENDPOINT');
  console.log('='.repeat(50));

  const bookingData = {
    name: "John Test",
    email: "john.test@example.com", 
    datetime: "2025-06-09T13:00:00.000Z",
    notes: "Test booking for system verification",
    guests: [
      {
        name: "Jane Guest",
        email: "jane.guest@example.com"
      }
    ]
  };

  try {
    console.log('\n1. Testing booking with valid data:');
    console.log('Booking data:', JSON.stringify(bookingData, null, 2));

    const response = await axios.post('http://localhost:3000/api/book', bookingData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    console.log('\n✅ Booking successful!');
    console.log('Response:', response.data);

  } catch (error) {
    if (error.response) {
      console.error('\n❌ Booking failed with server response:');
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('\n❌ Booking failed with error:', error.message);
    }
  }

  console.log('\n2. Testing availability after booking:');
  try {
    const availResponse = await axios.get('http://localhost:3000/api/availability/2025-06-09');
    console.log('Available slots:', availResponse.data.slots.length);
    
    // Check if the 9:00 AM slot is still available
    const nineAmSlot = availResponse.data.slots.find(slot => slot.time === '09:00');
    console.log('9:00 AM slot available:', !!nineAmSlot);
    
  } catch (error) {
    console.error('Availability check failed:', error.message);
  }
}

testBookingAPI().catch(console.error);
