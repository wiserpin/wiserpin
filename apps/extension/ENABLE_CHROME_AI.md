# Enable Chrome AI for WiserPin

WiserPin uses Chrome's built-in Prompt API (Gemini Nano) for generating summaries. This runs **100% locally** on your device - no data is sent to external servers.

## Current Status

Based on your Feature Adaptations, **PromptApi is currently disabled**. You need to enable it to use Chrome AI.

## How to Enable Chrome AI

### Step 1: Enable the Prompt API Flag

1. Open a new tab and navigate to:
   ```
   chrome://flags/#optimization-guide-on-device-model
   ```

2. Find the "Optimization Guide On Device Model" flag

3. Change the dropdown to: **"Enabled BypassPerfRequirement"**
   - This bypasses performance requirements for testing

4. You'll see a "Relaunch" button at the bottom - **DO NOT CLICK IT YET**

### Step 2: Enable Prompt API for Gemini Nano

1. In the same flags page, go to:
   ```
   chrome://flags/#prompt-api-for-gemini-nano
   ```

2. Change the dropdown to: **"Enabled"**

### Step 3: Restart Chrome

1. Now click the **"Relaunch"** button that appears at the bottom
2. Chrome will restart with the new settings

### Step 4: Verify It's Working

1. Open a new tab and navigate to:
   ```
   chrome://components/
   ```

2. Look for **"Optimization Guide On Device Model"**
   - If you see it, click "Check for update"
   - Wait for it to download (this may take a few minutes)
   - Status should show version number when ready

3. Check the Feature Adaptations at:
   ```
   chrome://on-device-internals/
   ```
   - **PromptApi** should now show **"Recently Used: true"** after you use WiserPin

## Testing WiserPin

1. Load the WiserPin extension (`apps/extension/dist/`)
2. Navigate to any webpage
3. Click the WiserPin icon
4. Open DevTools (F12) and check the Console
5. Look for these logs:
   ```
   [WiserPin] Checking Chrome AI availability...
   [WiserPin] Chrome AI availability: readily
   [WiserPin] Using Chrome AI summarizer
   [WiserPin] Summary generated: <summary text>
   ```

If you see these logs, Chrome AI is working! The summary will appear in the WiserPin popup.

## What If It Still Doesn't Work?

### Option 1: Use Chrome Canary or Dev

Chrome AI features are experimental and may work better in:
- **Chrome Canary**: https://www.google.com/chrome/canary/
- **Chrome Dev**: https://www.google.com/chrome/dev/

### Option 2: Check System Requirements

Make sure you have:
- Chrome 128 or later
- At least 22GB of free disk space (for Gemini Nano model)
- Supported operating system:
  - Windows 10+
  - macOS 13+
  - Linux (recent distributions)

### Option 3: Check the Console

If Chrome AI is not available, WiserPin will show:
- A warning message in the popup
- Instructions on how to enable it
- Console logs explaining what went wrong

## Troubleshooting

### "Chrome AI is not available" Error

This means the Prompt API is not enabled or ready. Follow the steps above to enable it.

### Model Download Takes Too Long

The Gemini Nano model download may take some time on slower connections:
- Be patient (it may take 10-30 minutes)
- Keep Chrome open while downloading
- Check chrome://components/ for download progress

### PromptApi Shows "false" in Feature Adaptations

This is normal before first use. After you:
1. Enable the flags
2. Restart Chrome
3. Use WiserPin once

The PromptApi should show "Recently Used: true"

## Privacy & Security

- ✅ **100% Local Processing** - All AI runs on your device
- ✅ **No External API Calls** - No data sent to servers
- ✅ **No Tracking** - WiserPin doesn't track your usage
- ✅ **Offline Capable** - Works without internet (after model download)

## Need Help?

If you're still having issues, please file an issue with:
- Your Chrome version (`chrome://version/`)
- Your operating system
- Screenshot of `chrome://on-device-internals/`
- Console logs from WiserPin
