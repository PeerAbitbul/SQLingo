import styled from 'styled-components';

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  -webkit-app-region: no-drag;
`;

const IconWrapper = styled.div`
  width: 40px;
  height: 40px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 8px;
`;

const LogoIcon = styled.img`
  width: 150%;
  height: 150%;
  object-fit: contain;
  display: block;
`;

const LogoText = styled.div`
  font-size: 16px;
  font-weight: 700;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  letter-spacing: -0.5px;
  user-select: none;
  
  .sql {
    color: #66ccff;
  }
  
  .ingo {
    color: #ffffff;
  }
`;

interface ChatHeaderProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: ${(props) => props.theme.colors.surface};
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
  user-select: none;
  -webkit-app-region: drag;
  height: 60px;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  -webkit-app-region: no-drag;
`;

const Controls = styled.div`
  display: flex;
  gap: 4px;
  -webkit-app-region: no-drag;
`;

const IconButton = styled.button<{ $active?: boolean }>`
  background: ${(props) => (props.$active ? 'rgba(37, 99, 235, 0.15)' : 'none')};
  border: none;
  color: ${(props) => (props.$active ? '#2563eb' : props.theme.colors.textSecondary)};
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  width: 32px;
  height: 32px;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    background-color: ${(props) =>
    props.$active ? 'rgba(37, 99, 235, 0.25)' : props.theme.colors.background};
    color: ${(props) => (props.$active ? '#2563eb' : props.theme.colors.text)};
  }

  &.close:hover {
    background-color: #e81123;
    color: white;
  }
`;

// SVG Icons
const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
  </svg>
);

const MinimizeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12h14" strokeLinecap="round" />
  </svg>
);

const MaximizeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
  </svg>
);

export const ChatHeader = ({
  onMenuClick,
  isSidebarOpen,
}: ChatHeaderProps) => {
  const handleMinimize = () => {
    if (window.electron) {
      window.electron.minimizeWindow();
    }
  };

  const handleMaximize = () => {
    if (window.electron) {
      window.electron.maximizeWindow();
    }
  };

  const handleClose = () => {
    if (window.electron) {
      window.electron.closeWindow();
    }
  };

  return (
    <Header>
      <LeftSection>
        <IconButton
          onClick={onMenuClick}
          $active={isSidebarOpen}
          title={isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}
        >
          <MenuIcon />
        </IconButton>
        <LogoContainer>
          <IconWrapper>
            <LogoIcon src="/SQLingoICON_withoutbackround.png" alt="Icon" />
          </IconWrapper>
          <LogoText>
            <span className="sql">SQL</span>
            <span className="ingo">ingo</span>
          </LogoText>
        </LogoContainer>
      </LeftSection>
      <Controls>
        <IconButton onClick={handleMinimize} title="Minimize">
          <MinimizeIcon />
        </IconButton>
        <IconButton onClick={handleMaximize} title="Maximize">
          <MaximizeIcon />
        </IconButton>
        <IconButton onClick={handleClose} title="Close" className="close">
          <CloseIcon />
        </IconButton>
      </Controls>
    </Header>
  );
};