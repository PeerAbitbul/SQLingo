import styled from 'styled-components';
import { useState } from 'react';

interface QueryResultsProps {
  columns: string[];
  rows: any[][];
  onExport?: (format: 'csv' | 'json') => void;
}

const Container = styled.div`
  margin-top: ${(props) => props.theme.spacing.md};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: ${(props) => props.theme.borderRadius.md};
  overflow: hidden;
  background-color: ${(props) => props.theme.colors.surface};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${(props) => props.theme.spacing.sm} ${(props) => props.theme.spacing.md};
  background-color: ${(props) => props.theme.colors.background};
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
`;

const Title = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${(props) => props.theme.colors.text};
`;

const RowCount = styled.span`
  font-size: 12px;
  color: ${(props) => props.theme.colors.textSecondary};
  margin-left: ${(props) => props.theme.spacing.sm};
`;

const Actions = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spacing.sm};
`;

const ActionButton = styled.button`
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

const TableWrapper = styled.div`
  overflow-x: auto;
  overflow-y: auto;
  max-height: 400px;
  
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${(props) => props.theme.colors.border};
    border-radius: 4px;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
`;

const Thead = styled.thead`
  position: sticky;
  top: 0;
  background-color: ${(props) => props.theme.colors.background};
  z-index: 1;
`;

const Th = styled.th`
  padding: ${(props) => props.theme.spacing.sm} ${(props) => props.theme.spacing.md};
  text-align: left;
  font-weight: 600;
  color: ${(props) => props.theme.colors.text};
  border-bottom: 2px solid ${(props) => props.theme.colors.border};
  white-space: nowrap;
`;

const Tbody = styled.tbody``;

const Tr = styled.tr`
  &:hover {
    background-color: ${(props) => props.theme.colors.background};
  }
`;

const Td = styled.td`
  padding: ${(props) => props.theme.spacing.sm} ${(props) => props.theme.spacing.md};
  color: ${(props) => props.theme.colors.text};
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
  white-space: nowrap;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const EmptyState = styled.div`
  padding: ${(props) => props.theme.spacing.xl};
  text-align: center;
  color: ${(props) => props.theme.colors.textSecondary};
`;

export const QueryResults = ({ columns, rows }: QueryResultsProps) => {
  const [copied, setCopied] = useState(false);

  // Helper function to properly escape CSV cells
  const escapeCsvCell = (cell: any): string => {
    if (cell === null || cell === undefined) return '';

    const cellStr = String(cell);

    // If cell contains comma, newline, or quote, wrap in quotes and escape internal quotes
    if (cellStr.includes(',') || cellStr.includes('\n') || cellStr.includes('"')) {
      return `"${cellStr.replace(/"/g, '""')}"`;
    }

    return cellStr;
  };

  const handleCopyCSV = () => {
    try {
      // Generate CSV with proper escaping
      const csv = [
        columns.map(escapeCsvCell).join(','),
        ...rows.map(row => row.map(escapeCsvCell).join(','))
      ].join('\n');

      navigator.clipboard.writeText(csv);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy CSV:', error);
    }
  };

  const handleExportJSON = () => {
    try {
      const json = rows.map(row => {
        const obj: any = {};
        columns.forEach((col, i) => {
          obj[col] = row[i];
        });
        return obj;
      });

      const jsonStr = JSON.stringify(json, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `query-results-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export JSON:', error);
    }
  };

  const handleExportCSV = () => {
    try {
      // Generate CSV with proper escaping
      const csv = [
        columns.map(escapeCsvCell).join(','),
        ...rows.map(row => row.map(escapeCsvCell).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `query-results-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export CSV:', error);
    }
  };

  if (rows.length === 0) {
    return (
      <Container>
        <Header>
          <Title>Results</Title>
        </Header>
        <EmptyState>No results to display</EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>
          Results
          <RowCount>({rows.length} rows)</RowCount>
        </Title>
        <Actions>
          <ActionButton onClick={handleCopyCSV}>
            {copied ? 'Copied!' : 'Copy CSV'}
          </ActionButton>
          <ActionButton onClick={handleExportCSV}>
            Export CSV
          </ActionButton>
          <ActionButton onClick={handleExportJSON}>
            Export JSON
          </ActionButton>
        </Actions>
      </Header>
      <TableWrapper>
        <Table>
          <Thead>
            <tr>
              {columns.map((col, i) => (
                <Th key={i}>{col}</Th>
              ))}
            </tr>
          </Thead>
          <Tbody>
            {rows.map((row, i) => (
              <Tr key={i}>
                {row.map((cell, j) => (
                  <Td key={j} title={String(cell)}>
                    {cell === null ? <em>NULL</em> : String(cell)}
                  </Td>
                ))}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableWrapper>
    </Container>
  );
};

