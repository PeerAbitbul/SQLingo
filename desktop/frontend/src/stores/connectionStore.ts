import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Connection {
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

export interface ConnectionLimitError {
  type: 'connection_limit';
  message: string;
  currentCount: number;
  limit: number;
}

interface ConnectionState {
  connections: Connection[];
  activeConnection: string | null;
  lastError: ConnectionLimitError | null;
  addConnection: (connection: Connection) => boolean;  // Returns false if limit reached
  removeConnection: (id: string) => void;
  updateConnection: (id: string, connection: Partial<Connection>) => void;
  setActiveConnection: (id: string | null) => void;
  getConnection: (id: string) => Connection | undefined;
  buildConnectionString: (connection: Connection) => string;
  clearError: () => void;
  canAddConnection: () => boolean;
}

export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set, get) => ({
      connections: [],
      activeConnection: null,
      lastError: null,


      canAddConnection: () => {
        // No limits in free local app
        return true;
      },

      addConnection: (connection) => {
        // No limits - always allow
        set((state) => ({
          connections: [...state.connections, connection],
          lastError: null
        }));
        return true;
      },

      clearError: () => set({ lastError: null }),

      removeConnection: (id) =>
        set((state) => ({
          connections: state.connections.filter((c) => c.id !== id),
          activeConnection: state.activeConnection === id ? null : state.activeConnection,
          lastError: null
        })),
      updateConnection: (id, updates) =>
        set((state) => ({
          connections: state.connections.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),
      setActiveConnection: (id) => set({ activeConnection: id }),
      getConnection: (id) => get().connections.find((c) => c.id === id),
      buildConnectionString: (connection: Connection) => {
        const { databaseType, host, port, database, username, password } = connection;

        switch (databaseType) {
          case 'sqlserver':
            // mssql+pymssql://username:password@host:port/database
            return `mssql+pymssql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;

          case 'postgresql':
            // postgresql://username:password@host:port/database
            return `postgresql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;

          case 'mysql':
            // mysql+pymysql://username:password@host:port/database
            return `mysql+pymysql://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;

          default:
            throw new Error(`Unsupported database type: ${databaseType}`);
        }
      },
    }),
    {
      name: 'connection-storage',
      partialize: (state) => ({
        connections: state.connections,
        activeConnection: state.activeConnection,
        // Don't persist lastError
      })
    }
  )
);

