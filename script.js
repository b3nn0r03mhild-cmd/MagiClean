const form = document.querySelector('#booking-form');
const message = document.querySelector('#form-message');
const bookingList = document.querySelector('#booking-list');
const STORAGE_KEY = 'kessy-clean-bookings';

const getBookings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveBookings = (bookings) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
};

const renderBookings = () => {
  const bookings = getBookings();
  bookingList.innerHTML = '';

  if (bookings.length === 0) {
    bookingList.innerHTML = '<li>No requests sent yet.</li>';
    return;
  }

  bookings.forEach((booking) => {
    const item = document.createElement('li');
    item.textContent = `${booking.date} at ${booking.time} · ${booking.name} · ${booking.hours}h · Estimated $${booking.estimatedCost}`;
    bookingList.appendChild(item);
  });
};

const isPastDate = (dateValue) => {
  const selected = new Date(`${dateValue}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selected < today;
};

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.className = 'form-message';

  const formData = new FormData(form);
  const booking = Object.fromEntries(formData.entries());

  const requiredFields = ['name', 'email', 'phone', 'address', 'date', 'time', 'hours'];
  const hasMissing = requiredFields.some((field) => !booking[field]);

  if (hasMissing) {
    message.textContent = 'Please complete all required fields.';
    message.classList.add('error');
    return;
  }

  if (isPastDate(booking.date)) {
    message.textContent = 'Please choose a future date.';
    message.classList.add('error');
    return;
  }

  const hours = Number(booking.hours);
  if (Number.isNaN(hours) || hours <= 0) {
    message.textContent = 'Please enter a valid number of hours.';
    message.classList.add('error');
    return;
  }

  booking.hours = hours;

  try {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(booking)
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || payload.details || 'Failed to submit booking request.');
    }

    booking.estimatedCost = payload.estimatedCost;

    const bookings = getBookings();
    bookings.push(booking);
    saveBookings(bookings);
    renderBookings();

    message.textContent = `Thanks ${booking.name}! Your request was sent and saved in Google Sheets. Estimated total: $${booking.estimatedCost}.`;
    message.classList.add('success');
    form.reset();
  } catch (error) {
    message.textContent = error.message;
    message.classList.add('error');
  }
});

renderBookings();
