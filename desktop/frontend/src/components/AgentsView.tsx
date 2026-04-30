import styled from 'styled-components';
import { useState, useEffect } from 'react';
import { apiClient, AgentData, AgentRunLog } from '../utils/api';
import { showToast } from '../stores/toastStore';
import { showDialog } from '../stores/dialogStore';

interface AgentsViewProps {
  isOpen: boolean;
  onClose: () => void;
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
  width: 700px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: ${(props) => props.theme.shadows.lg};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${(props) => props.theme.spacing.lg};
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
  padding-bottom: ${(props) => props.theme.spacing.md};
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: ${(props) => props.theme.colors.text};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
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

const MasterToggleContainer = styled.div`
  display: flex;
  align-items: center;
  background-color: ${(props) => props.theme.colors.surface};
  padding: 12px 16px;
  border-radius: ${(props) => props.theme.borderRadius.md};
  margin-bottom: ${(props) => props.theme.spacing.lg};
  border: 1px solid ${(props) => props.theme.colors.border};
`;

const MasterToggleInfo = styled.div`
  flex: 1;
`;

const MasterTitle = styled.div`
  font-weight: 600;
  color: ${(props) => props.theme.colors.text};
  font-size: 15px;
`;

const MasterDesc = styled.div`
  font-size: 13px;
  color: ${(props) => props.theme.colors.textSecondary};
  margin-top: 4px;
`;

const ToggleSwitch = styled.button<{ $active: boolean }>`
  width: 48px;
  height: 24px;
  border-radius: 12px;
  border: none;
  background-color: ${(props) =>
    props.$active ? props.theme.colors.primary : props.theme.colors.border};
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
  
  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${(props) => (props.$active ? '26px' : '2px')};
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: white;
    transition: all 0.2s;
  }
`;

const AgentsList = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing.md};
`;

const AgentCard = styled.div<{ $active: boolean }>`
  background-color: ${(props) => props.theme.colors.surface};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-left: 4px solid ${(props) => props.$active ? props.theme.colors.primary : props.theme.colors.textSecondary};
  border-radius: ${(props) => props.theme.borderRadius.md};
  padding: ${(props) => props.theme.spacing.md};
  opacity: ${(props) => props.$active ? 1 : 0.7};
  transition: opacity 0.2s;
`;

const AgentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const AgentName = styled.h3`
  margin: 0;
  font-size: 16px;
  color: ${(props) => props.theme.colors.text};
`;

const AgentControls = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: ${(props) => props.theme.colors.error};
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 4px;

  &:hover {
    background-color: ${(props) => props.theme.colors.error}20;
  }
`;

const AgentMetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  font-size: 13px;
`;

const MetaLabel = styled.div`
  color: ${(props) => props.theme.colors.textSecondary};
  margin-bottom: 4px;
`;

const MetaValue = styled.div`
  color: ${(props) => props.theme.colors.text};
  font-family: monospace;
  background-color: ${(props) => props.theme.colors.background};
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid ${(props) => props.theme.colors.border};
  word-break: break-all;
`;

const AgentTypeBadge = styled.span<{ $type: string }>`
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  background-color: ${({ $type, theme }) =>
    $type === 'action' ? theme.colors.primary + '22' :
    $type === 'conditional' ? '#f59e0b22' :
    theme.colors.border};
  color: ${({ $type, theme }) =>
    $type === 'action' ? theme.colors.primary :
    $type === 'conditional' ? '#f59e0b' :
    theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: ${(props) => props.theme.colors.textSecondary};
  font-size: 15px;
`;

const LogsToggle = styled.button`
  background: none;
  border: none;
  color: ${(props) => props.theme.colors.primary};
  cursor: pointer;
  font-size: 12px;
  padding: 6px 0 0;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    text-decoration: underline;
  }
`;

const LogsContainer = styled.div`
  margin-top: 10px;
  border-top: 1px solid ${(props) => props.theme.colors.border};
  padding-top: 10px;
  max-height: 200px;
  overflow-y: auto;
`;

const LogRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0;
  font-size: 12px;
  border-bottom: 1px solid ${(props) => props.theme.colors.border}22;

  &:last-child {
    border-bottom: none;
  }
`;

const StatusDot = styled.span<{ $ok: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${(props) => props.$ok ? '#22c55e' : '#ef4444'};
  flex-shrink: 0;
`;

const LogTime = styled.span`
  color: ${(props) => props.theme.colors.textSecondary};
  font-family: monospace;
  min-width: 140px;
`;

const LogSummary = styled.span`
  color: ${(props) => props.theme.colors.text};
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const LogError = styled.span`
  color: #ef4444;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const InboxSection = styled.div`
  margin-bottom: ${(props) => props.theme.spacing.lg};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  overflow: hidden;
`;

const InboxHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background-color: ${(props) => props.theme.colors.surface};
  cursor: pointer;
  user-select: none;
`;

const InboxTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${(props) => props.theme.colors.text};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const UnreadBadge = styled.span`
  background-color: ${(props) => props.theme.colors.primary};
  color: white;
  border-radius: 10px;
  padding: 1px 7px;
  font-size: 11px;
  font-weight: 700;
`;

const InboxBody = styled.div`
  max-height: 220px;
  overflow-y: auto;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const InboxMessage = styled.div`
  font-size: 12px;
  color: ${(props) => props.theme.colors.text};
  background-color: ${(props) => props.theme.colors.background};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: 6px;
  padding: 8px 10px;
  white-space: pre-wrap;
  word-break: break-word;
`;

const MarkReadBtn = styled.button`
  background: none;
  border: none;
  font-size: 12px;
  color: ${(props) => props.theme.colors.primary};
  cursor: pointer;
  padding: 0;
  &:hover { text-decoration: underline; }
`;

const RobotIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v4" />
    <line x1="8" y1="16" x2="8" y2="16" />
    <line x1="16" y1="16" x2="16" y2="16" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

export const AgentsView = ({ isOpen, onClose }: AgentsViewProps) => {
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [isMasterActive, setIsMasterActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [agentRuns, setAgentRuns] = useState<AgentRunLog[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [observerMessages, setObserverMessages] = useState<Array<{ id: string; content: string; created_at: string }>>([]);
  const [showObserverInbox, setShowObserverInbox] = useState(false);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const [agentsRes, msgsRes] = await Promise.all([
        apiClient.getAllAgents(),
        apiClient.getAgentMessages(),
      ]);
      if (agentsRes.success) {
        setAgents(agentsRes.agents);
        setIsMasterActive(!agentsRes.master_paused);
      }
      if (msgsRes.success) {
        setObserverMessages(msgsRes.messages || []);
      }
    } catch (err) {
      console.error("Failed to load agents", err);
      showToast.error("Failed to load agents from server");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    const ids = observerMessages.map(m => m.id);
    if (!ids.length) return;
    await apiClient.markAgentMessagesRead(ids);
    setObserverMessages([]);
  };

  useEffect(() => {
    if (isOpen) {
      fetchAgents();
    }
  }, [isOpen]);

  const handleMasterToggle = async () => {
    const newState = !isMasterActive;
    try {
      setIsMasterActive(newState); // Optimistic UI
      await apiClient.toggleAgentMaster(newState);
      showToast.success(`Agent System ${newState ? 'Resumed' : 'Paused'}`);
    } catch (err) {
      setIsMasterActive(!newState); // Revert
      showToast.error("Failed to change master system status");
    }
  };

  const handleAgentToggle = async (agentId: string, currentActive: boolean) => {
    const newState = !currentActive;
    try {
      // Optimistic update
      setAgents(agents.map(a => a.id === agentId ? { ...a, is_active: newState } : a));
      await apiClient.toggleAgent(agentId, newState);
    } catch (err) {
      // Revert
      setAgents(agents.map(a => a.id === agentId ? { ...a, is_active: currentActive } : a));
      showToast.error("Failed to toggle agent");
    }
  };

  const handleAgentDelete = async (agentId: string) => {
    const ok = await showDialog.confirm({
      message: 'Are you sure you want to delete this agent forever?',
      variant: 'danger',
    });
    if (!ok) return;
    
    try {
      await apiClient.deleteAgent(agentId);
      setAgents(agents.filter(a => a.id !== agentId));
      showToast.success("Agent deleted successfully");
    } catch (err) {
      showToast.error("Failed to delete agent");
    }
  };

  const handleToggleLogs = async (agentId: string) => {
    if (expandedAgent === agentId) {
      setExpandedAgent(null);
      setAgentRuns([]);
      return;
    }
    setExpandedAgent(agentId);
    setLoadingRuns(true);
    try {
      const res = await apiClient.getAgentRuns(agentId);
      setAgentRuns(res.runs || []);
    } catch {
      setAgentRuns([]);
    } finally {
      setLoadingRuns(false);
    }
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('he-IL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return iso;
    }
  };

  return (
    <Overlay $isOpen={isOpen} onClick={onClose}>
      <Panel onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title><RobotIcon /> Agents Dashboard</Title>
          <CloseButton onClick={onClose}>×</CloseButton>
        </Header>

        <MasterToggleContainer>
          <MasterToggleInfo>
            <MasterTitle>Global Master Switch</MasterTitle>
            <MasterDesc>
              When disabled, all background tracking and AI observations are universally suspended.
            </MasterDesc>
          </MasterToggleInfo>
          <ToggleSwitch 
            $active={isMasterActive} 
            onClick={handleMasterToggle} 
            title={isMasterActive ? "Pause System" : "Resume System"} 
          />
        </MasterToggleContainer>

        {observerMessages.length > 0 && (
          <InboxSection>
            <InboxHeader onClick={() => setShowObserverInbox(v => !v)}>
              <InboxTitle>
                Observer Inbox
                <UnreadBadge>{observerMessages.length}</UnreadBadge>
              </InboxTitle>
              <MarkReadBtn onClick={(e) => { e.stopPropagation(); handleMarkAllRead(); }}>
                Mark all read
              </MarkReadBtn>
            </InboxHeader>
            {showObserverInbox && (
              <InboxBody>
                {observerMessages.map(msg => (
                  <InboxMessage key={msg.id}>{msg.content}</InboxMessage>
                ))}
              </InboxBody>
            )}
          </InboxSection>
        )}

        <AgentsList>
          {loading ? (
            <EmptyState>Loading agents...</EmptyState>
          ) : agents.length === 0 ? (
            <EmptyState>
              No agents are currently running.
              <br/><br/>
              Ask the AI in the chat to create an alert, or set a background schedule!
            </EmptyState>
          ) : (
            agents.map(agent => (
              <AgentCard key={agent.id} $active={agent.is_active}>
                <AgentHeader>
                  <AgentName>
                    {agent.name}
                    <AgentTypeBadge $type={agent.agent_type || 'monitor'}>
                      {agent.agent_type || 'monitor'}
                    </AgentTypeBadge>
                  </AgentName>
                  <AgentControls>
                    <ToggleSwitch 
                      $active={agent.is_active} 
                      onClick={() => handleAgentToggle(agent.id, agent.is_active)}
                    />
                    <DeleteButton onClick={() => handleAgentDelete(agent.id)} title="Delete Agent">
                      <TrashIcon />
                    </DeleteButton>
                  </AgentControls>
                </AgentHeader>
                <AgentMetaGrid>
                  <div>
                    <MetaLabel>Schedule Type</MetaLabel>
                    <MetaValue>{agent.schedule}</MetaValue>
                  </div>
                  <div>
                    <MetaLabel>Target Script / Context</MetaLabel>
                    <MetaValue>{agent.query_logic.substring(0,60) || "Auto-Observer"}...</MetaValue>
                  </div>
                </AgentMetaGrid>
                <LogsToggle onClick={() => handleToggleLogs(agent.id)}>
                  {expandedAgent === agent.id ? '▲ Hide Logs' : '▼ Show Run History'}
                </LogsToggle>
                {expandedAgent === agent.id && (
                  <LogsContainer>
                    {loadingRuns ? (
                      <LogRow><LogSummary>Loading...</LogSummary></LogRow>
                    ) : agentRuns.length === 0 ? (
                      <LogRow><LogSummary>No runs recorded yet.</LogSummary></LogRow>
                    ) : (
                      agentRuns.map(run => (
                        <LogRow key={run.id}>
                          <StatusDot $ok={run.status === 'SUCCESS'} />
                          <LogTime>{formatTime(run.started_at)}</LogTime>
                          {run.status === 'SUCCESS' ? (
                            <LogSummary>{run.summary || `${run.row_count} rows`}</LogSummary>
                          ) : (
                            <LogError>{run.error_message || 'Unknown error'}</LogError>
                          )}
                        </LogRow>
                      ))
                    )}
                  </LogsContainer>
                )}
              </AgentCard>
            ))
          )}
        </AgentsList>
      </Panel>
    </Overlay>
  );
};
