# Google Sheet Cell Viewer

This project displays the value of a single cell from a Google Sheet and can trigger confetti celebrations based on that value. It includes a Node.js server to proxy requests to the Google Sheets API, cache results, and provide a fallback mechanism for the client.

## Frontend (`index.html`)

The `index.html` file is a static webpage that can be opened directly in a browser. It fetches the signature count from the Node.js server and displays it. If the server is unavailable, it will fall back to fetching the data directly from the Google Sheets API.

### How to Use

1.  **Open `index.html` in your browser.**
2.  **Add the following query parameters to the URL:**

    *   `serverPollInterval` (optional): The interval in milliseconds to poll the Node.js server. Defaults to `5000` (5 seconds).
    *   `fallbackPollInterval` (optional): The minimum interval in milliseconds to poll the Google Sheets API directly if the server is down. Defaults to `60000` (60 seconds).
    *   `apiKey` (optional): Your Google Sheets API key. This is only used for the fallback mechanism if the server is down. The primary API key is stored on the server.
    *   `smallCelebrationInterval` (optional): The interval at which to trigger a small confetti celebration. For example, if you set this to `100`, a celebration will occur when the cell value passes 100, 200, 300, etc. Defaults to `100`.
    *   `bigCelebrationCount` (optional): The number at which to trigger a big, one-time confetti and fireworks celebration. Defaults to `10000`.
    *   `title` (optional): A custom title to display on the page.
    *   `countAffix` (optional): A string to append to the count (e.g., " Signatures").
    *   `showTitle` (optional): Set to `false` to hide the main title text.

    **Example URL:**
    ```
    file:///path/to/project/index.html?serverPollInterval=2000&fallbackPollInterval=30000
    ```

## Server (`server/`)

The Node.js server acts as a proxy and cache for the Google Sheets API. See the `server/README.md` for details on how to run and deploy it.