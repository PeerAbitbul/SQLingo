# SQLingo Enterprise Edition - Future Roadmap

*This document outlines the architectural plan for transitioning SQLingo from a Single-User Local Desktop Application (Current State) to an Enterprise Multi-User Web Application.*

## The "Dual Deployment" Vision
The core codebase (React Frontend + FastAPI Backend) remains identical. The application will be packaged and deployed in two different ways depending on the target audience:

1. **Local Desktop Edition (Current Phase)**
   - **Database**: Local `SQLite` database on the user's machine.
   - **Auth**: No login required (`local_admin` mode).
   - **Packaging**: Built into a `.exe` / `.dmg` via Electron-Builder.
   - **Target**: Individual developers, local testing, open-source community.

2. **Enterprise Team Edition (Future Phase)**
   - **Database**: Central `PostgreSQL` server on the company network.
   - **Auth**: Single Sign-On (Google Workspace / Microsoft Entra ID).
   - **Packaging**: Deployed via Docker/Kubernetes (Web Server + FastAPI Server + DB Server).
   - **Target**: Orgs needing centralized connection managing, audit logs, and collaboration.

---

## Technical Roadmap (What needs to be built later)

### 1. Storage Abstraction (Dependency Injection)
- Define a base `Storage` class interface.
- Implement `SQLiteStorage` (already exists).
- Implement `PostgresStorage` for the Enterprise mode.
- Use an environment variable (e.g., `DEPLOYMENT_MODE=team`) to swap the storage engine at startup.

### 2. Role-Based Access Control (RBAC) & SSO
- Implement a login screen on the React Frontend when in Team mode.
- Generate and validate JWT tokens in FastAPI.
- Admins (IT) manage database connections; Regular users can only query but cannot view connection strings or passwords.

### 3. Centralized Knowledge Base & Collaboration
- **Shared Favorites**: When a user saves a useful SQL query (Query Favorites), they can toggle "Share with Team".
- **Shared AI Memory**: When the AI learns an implicit mapping in the schema (e.g., "Status 3 means Cancelled"), this memory is saved to the central Postgres DB, making the AI smarter for all users in the organization automatically.

### 4. Audit Logging
- To pass internal security compliance, add a `query_audit_logs` table.
- Log every SQL query executed by the AI on behalf of a user (Who, What Query, When), restricted to Admin viewing.

### 5. Web/Desktop UI Adaptation
- The current UI is optimized as a compact side-panel.
- Add responsive CSS (Media Queries) so that when loaded in a full-width Chrome browser, the interface expands:
  - e.g., A Split-Screen view: Chat on the left, full-screen Data results and interactive Dashboards/Charts on the right.
