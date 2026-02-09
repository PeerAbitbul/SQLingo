# Building Desktop App for Local Testing

This guide explains how to build the Electron app to test with your local servers.

## Quick Setup

1. **Copy environment file:**
   ```bash
   cd desktop/frontend
   cp .env.example .env.production.local
   ```

2. **Edit `.env.production.local`** if needed (default points to localhost):
   ```bash
   VITE_SERVER_URL=http://127.0.0.1:8001
   VITE_PORTAL_URL=http://localhost:3001
   ```

3. **Build the app:**
   ```bash
   # For macOS
   npm run electron:build:mac

   # For Windows
   npm run electron:build:win

   # For Linux
   npm run electron:build:linux
   ```

4. **Find your build:**
   - macOS: `desktop/frontend/release/*.dmg`
   - Windows: `desktop/frontend/release/*.exe`
   - Linux: `desktop/frontend/release/*.AppImage`

## Important Notes

- The `.env.production.local` file is **not** committed to git (it's in .gitignore)
- This is for local testing only
- For production builds, the app will use `https://api.qognix.com` and `https://portal.qognix.com`
- Make sure your local servers are running:
  - Backend on http://127.0.0.1:8001
  - Portal on http://localhost:3001

## Testing Authentication Flow

1. Start your local backend:
   ```bash
   cd server/backend
   source venv/bin/activate
   python main.py
   ```

2. Start your local portal:
   ```bash
   cd server/frontend
   npm run dev
   ```

3. Install and run the built Desktop app

4. Click "Sign In" in Settings
   - Your default browser will open to `http://localhost:3001/auth/desktop`
   - Login with your credentials
   - Browser will redirect to `qognix://auth?token=...`
   - Desktop app receives the token
   - Success! ✅

## Troubleshooting

**Issue:** Browser shows "This site can't be reached - portal.qognix.com"
- **Cause:** App was built without `.env.production.local`
- **Fix:** Create `.env.production.local` and rebuild

**Issue:** Authentication doesn't work
- **Cause:** Local servers not running
- **Fix:** Make sure both backend (8001) and portal (3001) are running

**Issue:** Token not received in Desktop app
- **Cause:** Custom protocol not registered
- **Fix:** Make sure you're using the packaged app (not just `npm run dev`)
