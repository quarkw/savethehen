const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { google } = require('googleapis');
const cors = require('cors');

const app = express();
app.use(cors()); // Enable CORS for all routes

const port = process.env.PORT || 3000;
const CACHE_DIR = path.join(__dirname, 'cache');
const CACHE_FILE = path.join(CACHE_DIR, 'data.json');

// --- Configuration ---
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const RANGE = 'Stats!A2:C';
const GOOGLE_CREDENTIALS_JSON = process.env.GOOGLE_CREDENTIALS_JSON;
const GOOGLE_API_POLL_INTERVAL = process.env.GOOGLE_API_POLL_INTERVAL || 60000;
const MAX_BACKOFF = 32000; // 32 seconds

const options = {
  SPREADSHEET_ID,
  RANGE,
  GOOGLE_CREDENTIALS_JSON,
  GOOGLE_API_POLL_INTERVAL,
  MAX_BACKOFF,
}

console.log({options});

let counts = {};
let timestamp = null;

let retryCount = 0;

// --- Helper Functions ---

function logErrorForMonitoring(error) {
  // In a real production environment, you would integrate with a monitoring service (e.g., Sentry, Datadog).
  console.error("MONITORING_ALERT: ", error.toString());
  if (error.response) {
    console.error("Response data: ", error.response.data);
    console.error("Response status: ", error.response.status);
  }
}

function getRandomJitter(maxMs = 1000) {
  return Math.floor(Math.random() * maxMs);
}

function getRetryDelay() {
  const baseDelay = Math.pow(2, retryCount) * 1000;
  const jitter = getRandomJitter(1000);
  return Math.min(baseDelay + jitter, MAX_BACKOFF);
}


// --- Express App ---

// Ensure cache directory exists
fs.mkdir(CACHE_DIR, { recursive: true });

app.get('/api/data', async (req, res) => {
  try {
    let attempts = 0;
    const maxAttempts = 10;
    const delay = 100; // 100ms between attempts, up to 1 second total

    while (Object.keys(counts).length === 0 && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, delay));
      attempts++;
    }

    const data = {
      total: Object.values(counts).reduce((acc, count) => acc + count, 0),
      timestamp,
    }
    res.json(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({ error: 'Cache is warming up. Please try again shortly.' });
    } else {
      res.status(500).json({ error: 'Failed to read from cache.' });
    }
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  if (!GOOGLE_CREDENTIALS_JSON) {
    console.error("FATAL: GOOGLE_CREDENTIALS_JSON environment variable is not set.");
    process.exit(1);
  }
   if (!SPREADSHEET_ID) {
    console.error("FATAL: SPREADSHEET_ID environment variable is not set.");
    process.exit(1);
  }
  // Start the background polling
  pollGoogleSheets();
});


// --- Google Sheets Polling ---

async function getGoogleSheetsClient() {
  const credentials = JSON.parse(GOOGLE_CREDENTIALS_JSON);
  const auth = new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    ['https://www.googleapis.com/auth/spreadsheets.readonly']
  );
  return google.sheets({ version: 'v4', auth });
}


async function pollGoogleSheets() {
  console.log('Polling Google Sheets API with service account...');

  try {
    const sheets = await getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: RANGE,
    });

    if (response.data.values && response.data.values.length > 0) {
      // Destructure the first row of data (which corresponds to A2:C2)
      const tempCounts = [changeOrgCount, googleFormCount, paperCount] = response.data.values[0].map(value => parseInt(String(value).replace(/,/g, '').trim(), 10));

      // Validate that all counts are valid numbers
      for (let i = 0; i < tempCounts.length; i++) {
        if (typeof tempCounts[i] !== 'number' || isNaN(tempCounts[i])) {
          throw new Error(`Invalid count value for ${i}: ${tempCounts[i]}`);
        }
      }

      counts = {
        changeOrgCount,
        googleFormCount,
        paperCount,
      };
      timestamp = new Date().toISOString();

      const dataToCache = {
        counts,
        timestamp
      };

      await fs.writeFile(CACHE_FILE, JSON.stringify(dataToCache, null, 2));
      console.log('Successfully updated cache with counts:', dataToCache.counts);
    } else {
      const cache = await fs.readFile(CACHE_FILE, 'utf8');
      const parsedCache = JSON.parse(cache);
      counts = parsedCache.counts;
      timestamp = parsedCache.timestamp;
      console.log("Received no values from Google Sheets. Keeping previous total.");
    }


    retryCount = 0;
    setTimeout(pollGoogleSheets, GOOGLE_API_POLL_INTERVAL);

  } catch (error) {
    logErrorForMonitoring(error);
    retryCount++;
    const retryDelay = getRetryDelay();
    console.log(`Retrying in ${retryDelay}ms...`);
    setTimeout(pollGoogleSheets, retryDelay);
  }
}
