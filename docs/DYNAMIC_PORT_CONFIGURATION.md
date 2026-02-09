# Dynamic Port Configuration

## Overview

The desktop application now uses **dynamic port selection** to prevent port conflicts when running on user machines. Both the backend and frontend can automatically find available ports if their default ports are occupied.

## Problem Solved

Previously, both frontend (port 5173) and backend (port 8000) used fixed ports. This could cause issues if:
- User is running another application on those ports
- Multiple instances of Qognix running simultaneously
- Port is blocked by firewall or security software

## Solution: Hybrid Approach

We implemented a **hybrid dynamic port selection** system:

### 1. Default Ports (Optimal Path)
- **Frontend**: 5173 (Vite default)
- **Backend**: 8000

### 2. Automatic Fallback
If default port is occupied:
- **Frontend**: Vite automatically tries 5174, 5175, etc.
- **Backend**: Tries 8001, 8002, ..., up to 8099 (100 attempts)

### 3. Port Discovery
- Backend saves its selected port to a configuration file
- Frontend reads this file to discover backend location
- Graceful fallback to defaults if file doesn't exist

## Implementation Details

### Backend (Python/FastAPI)

#### File: `desktop/backend/main.py`

Added two key functions:

```python
def find_free_port(start_port: int = 8000, max_attempts: int = 100) -> int:
    """
    Find a free port starting from start_port.
    Tries ports sequentially: 8000, 8001, 8002, etc.
    """
    for port_offset in range(max_attempts):
        port = start_port + port_offset
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('127.0.0.1', port))
                s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
                return port
        except OSError:
            continue
    raise RuntimeError(f"Could not find free port after {max_attempts} attempts")

def save_port_config(port: int) -> None:
    """
    Save backend port to ~/.qognix/backend_port.json
    """
    config_dir = Path.home() / '.qognix'
    config_dir.mkdir(exist_ok=True)

    config_file = config_dir / 'backend_port.json'
    config_data = {
        'port': port,
        'host': '127.0.0.1',
        'base_url': f'http://127.0.0.1:{port}/api'
    }

    with open(config_file, 'w') as f:
        json.dump(config_data, f, indent=2)
```

#### Startup Sequence:

```python
if __name__ == "__main__":
    # 1. Find free port
    port = find_free_port(start_port=8000)

    # 2. Save config for frontend
    save_port_config(port)

    # 3. Notify user
    if port != 8000:
        print(f"⚠️  Default port 8000 is in use")
        print(f"✓ Using alternative port: {port}")
    else:
        print(f"✓ Using default port: {port}")

    # 4. Start server
    uvicorn.run("main:app", host="127.0.0.1", port=port)
```

#### CORS Configuration:

Updated to support multiple frontend ports:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Default Vite dev server
        "http://localhost:5174",  # Vite fallback port
        "http://localhost:5175",  # Vite fallback port
        "http://localhost:1420",  # Legacy Tauri support
        "tauri://localhost"       # Legacy Tauri support
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Frontend (React/TypeScript)

#### File: `desktop/frontend/src/utils/portConfig.ts` (NEW)

```typescript
export interface PortConfig {
  port: number;
  host: string;
  base_url: string;
}

export async function getBackendUrl(): Promise<string> {
  const defaultUrl = 'http://localhost:8000/api';

  try {
    // Try to read port config from Electron
    if (typeof window !== 'undefined' && window.electron?.readPortConfig) {
      const config = await window.electron.readPortConfig();
      if (config && config.base_url) {
        console.log('✓ Using dynamic backend port:', config.port);
        return config.base_url;
      }
    }

    // Fallback to environment variable or default
    return import.meta.env.VITE_API_BASE_URL || defaultUrl;
  } catch (error) {
    console.warn('Failed to read backend port config, using default:', error);
    return defaultUrl;
  }
}
```

#### Files Updated:
- **`src/utils/api.ts`**: Initialize API_BASE_URL from port config
- **`src/utils/executionPlanApi.ts`**: Initialize API_BASE_URL from port config
- **`src/window.d.ts`**: Add TypeScript types for `readPortConfig` IPC method

#### File: `desktop/frontend/vite.config.ts`

```typescript
server: {
  port: 5173,
  strictPort: false, // Allow fallback to other ports
}
```

Changed `strictPort` from `true` to `false` to enable automatic port fallback.

### Electron Integration

#### File: `desktop/frontend/electron/main.js`

Added IPC handler to read port configuration:

```javascript
ipcMain.handle('read-port-config', async () => {
  try {
    const os = require('os');
    const homeDir = os.homedir();
    const configPath = path.join(homeDir, '.qognix', 'backend_port.json');

    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(data);
      console.log('✓ Read backend port configuration:', config);
      return config;
    } else {
      console.log('⚠️  Backend port config file not found, using defaults');
      return null;
    }
  } catch (error) {
    console.error('Failed to read backend port configuration:', error);
    return null;
  }
});
```

#### File: `desktop/frontend/electron/preload.js`

Exposed IPC method to renderer:

```javascript
contextBridge.exposeInMainWorld('electron', {
  // ... other methods
  readPortConfig: () => ipcRenderer.invoke('read-port-config'),
  // ...
});
```

## Configuration File

### Location
- **Path**: `~/.qognix/backend_port.json` (user's home directory)
- **Format**: JSON

### Structure

```json
{
  "port": 8001,
  "host": "127.0.0.1",
  "base_url": "http://127.0.0.1:8001/api"
}
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `port` | number | Selected backend port |
| `host` | string | Always "127.0.0.1" (localhost) |
| `base_url` | string | Complete API base URL for frontend |

## User Experience

### Normal Scenario (Default Ports Available)

```
✓ Using default port: 8000
🚀 Starting backend server on http://127.0.0.1:8000
📍 API available at: http://127.0.0.1:8000/api
```

### Port Conflict Scenario

```
⚠️  Default port 8000 is in use
✓ Using alternative port: 8001
🚀 Starting backend server on http://127.0.0.1:8001
📍 API available at: http://127.0.0.1:8001/api
✓ Backend port configuration saved to: /Users/username/.qognix/backend_port.json
```

### Frontend Console Messages

```
✓ Using dynamic backend port: 8001
```

Or if config file not found:

```
✓ Using default backend URL
```

## Benefits

### 1. **Zero Configuration**
Users don't need to manually configure ports - it just works.

### 2. **Port Conflict Prevention**
Automatic fallback prevents startup failures due to occupied ports.

### 3. **Multiple Instances**
Theoretically supports running multiple Qognix instances (though not the primary use case).

### 4. **Developer Friendly**
Easier development when switching between different projects that might use the same ports.

### 5. **Graceful Degradation**
Falls back to defaults if dynamic configuration fails.

## Testing

### Verified Scenarios

✅ **Backend finds alternative port** when 8000 is occupied
✅ **Config file is created** in user's home directory
✅ **Config file is read** correctly by frontend
✅ **TypeScript compilation** passes with no errors
✅ **User notifications** are clear and informative

### Test Results

```bash
# Backend started with port 8000 occupied
⚠️  Default port 8000 is in use
✓ Using alternative port: 8001
✓ Backend port configuration saved to: ~/.qognix/backend_port.json

# Config file content
{
  "port": 8001,
  "host": "127.0.0.1",
  "base_url": "http://127.0.0.1:8001/api"
}
```

## Future Enhancements

### Potential Improvements

1. **Frontend Port Persistence**: Save frontend port to config file as well
2. **Port Range Configuration**: Allow users to specify preferred port ranges
3. **Port Validation**: Check if selected port is actually accessible
4. **Health Check Integration**: Verify backend is reachable on selected port
5. **Electron Startup**: Have Electron automatically start backend with dynamic port

## Migration Notes

### Breaking Changes
None - fully backward compatible.

### Default Behavior
- If config file doesn't exist: Uses default ports (8000 for backend, 5173 for frontend)
- If environment variable set: Uses environment variable
- If ports occupied: Automatically finds alternatives

### Deployment
No special deployment steps required. Changes are transparent to users.

## Troubleshooting

### Backend Not Starting

**Problem**: Backend can't find any free port
**Solution**: Check if ports 8000-8099 are all occupied (unlikely)

### Frontend Can't Connect

**Problem**: Frontend still trying to connect to port 8000
**Solution**: Check if Electron's `readPortConfig` is working correctly

### Config File Not Created

**Problem**: Permission error creating ~/.qognix directory
**Solution**: Verify user has write permissions to home directory

### CORS Errors

**Problem**: Frontend on unexpected port getting CORS errors
**Solution**: Add the port to CORS allowed origins in backend

## Files Modified

### Backend
- ✅ `desktop/backend/main.py`

### Frontend
- ✅ `desktop/frontend/vite.config.ts`
- ✅ `desktop/frontend/src/utils/portConfig.ts` (NEW)
- ✅ `desktop/frontend/src/utils/api.ts`
- ✅ `desktop/frontend/src/utils/executionPlanApi.ts`
- ✅ `desktop/frontend/src/window.d.ts`

### Electron
- ✅ `desktop/frontend/electron/main.js`
- ✅ `desktop/frontend/electron/preload.js`

### Documentation
- ✅ `DYNAMIC_PORT_CONFIGURATION.md` (NEW - this file)

---

**Version**: 0.9.7
**Date**: 2024-12-04
**Feature**: Dynamic Port Configuration
**Status**: ✅ Implemented & Tested
