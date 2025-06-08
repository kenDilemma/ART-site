const { isWithinInterval } = require('date-fns');

// Test the isWithinInterval function directly
console.log('=== TESTING isWithinInterval FUNCTION ===');

// Vacation period: 2025-06-26T00:00:00.000Z to 2025-07-01T00:00:00.000Z
const vacationStart = new Date('2025-06-26T00:00:00.000Z');
const vacationEnd = new Date('2025-07-01T00:00:00.000Z');

// Test slot: 9:00 AM EST = 13:00 UTC = 2025-06-26T13:00:00.000Z
const slotStart = new Date('2025-06-26T13:00:00.000Z');
const slotEnd = new Date('2025-06-26T13:15:00.000Z');

console.log('Vacation period:');
console.log(`  Start: ${vacationStart.toISOString()}`);
console.log(`  End:   ${vacationEnd.toISOString()}`);

console.log('\nTest slot:');
console.log(`  Start: ${slotStart.toISOString()}`);
console.log(`  End:   ${slotEnd.toISOString()}`);

// Test 1: Is slot start within vacation period?
const test1 = isWithinInterval(slotStart, { start: vacationStart, end: vacationEnd });
console.log(`\nTest 1 - isWithinInterval(slotStart, vacation): ${test1}`);

// Test 2: Is slot end within vacation period?
const test2 = isWithinInterval(slotEnd, { start: vacationStart, end: vacationEnd });
console.log(`Test 2 - isWithinInterval(slotEnd, vacation): ${test2}`);

// Test 3: Does slot completely contain vacation period?
const test3 = (slotStart <= vacationStart && slotEnd >= vacationEnd);
console.log(`Test 3 - slot contains vacation: ${test3}`);

// Overall result
const shouldBeBlocked = test1 || test2 || test3;
console.log(`\nOverall result - should be blocked: ${shouldBeBlocked}`);

// Test with multiple slots to see the pattern
console.log('\n=== TESTING MULTIPLE SLOTS ===');
const testSlots = [
  { time: '09:00', datetime: '2025-06-26T13:00:00.000Z' },
  { time: '12:00', datetime: '2025-06-26T16:00:00.000Z' },
  { time: '15:00', datetime: '2025-06-26T19:00:00.000Z' }
];

testSlots.forEach(slot => {
  const testSlotStart = new Date(slot.datetime);
  const testSlotEnd = new Date(testSlotStart.getTime() + 15 * 60 * 1000); // +15 minutes
  
  const withinStart = isWithinInterval(testSlotStart, { start: vacationStart, end: vacationEnd });
  const withinEnd = isWithinInterval(testSlotEnd, { start: vacationStart, end: vacationEnd });
  const contains = (testSlotStart <= vacationStart && testSlotEnd >= vacationEnd);
  
  const blocked = withinStart || withinEnd || contains;
  
  console.log(`${slot.time}: ${blocked ? 'BLOCKED' : 'FREE'} (start: ${withinStart}, end: ${withinEnd}, contains: ${contains})`);
});

console.log('\n=== EXPECTED RESULT ===');
console.log('All slots should be BLOCKED because they fall within the vacation period!');
