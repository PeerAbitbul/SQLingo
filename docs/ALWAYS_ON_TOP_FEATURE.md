# Always on Top Feature

## Overview

Users can now control whether the application window stays on top of other windows.

---

## How It Works

### Default Behavior
- **Default:** Enabled (window stays on top)
- **Reason:** DB Chat is designed as a floating assistant
- **Can be changed:** Yes, in Settings

### User Control
1. Open Settings (gear icon in header)
2. Go to "Appearance" section
3. Toggle "Always on Top"
4. Setting applies immediately
5. Saved automatically

---

## Technical Implementation

### Frontend (Settings.tsx)

**Toggle UI:**
```typescript
<Toggle
  $active={alwaysOnTop}
  onClick={() => setAlwaysOnTop(!alwaysOnTop)}
/>
```

**Effect Hook:**
```typescript
useEffect(() => {
  if (window.electron) {
    window.electron.setAlwaysOnTop(alwaysOnTop);
  }
}, [alwaysOnTop]);
```

### Electron Main Process (main.js)

**On Startup:**
```javascript
function loadSettings() {
  // Read from userData/settings.json
  // Default: { alwaysOnTop: true }
}

function createWindow() {
  const settings = loadSettings();
  mainWindow = new BrowserWindow({
    alwaysOnTop: settings.alwaysOnTop !== false,
    // ... other options
  });
}
```

**IPC Handler:**
```javascript
ipcMain.handle('set-always-on-top', (event, flag) => {
  mainWindow.setAlwaysOnTop(flag);
  // Save to settings.json
});
```

### Preload Script (preload.js)

**Exposed API:**
```javascript
contextBridge.exposeInMainWorld('electron', {
  setAlwaysOnTop: (flag) => ipcRenderer.invoke('set-always-on-top', flag),
  // ... other methods
});
```

---

## Settings Storage

### Location
- **macOS:** `~/Library/Application Support/DB Chat/settings.json`
- **Windows:** `%APPDATA%/DB Chat/settings.json`
- **Linux:** `~/.config/DB Chat/settings.json`

### Format
```json
{
  "alwaysOnTop": true
}
```

### Persistence
- Saved immediately when changed
- Loaded on app startup
- Survives app restart

---

## User Experience

### Enabling Always on Top
1. User toggles ON in Settings
2. Setting saved to store (Zustand)
3. Effect hook triggers
4. Calls `window.electron.setAlwaysOnTop(true)`
5. IPC message sent to main process
6. Window set to always on top
7. Setting saved to file
8. Window stays above all other windows

### Disabling Always on Top
1. User toggles OFF in Settings
2. Setting saved to store
3. Effect hook triggers
4. Calls `window.electron.setAlwaysOnTop(false)`
5. IPC message sent to main process
6. Window set to normal behavior
7. Setting saved to file
8. Window can be covered by other windows

---

## Use Cases

### When to Enable (Default)
- Using as a floating assistant
- Quick database queries while working
- Reference while coding
- Side-by-side with IDE
- Always accessible

### When to Disable
- Full-screen work
- Presentation mode
- Screen recording
- Video calls
- Distraction-free coding
- Multiple monitors (not needed)

---

## UI Design

### Settings Panel

```
┌─────────────────────────────────────┐
│ Settings                         × │
├─────────────────────────────────────┤
│                                     │
│ Appearance                          │
│ ├─ Theme                 [Dark ▼]  │
│ └─ Always on Top         [● ON  ]  │
│    Keep window above other apps     │
│                                     │
│ AI Settings                         │
│ └─ Default AI Provider  [Claude ▼] │
│                                     │
└─────────────────────────────────────┘
```

### Toggle States

**ON (Enabled):**
```
[●────]  Blue background, circle on right
```

**OFF (Disabled):**
```
[────○]  Gray background, circle on left
```

---

## Edge Cases

### App Restart
- Setting persists
- Window opens with saved preference
- No user action needed

### Multiple Windows (Future)
- Each window can have own setting
- Or global setting for all windows

### System Override
- Some OS features may override
- Full-screen apps always on top
- System dialogs always on top

---

## Accessibility

### Keyboard
- Tab to toggle
- Space/Enter to activate
- Screen reader announces state

### Visual
- Clear ON/OFF indication
- Color + position change
- Tooltip on hover

---

## Performance

### Impact
- Minimal CPU usage
- No memory overhead
- Instant toggle response
- No lag or delay

### File I/O
- Settings saved asynchronously
- Non-blocking operation
- Error handling included

---

## Future Enhancements

1. **Hotkey Toggle** - `Ctrl/Cmd + T` to toggle
2. **Auto-disable** - When in full-screen
3. **Per-workspace** - Different settings per project
4. **Opacity Control** - Adjust window transparency
5. **Smart Toggle** - Auto-disable during presentations

---

## Troubleshooting

### Setting Not Saving
**Problem:** Toggle works but doesn't persist

**Solution:**
1. Check file permissions
2. Check userData path exists
3. Look for errors in console
4. Try deleting settings.json

### Window Not Staying on Top
**Problem:** Enabled but window goes behind

**Solution:**
1. Restart app
2. Check OS permissions
3. Try toggling OFF then ON
4. Check for conflicting apps

### Can't Disable
**Problem:** Toggle doesn't work

**Solution:**
1. Check Electron IPC connection
2. Open DevTools (F12)
3. Look for errors
4. Restart app

---

## Testing

### Manual Test Cases

1. **Enable on Fresh Install**
   - Install app
   - Should be ON by default
   - Window stays on top

2. **Toggle OFF**
   - Open Settings
   - Toggle OFF
   - Window goes behind other apps

3. **Toggle ON**
   - Toggle back ON
   - Window comes to front
   - Stays on top

4. **Persistence**
   - Toggle OFF
   - Close app
   - Reopen app
   - Should still be OFF

5. **Multiple Toggles**
   - Toggle ON/OFF/ON/OFF rapidly
   - Should work smoothly
   - No lag or errors

---

## Code Locations

- **Settings UI:** `src/components/Settings.tsx`
- **Settings Store:** `src/stores/settingsStore.ts`
- **Electron Main:** `electron/main.js`
- **Electron Preload:** `electron/preload.js`
- **Settings File:** `userData/settings.json`

---

**Feature Status:** Implemented and Working
**User Impact:** High (commonly requested feature)
**Complexity:** Low
**Maintenance:** Minimal

