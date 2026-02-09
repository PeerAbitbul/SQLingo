# Chat Sidebar Feature

## Overview

Replaced top tabs with a sliding sidebar for better chat management.

---

## Features

### 1. Chat Sidebar (Left Side)
- **Slide Animation** - Smooth slide in/out from left
- **Always Accessible** - Toggle with menu button in header
- **Chat List** - All chats displayed with:
  - Chat title
  - Connection badge (shows which DB)
  - Delete button per chat

### 2. Connection Per Chat
- Each chat **saves its connection**
- When you switch chats, connection auto-updates
- Connection shown in top bar:
  - Connection name
  - Database type
  - "Change" button to select different connection

### 3. New Chat Flow
1. Click menu icon (hamburger) in header
2. Sidebar opens
3. Click "New Chat"
4. Chat created with current active connection
5. Start chatting!

### 4. Chat Persistence
- All chats saved locally
- Each chat remembers:
  - Title
  - Messages
  - Connection ID
  - Creation date

---

## UI Layout

```
┌─────────────────────────────────────────┐
│ [☰] DB Chat    [⚡][🔑][⚙️] [─][□][×]  │ Header
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────┐                          │
│  │ Sidebar  │  Main Chat Area          │
│  │          │                          │
│  │ Chats    │  Connection: My DB (SQL) │
│  │ ├Chat 1  │  ┌────────────────────┐ │
│  │ ├Chat 2  │  │ Messages           │ │
│  │ └Chat 3  │  │                    │ │
│  │          │  └────────────────────┘ │
│  │[+ New]   │  [Type message...] [>] │
│  └──────────┘                          │
│                                         │
└─────────────────────────────────────────┘
```

---

## Components

### ChatSidebar.tsx
- **Location:** Left side, slides in/out
- **Width:** 280px
- **Height:** Full height (minus header)
- **Features:**
  - New Chat button
  - Chat list with badges
  - Delete buttons
  - Active chat highlighting

### ChatWindow.tsx
- **Main container** with sidebar integration
- **Connection Bar** - Shows current chat's connection
- **Dynamic margin** - Adjusts when sidebar opens
- **Chat area** - Messages + Input

### ChatHeader.tsx
- **Menu button** - Toggle sidebar
- **Connection icon** - Open connection manager
- **API Keys icon** - Manage API keys
- **Settings icon** - App settings
- **Window controls** - Minimize, Maximize, Close

---

## Data Flow

### Creating a Chat
```
User clicks "New Chat"
    ↓
Check if connection selected
    ↓
Create chat with:
  - Unique ID
  - Title: "Chat N"
  - connectionId: activeConnection
  - messages: []
    ↓
Add to store
    ↓
Set as active chat
```

### Switching Chats
```
User clicks chat in sidebar
    ↓
Set as active chat
    ↓
Load chat's connectionId
    ↓
Update active connection
    ↓
Display chat messages
    ↓
Ready to chat!
```

### Changing Connection
```
User clicks "Change" button
    ↓
Open Connection Manager
    ↓
User selects/creates connection
    ↓
Update current chat's connectionId
    ↓
Connection bar updates
    ↓
Ready to query new DB!
```

---

## State Management

### Chat Store (chatStore.ts)
```typescript
interface Chat {
  id: string;
  title: string;
  connectionId?: string;  // Saves connection!
  messages: Message[];
  createdAt: Date;
}
```

### Connection Store (connectionStore.ts)
```typescript
interface Connection {
  id: string;
  name: string;
  databaseType: 'sqlserver' | 'postgresql' | 'mysql';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  createdAt: Date;
}
```

---

## User Experience

### Opening Sidebar
- Click menu icon (☰) in header
- Sidebar slides in from left
- Main content shifts right
- Smooth 0.3s animation

### Closing Sidebar
- Click menu icon again
- Sidebar slides out to left
- Main content expands
- Smooth 0.3s animation

### Creating Chat
1. Open sidebar
2. Click "+ New Chat"
3. Chat appears in list
4. Automatically selected
5. Sidebar stays open

### Deleting Chat
1. Hover over chat
2. Click trash icon
3. Confirm deletion
4. Chat removed
5. If was active, no chat selected

---

## Styling

### Sidebar
- Background: Surface color
- Border: Right border (1px)
- Shadow: None (integrated design)
- Z-index: 100 (below modals)

### Chat Items
- **Normal:** Background color
- **Active:** Primary color (20% opacity)
- **Hover:** Surface color
- **Border:** Primary color when active

### Connection Badge
- Background: Primary (40% opacity)
- Color: Primary
- Border-radius: Small
- Font-size: 11px

---

## Keyboard Shortcuts (Future)

- `Ctrl/Cmd + B` - Toggle sidebar
- `Ctrl/Cmd + N` - New chat
- `Ctrl/Cmd + W` - Close current chat
- `Ctrl/Cmd + [1-9]` - Switch to chat N

---

## Mobile Considerations (Future)

- Sidebar overlay on small screens
- Swipe to open/close
- Full-width sidebar on mobile
- Touch-friendly buttons

---

## Accessibility

- Keyboard navigation
- Screen reader support
- Focus management
- ARIA labels

---

## Performance

- Virtualized chat list (if > 100 chats)
- Lazy load messages
- Debounced search (future)
- Optimized re-renders

---

## Future Enhancements

1. **Chat Search** - Find chats by name/content
2. **Chat Folders** - Organize chats by project
3. **Chat Export** - Export chat history
4. **Chat Sharing** - Share queries with team
5. **Chat Templates** - Pre-defined query templates
6. **Pinned Chats** - Pin important chats to top
7. **Chat Colors** - Color-code chats
8. **Rename Chat** - Edit chat title inline

---

**Chat management made simple and intuitive!**

