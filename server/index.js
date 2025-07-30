const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;
const CACHE_DIR = path.join(__dirname, 'cache');
const CACHE_FILE = path.join(CACHE_DIR, 'data.json');

// --- Configuration ---
const SPREADSHEET_ID = '1TowJS-Jm8i3lxhNwd1V5noBGfY_C7b96x7Jc8NqzoDY';
const RANGE = 'A1';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_API_POLL_INTERVAL = process.env.GOOGLE_API_POLL_INTERVAL || 60000; // Default to 60 seconds
const MAX_BACKOFF = 32000; // 32 seconds

let retryCount = 0;

// --- Helper Functions ---

function logErrorForMonitoring(error) {
  // In a real production environment, you would integrate with a monitoring service (e.g., Sentry, Datadog).
  console.error("MONITORING_ALERT: ", error.message);
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
    const data = await fs.readFile(CACHE_FILE, 'utf8');
    res.json(JSON.parse(data));
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
  if (!GOOGLE_API_KEY) {
    console.error("FATAL: GOOGLE_API_KEY environment variable is not set.");
    process.exit(1);
  }
  // Start the background polling
  pollGoogleSheets();
});


// --- Google Sheets Polling ---

async function pollGoogleSheets() {
  console.log('Polling Google Sheets API...');
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${RANGE}?key=${GOOGLE_API_KEY}`;

  try {
    const response = await axios.get(url);
    const value = response.data.values ? response.data.values[0][0] : 'N/A';
    
    const dataToCache = {
      value: parseInt(value.replace(/,/g, ''), 10),
      timestamp: new Date().toISOString()
    };

    await fs.writeFile(CACHE_FILE, JSON.stringify(dataToCache, null, 2));
    console.log('Successfully updated cache with value:', dataToCache.value);
    
    // Reset retry count on success
    retryCount = 0;
    setTimeout(pollGoogleSheets, GOOGLE_API_POLL_INTERVAL);

  } catch (error) {
    logErrorForMonitoring(error);
    
    // Increment retry count and use exponential backoff
    retryCount++;
    const retryDelay = getRetryDelay();
    console.log(`Retrying in ${retryDelay}ms...`);
    setTimeout(pollGoogleSheets, retryDelay);
  }
}