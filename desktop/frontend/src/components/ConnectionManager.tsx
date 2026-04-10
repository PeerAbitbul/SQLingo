import styled from 'styled-components';
import { useState } from 'react';
import { useConnectionStore, Connection } from '../stores/connectionStore';
import { useTestConnection } from '../hooks/useAPI';
import { showToast } from '../stores/toastStore';
import { showDialog } from '../stores/dialogStore';
import { InlineLoading } from './Loading';
import { withRetry, RetryPresets } from '../utils/retry';

interface ConnectionManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConnection?: (connectionId: string) => void;
}

const Overlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: ${(props) => (props.$isOpen ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Panel = styled.div`
  background-color: ${(props) => props.theme.colors.background};
  border-radius: ${(props) => props.theme.borderRadius.lg};
  padding: ${(props) => props.theme.spacing.xl};
  width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: ${(props) => props.theme.shadows.lg};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${(props) => props.theme.spacing.lg};
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: ${(props) => props.theme.colors.text};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${(props) => props.theme.colors.textSecondary};
  cursor: pointer;
  font-size: 24px;
  padding: ${(props) => props.theme.spacing.xs};
  
  &:hover {
    color: ${(props) => props.theme.colors.text};
  }
`;

const ConnectionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing.md};
  margin-bottom: ${(props) => props.theme.spacing.lg};
`;

const ConnectionCard = styled.div<{ $active: boolean }>`
  padding: ${(props) => props.theme.spacing.md};
  background-color: ${(props) => props.theme.colors.surface};
  border: 2px solid ${(props) =>
    props.$active ? props.theme.colors.primary : props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    border-color: ${(props) => props.theme.colors.primary};
  }
`;

const ConnectionName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${(props) => props.theme.colors.text};
  margin-bottom: ${(props) => props.theme.spacing.xs};
`;

const ConnectionType = styled.div`
  font-size: 12px;
  color: ${(props) => props.theme.colors.textSecondary};
  text-transform: uppercase;
`;

const ConnectionActions = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spacing.sm};
  margin-top: ${(props) => props.theme.spacing.sm};
`;

const SmallButton = styled.button`
  padding: ${(props) => props.theme.spacing.xs} ${(props) => props.theme.spacing.sm};
  background-color: ${(props) => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${(props) => props.theme.borderRadius.sm};
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    opacity: 0.9;
  }
`;

const DeleteButton = styled(SmallButton)`
  background-color: ${(props) => props.theme.colors.error};
`;

const AddButton = styled.button`
  width: 100%;
  padding: ${(props) => props.theme.spacing.md};
  background-color: ${(props) => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${(props) => props.theme.borderRadius.md};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    opacity: 0.9;
  }
`;

const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing.md};
  margin-top: ${(props) => props.theme.spacing.lg};
  padding: ${(props) => props.theme.spacing.lg};
  background-color: ${(props) => props.theme.colors.surface};
  border-radius: ${(props) => props.theme.borderRadius.md};
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing.xs};
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: ${(props) => props.theme.colors.text};
`;

const Input = styled.input`
  padding: ${(props) => props.theme.spacing.sm};
  background-color: ${(props) => props.theme.colors.background};
  color: ${(props) => props.theme.colors.text};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.sm};
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.colors.primary};
  }
`;

const Select = styled.select`
  padding: ${(props) => props.theme.spacing.sm};
  background-color: ${(props) => props.theme.colors.background};
  color: ${(props) => props.theme.colors.text};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.sm};
  font-size: 14px;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.colors.primary};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spacing.sm};
`;

const Button = styled.button`
  flex: 1;
  padding: ${(props) => props.theme.spacing.sm};
  background-color: ${(props) => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${(props) => props.theme.borderRadius.sm};
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(Button)`
  background-color: ${(props) => props.theme.colors.secondary};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${(props) => props.theme.spacing.xl};
  color: ${(props) => props.theme.colors.textSecondary};
`;

// Default ports for each database type
const DEFAULT_PORTS = {
  sqlserver: 1433,
  postgresql: 5432,
  mysql: 3306,
};

export const ConnectionManager = ({ isOpen, onClose, onSelectConnection }: ConnectionManagerProps) => {
  const { connections, activeConnection, addConnection, removeConnection, buildConnectionString } =
    useConnectionStore();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    databaseType: 'sqlserver' as 'sqlserver' | 'postgresql' | 'mysql',
    host: 'localhost',
    port: DEFAULT_PORTS.sqlserver,
    database: '',
    username: '',
    password: '',
  });

  const testConnectionMutation = useTestConnection();

  const handleAddNew = () => {
    setShowForm(true);
    setFormData({
      name: '',
      databaseType: 'sqlserver',
      host: 'localhost',
      port: DEFAULT_PORTS.sqlserver,
      database: '',
      username: '',
      password: '',
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData({
      name: '',
      databaseType: 'sqlserver',
      host: 'localhost',
      port: DEFAULT_PORTS.sqlserver,
      database: '',
      username: '',
      password: '',
    });
  };

  const handleTest = async () => {
    try {
      // Build connection string from form data
      const connectionString = buildConnectionString(formData as Connection);

      // Use retry logic for connection testing
      const result = await withRetry(
        () => testConnectionMutation.mutateAsync({
          connection_string: connectionString,
          database_type: formData.databaseType,
        }),
        {
          ...RetryPresets.database,
          onRetry: (_error, attempt) => {
            showToast.info(`Connection attempt ${attempt} failed, retrying...`);
          },
        }
      );

      if (result.success) {
        showToast.success('Connection successful!');
      } else {
        showToast.error(`Connection failed: ${result.message}`);
      }
    } catch (error: any) {
      showToast.error(`Error testing connection: ${error?.message || error}`);
    }
  };

  const handleSave = () => {
    // Validate required fields
    if (!formData.name || !formData.host || !formData.database || !formData.username) {
      showToast.warning('Please fill in all required fields');
      return;
    }

    // Validate port number
    const portNum = formData.port;
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      showToast.error('Port must be a valid number between 1 and 65535');
      return;
    }

    // Validate connection name doesn't contain dangerous characters
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(formData.name)) {
      showToast.error('Connection name can only contain letters, numbers, spaces, hyphens and underscores');
      return;
    }

    try {
      const newConnection: Connection = {
        id: Date.now().toString(),
        name: formData.name.trim(),
        databaseType: formData.databaseType,
        host: formData.host.trim(),
        port: portNum,
        database: formData.database.trim(),
        username: formData.username.trim(),
        password: formData.password, // Keep password as-is
        createdAt: new Date(),
      };

      addConnection(newConnection);
      showToast.success(`Connection "${formData.name}" saved successfully`);

      // If onSelectConnection is provided, call it with the new connection ID
      if (onSelectConnection) {
        onSelectConnection(newConnection.id);
      }

      handleCancel();
    } catch (error: any) {
      showToast.error(`Error saving connection: ${error?.message || error}`);
    }
  };

  const handleDelete = async (id: string) => {
    const connection = connections.find((c) => c.id === id);
    const ok = await showDialog.confirm({
      message: 'Are you sure you want to delete this connection?',
      variant: 'danger',
    });
    if (ok) {
      try {
        removeConnection(id);
        showToast.success(`Connection "${connection?.name || 'Unknown'}" deleted`);
      } catch (error: any) {
        showToast.error(`Error deleting connection: ${error?.message || error}`);
      }
    }
  };

  return (
    <Overlay $isOpen={isOpen} onClick={onClose}>
      <Panel onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>Database Connections</Title>
          <CloseButton onClick={onClose}>×</CloseButton>
        </Header>

        {connections.length === 0 && !showForm ? (
          <EmptyState>
            <p>No connections yet.</p>
            <p>Click "Add New Connection" to get started.</p>
          </EmptyState>
        ) : (
          <ConnectionList>
            {connections.map((conn) => (
              <ConnectionCard
                key={conn.id}
                $active={conn.id === activeConnection}
                onClick={() => {
                  // Only highlight, don't set as active
                }}
              >
                <ConnectionName>{conn.name}</ConnectionName>
                <ConnectionType>{conn.databaseType}</ConnectionType>
                <ConnectionActions onClick={(e) => e.stopPropagation()}>
                  <SmallButton
                    onClick={() => {
                      // Only call onSelectConnection, don't set global activeConnection
                      if (onSelectConnection) {
                        onSelectConnection(conn.id);
                      }
                    }}
                  >
                    Select
                  </SmallButton>
                  <DeleteButton onClick={() => handleDelete(conn.id)}>
                    Delete
                  </DeleteButton>
                </ConnectionActions>
              </ConnectionCard>
            ))}
          </ConnectionList>
        )}

        {!showForm && (
          <AddButton onClick={handleAddNew}>+ Add New Connection</AddButton>
        )}

        {showForm && (
          <Form>
            <FormGroup>
              <Label>Connection Name</Label>
              <Input
                type="text"
                placeholder="My Database"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </FormGroup>

            <FormGroup>
              <Label>Database Type</Label>
              <Select
                value={formData.databaseType}
                onChange={(e) => {
                  const dbType = e.target.value as 'sqlserver' | 'postgresql' | 'mysql';
                  setFormData({
                    ...formData,
                    databaseType: dbType,
                    port: DEFAULT_PORTS[dbType],
                  });
                }}
              >
                <option value="sqlserver">SQL Server</option>
                <option value="postgresql">PostgreSQL</option>
                <option value="mysql">MySQL</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Host / Server</Label>
              <Input
                type="text"
                placeholder="localhost or 192.168.1.100"
                value={formData.host}
                onChange={(e) =>
                  setFormData({ ...formData, host: e.target.value })
                }
              />
            </FormGroup>

            <FormGroup>
              <Label>Port</Label>
              <Input
                type="number"
                placeholder="1433"
                value={formData.port}
                onChange={(e) =>
                  setFormData({ ...formData, port: parseInt(e.target.value) || 0 })
                }
              />
            </FormGroup>

            <FormGroup>
              <Label>Database Name</Label>
              <Input
                type="text"
                placeholder="myDatabase"
                value={formData.database}
                onChange={(e) =>
                  setFormData({ ...formData, database: e.target.value })
                }
              />
            </FormGroup>

            <FormGroup>
              <Label>Username</Label>
              <Input
                type="text"
                placeholder="sa or admin"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
              />
            </FormGroup>

            <FormGroup>
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </FormGroup>

            <ButtonGroup>
              <CancelButton onClick={handleCancel}>Cancel</CancelButton>
              <Button onClick={handleTest} disabled={testConnectionMutation.isPending}>
                {testConnectionMutation.isPending ? <InlineLoading text="Testing" /> : 'Test'}
              </Button>
              <Button onClick={handleSave}>Save</Button>
            </ButtonGroup>
          </Form>
        )}
      </Panel>
    </Overlay>
  );
};

