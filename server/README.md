# Signature Count Server

This Node.js server fetches a value from a Google Sheet, caches it, and exposes it via a simple API endpoint. It is designed to be deployed as a lightweight, resilient service.

## Features

-   **Google Sheets API Proxy:** Fetches data from the Google Sheets API to avoid exposing credentials on the client-side.
-   **On-Disk Caching:** Caches the fetched value to a local file, allowing the server to restart without losing the last known value.
-   **Resilient Polling:** Uses exponential backoff with jitter to handle failures when polling the Google Sheets API.
-   **Monitoring Hook:** Includes a `logErrorForMonitoring()` function to easily integrate with production monitoring and alerting services.

## How to Run Locally

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Set Environment Variables:**
    Create a `.env` file in the `server` directory or set the following environment variables in your shell:

    *   `GOOGLE_API_KEY`: Your Google Sheets API key.
    *   `PORT` (optional): The port to run the server on. Defaults to `3000`.
    *   `GOOGLE_API_POLL_INTERVAL` (optional): The interval in milliseconds to poll the Google Sheets API. Defaults to `60000` (60 seconds).

3.  **Start the Server:**
    ```bash
    node index.js
    ```
    Or, with the API key directly:
    ```bash
    GOOGLE_API_KEY="YOUR_API_KEY" node index.js
    ```

## API Endpoint

-   **`GET /api/data`**

    Returns the cached value from the Google Sheet.

    **Success Response (200):**
    ```json
    {
      "value": 12345,
      "timestamp": "2025-07-30T12:00:00.000Z"
    }
    ```

    **Error Response (404):**
    (If the cache is still warming up)
    ```json
    {
      "error": "Cache is warming up. Please try again shortly."
    }
    ```

## Deployment

This server is ready to be deployed to services like Fly.io or Heroku. See the deployment documentation for your chosen provider.
