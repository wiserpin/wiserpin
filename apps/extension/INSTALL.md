# WiserPin Chrome Extension - Installation Guide

## Prerequisites

- Chrome 128 or later (for Chrome AI/Gemini Nano support)
- At least 22GB of free storage (for Gemini Nano model)

## Installation Steps

1. **Build the extension** (if not already built):
   ```bash
   pnpm --filter @wiserpin/extension build
   ```

2. **Load the extension in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in the top-right corner)
   - Click "Load unpacked"
   - Navigate to: `apps/extension/dist`
   - Click "Select" to load the extension

3. **Pin the extension**:
   - Click the puzzle piece icon in Chrome's toolbar
   - Find "WiserPin" and click the pin icon to keep it visible

## First Time Setup

When you first open WiserPin:

1. **Chrome AI Download** (if needed):
   - If Chrome AI (Gemini Nano) is not installed, you'll see a download page
   - Click "Start Download" to begin downloading the model
   - Wait for the download to complete (progress bar will show status)
   - Once complete, click "Continue to WiserPin"

2. **Create Your First Collection**:
   - Click the collections icon in the header
   - Click "Create New Collection"
   - Give it a name and color
   - Start pinning pages!

## Using WiserPin

1. **Navigate to any webpage** you want to save
2. **Click the WiserPin extension icon**
3. **Wait for AI summary** - Chrome AI will automatically generate a summary of the page
4. **Select a collection** to save to
5. **Click "Save to Collection"**

The page will be saved with:
- URL and title
- Open Graph image (if available)
- AI-generated summary
- Timestamp

## Features

- ⚡ **Local AI Processing** - Summaries generated entirely in your browser
- 🔒 **Privacy First** - No data sent to external servers
- 📁 **Collections** - Organize your saved pages
- 🎨 **Beautiful UI** - Modern, responsive design with dark mode support
- 🚀 **Fast** - Instant access to your saved content

## Troubleshooting

### Chrome AI Not Available

Make sure you have:
- Chrome 128 or later
- Enabled Chrome AI features (may require Chrome Canary/Dev channel)
- At least 22GB of free disk space
- A stable internet connection for the initial download

### Extension Not Working

- Check that the extension is enabled in `chrome://extensions/`
- Try reloading the extension
- Check the browser console for errors (F12 → Console tab)

## Development

To make changes and reload:

1. Make your code changes
2. Run `pnpm --filter @wiserpin/extension build`
3. Go to `chrome://extensions/`
4. Click the reload icon on the WiserPin extension

## Support

For issues or feature requests, please file an issue on GitHub.
