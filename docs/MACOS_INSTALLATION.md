# macOS Installation Guide

## The "Qognix is damaged" Error

When you first try to open Qognix on macOS, you may see this error:

> "Qognix" is damaged and can't be opened. You should move it to the Trash.

**This is NOT because the app is actually damaged.** It's because the app is not code-signed with an Apple Developer certificate (which costs $99/year).

## How to Fix This

### Method 1: Remove Quarantine Attribute (Recommended)

Open Terminal and run:

```bash
xattr -cr /Applications/Qognix.app
```

Then try opening Qognix again.

### Method 2: Allow in System Settings

1. Try to open Qognix (you'll get the error)
2. Click "Cancel"
3. Open **System Settings** > **Privacy & Security**
4. Scroll down to find a message about Qognix
5. Click **"Open Anyway"**
6. Click **"Open"** in the confirmation dialog

### Method 3: Right-Click to Open

1. Right-click (or Control+click) on Qognix.app
2. Select **"Open"** from the menu
3. Click **"Open"** in the dialog

This only needs to be done once. After that, you can open Qognix normally.

## Why Does This Happen?

macOS has a security feature called **Gatekeeper** that blocks apps from unidentified developers. To avoid this:

- Developers need to sign their apps with an **Apple Developer certificate** ($99/year)
- The app needs to be **notarized** by Apple (uploaded to Apple for scanning)

The desktop app itself is free to download and use. While we offer a managed API service for convenience, you can also use it completely free with your own API keys (BYOK mode).

We haven't invested in Apple code signing certificates yet, but the app is safe to use - it's open-source and you can verify the code yourself on GitHub!

## Still Having Issues?

If you're still seeing the error after trying these methods, please:

1. Check that you downloaded from the official GitHub releases page
2. Make sure you've extracted the app from the ZIP file
3. Try moving the app to `/Applications` folder
4. Run this command in Terminal:
   ```bash
   sudo xattr -rd com.apple.quarantine /Applications/Qognix.app
   ```

## For Developers: Code Signing

To build a signed version locally (requires Apple Developer account):

1. Get your signing identity:
   ```bash
   security find-identity -v -p codesigning
   ```

2. Build with signing:
   ```bash
   export CSC_NAME="Your Developer ID"
   npm run electron:build:mac
   ```

3. For notarization, add to `package.json`:
   ```json
   "mac": {
     "hardenedRuntime": true,
     "gatekeeperAssess": false,
     "entitlements": "build/entitlements.mac.plist",
     "entitlementsInherit": "build/entitlements.mac.plist"
   },
   "afterSign": "scripts/notarize.js"
   ```

---

**Need more help?** Open an issue on GitHub: https://github.com/PeerAbitbul/qognix-desktop_without_server/issues
