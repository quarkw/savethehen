
const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const CACHE_DIR = path.join(__dirname, 'cache');
const CACHE_FILE = path.join(CACHE_DIR, 'data.json');
const GOOGLE_API_POLL_INTERVAL = process.env.GOOGLE_API_POLL_INTERVAL || 60000; // Default to 60 seconds

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
  // Start the background polling
  pollGoogleSheets();
});

async function pollGoogleSheets() {
    console.log('Polling Google Sheets API...');
    // In a real implementation, you would fetch from the Google Sheets API here.
    // For this example, we'll just write a dummy value to the cache file.
    const dummyData = {
        value: Math.floor(Math.random() * 1000),
        timestamp: new Date().toISOString()
    };

    try {
        await fs.writeFile(CACHE_FILE, JSON.stringify(dummyData, null, 2));
        console.log('Successfully updated cache.');
    } catch (error) {
        console.error('Failed to write to cache:', error);
    }

    setTimeout(pollGoogleSheets, GOOGLE_API_POLL_INTERVAL);
}
