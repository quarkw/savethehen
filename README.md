# Google Sheet Cell Viewer

This webpage displays the value of a single cell from a Google Sheet. It can also trigger confetti celebrations based on the cell's value.

## How to Use

1.  **Enable the Google Sheets API:**
    *   Go to the [Google Cloud Console](https://console.cloud.google.com/).
    *   Create a new project.
    *   Enable the "Google Sheets API" for your project.
    *   Create an API key.

2.  **Share your Google Sheet:**
    *   Open your Google Sheet.
    *   Click the "Share" button.
    *   Change the general access to "Anyone with the link".

3.  **Configure `index.html`:**
    *   Open the `index.html` file.
    *   Find the following lines of code:
        ```javascript
        const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // <-- IMPORTANT: Change this
        const RANGE = 'Sheet1!A1'; // <-- IMPORTANT: Change this
        ```
    *   Replace `YOUR_SPREADSHEET_ID` with your Google Sheet ID (from the URL).
    *   Replace `Sheet1!A1` with the range of the cell you want to display.

4.  **Open the webpage in your browser:**
    *   Open the `index.html` file in your web browser.
    *   Add the following query parameters to the URL:
        *   `apiKey`: Your Google Sheets API key.
        *   `smallCelebrationCount` (optional): The number at which to trigger a small confetti celebration. For example, if you set this to `100`, a celebration will occur when the cell value is 100, 200, 300, etc.
        *   `bigCelebrationCount` (optional): The number at which to trigger a big confetti celebration. Defaults to `10000`.

    *   **Example URL:**
        ```
        file:///path/to/your/project/index.html?apiKey=YOUR_API_KEY&smallCelebrationCount=100&bigCelebrationCount=1000
        ```

## How it Works

The webpage uses the [Google Sheets API](https://developers.google.com/sheets/api) to fetch the value of the specified cell. It then displays the value on the page.

The confetti celebrations are created using the [confetti.js](https://confetti.js.org/) library.
