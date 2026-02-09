# Documentation

Welcome to the Qognix documentation!

---

## 📚 Quick Navigation

### Getting Started
- [Quick Start Guide](QUICK_START.md) - Get up and running in 5 minutes
- [Setup Guide](SETUP_GUIDE.md) - Detailed installation instructions
- [Connection Guide](CONNECTION_GUIDE.md) - How to connect to databases

### Features
- [Execution Plan Analysis](EXECUTION_PLAN_FEATURE.md) - SQL performance insights (Pro tier)
- [Chat Sidebar Feature](CHAT_SIDEBAR_FEATURE.md) - Managing multiple conversations
- [Always on Top Feature](ALWAYS_ON_TOP_FEATURE.md) - Window positioning
- [Schema Upgrade](SCHEMA_UPGRADE.md) - Full schema extraction

### Technical
- [Auth Implementation](AUTH_IMPLEMENTATION.md) - OAuth flow and user authentication
- [Desktop App Architecture](../desktop/README.md) - Desktop application overview
- [Build Guide](BUILD_GUIDE.md) - Building installers

---

## 🔐 How Authentication Works

1. **Login** - User logs in via qognix.com (OAuth)
2. **Tier Validation** - Cloud server checks subscription tier (Free/Pro/Enterprise)
3. **Usage Tracking** - Cloud counts messages per month
4. **AI Calls** - Made locally from desktop app using user's own API keys (BYOK)

**Important:** AI calls are 100% local. The cloud only handles auth and usage counting.

---

## 📖 Full Documentation Index

See [INDEX.md](INDEX.md) for complete documentation listing.

---

## 🆘 Need Help?

1. **Installation issues?** → [Setup Guide](SETUP_GUIDE.md)
2. **Can't connect to database?** → [Connection Guide](CONNECTION_GUIDE.md)
3. **Build problems?** → [Build Guide](BUILD_GUIDE.md)
