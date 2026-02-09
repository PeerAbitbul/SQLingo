import { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

type UpdateState = 'idle' | 'available' | 'downloading' | 'ready';

const slideDown = keyframes`
  from { transform: translateY(-100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const Banner = styled.div`
  position: fixed;
  top: 32px; /* Below titlebar */
  left: 0;
  right: 0;
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-size: 13px;
  animation: ${slideDown} 0.3s ease-out;
`;

const UpdateButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.4);
  color: #fff;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const DismissButton = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  font-size: 16px;
  padding: 0 4px;
  line-height: 1;

  &:hover {
    color: #fff;
  }
`;

export const UpdateBanner = () => {
  const [state, setState] = useState<UpdateState>('idle');
  const [version, setVersion] = useState('');
  const [progress, setProgress] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!window.electron?.isElectron) return;

    window.electron.onUpdateAvailable((data) => {
      setVersion(data.version);
      setState('downloading');
    });

    window.electron.onUpdateProgress((data) => {
      setProgress(data.percent);
    });

    window.electron.onUpdateDownloaded((data) => {
      setVersion(data.version);
      setState('ready');
    });
  }, []);

  if (state === 'idle' || dismissed) return null;

  return (
    <Banner>
      {state === 'downloading' && (
        <>Downloading update v{version}... {progress}%</>
      )}
      {state === 'ready' && (
        <>
          Update v{version} ready!
          <UpdateButton onClick={() => window.electron?.installUpdate()}>
            Restart & Update
          </UpdateButton>
          <DismissButton onClick={() => setDismissed(true)}>✕</DismissButton>
        </>
      )}
    </Banner>
  );
};
