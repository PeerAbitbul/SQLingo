import { useState } from 'react';
import styled from 'styled-components';

/**
 * Test component for Error Boundary
 * Only for development/testing purposes
 */

const TestButton = styled.button`
  padding: ${(props) => props.theme.spacing.xs} ${(props) => props.theme.spacing.sm};
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: ${(props) => props.theme.borderRadius.sm};
  font-size: 12px;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
`;

export const ErrorTest = () => {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    // This will trigger the Error Boundary
    throw new Error('Test error from ErrorTest component - Error Boundary is working!');
  }

  return (
    <TestButton onClick={() => setShouldThrow(true)}>
      Test Error Boundary
    </TestButton>
  );
};
