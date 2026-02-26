require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const REQUIRED_ENV_VARS = [
  'GOOGLE_SHEETS_ID',
  'GOOGLE_SERVICE_ACCOUNT_EMAIL',
  'GOOGLE_PRIVATE_KEY'
];

const getMissingEnvVars = () => REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

const getSheetsClient = () => {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  return google.sheets({ version: 'v4', auth });
};

const validateBooking = (booking) => {
  const requiredFields = ['name', 'email', 'phone', 'address', 'date', 'time', 'hours'];
  const missingFields = requiredFields.filter((field) => !booking[field]);

  if (missingFields.length > 0) {
    return { ok: false, message: `Missing required fields: ${missingFields.join(', ')}` };
  }

  const hours = Number(booking.hours);
  if (Number.isNaN(hours) || hours <= 0) {
    return { ok: false, message: 'Hours must be a positive number.' };
  }

  return { ok: true, hours };
};

app.post('/api/bookings', async (req, res) => {
  const missingEnv = getMissingEnvVars();
  if (missingEnv.length > 0) {
    return res.status(500).json({
      error: 'Server is not configured for Google Sheets.',
      details: `Missing environment variables: ${missingEnv.join(', ')}`
    });
  }

  const booking = req.body;
  const validation = validateBooking(booking);

  if (!validation.ok) {
    return res.status(400).json({ error: validation.message });
  }

  const estimatedCost = (validation.hours * 12).toFixed(2);
  const createdAt = new Date().toISOString();

  const values = [
    [
      createdAt,
      booking.name,
      booking.email,
      booking.phone,
      booking.address,
      booking.date,
      booking.time,
      validation.hours,
      booking.notes || '',
      estimatedCost
    ]
  ];

  try {
    const sheets = getSheetsClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'Bookings!A:J',
      valueInputOption: 'RAW',
      requestBody: { values }
    });

    return res.status(201).json({
      message: 'Booking request saved to Google Sheets.',
      estimatedCost
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to write booking to Google Sheets.',
      details: error.message
    });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
