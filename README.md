# Kessy Clean Website + Google Sheets Backend

This project now includes a backend API that receives booking form submissions and writes them into a Google Sheet.

## 1) Google setup

1. Create a Google Cloud project.
2. Enable the **Google Sheets API**.
3. Create a **Service Account**.
4. Create a private key for that service account (JSON key).
5. Create your Google Sheet with a tab named **Bookings**.
6. Share the Google Sheet with the service account email (Editor access).

Recommended columns in `Bookings` tab:

- A: Created At (ISO)
- B: Name
- C: Email
- D: Phone
- E: Address
- F: Preferred Date
- G: Preferred Time
- H: Hours
- I: Notes
- J: Estimated Cost

## 2) Configure environment variables

Copy `.env.example` to `.env` and fill real values:

```bash
cp .env.example .env
```

- `GOOGLE_SHEETS_ID`: Spreadsheet ID from your sheet URL
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: service account email
- `GOOGLE_PRIVATE_KEY`: private key string (keep `\n` line breaks)

## 3) Run locally

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## API

- `POST /api/bookings` writes one booking row to `Bookings!A:J`
- `GET /api/health` health check
