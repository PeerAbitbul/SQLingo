import styled from 'styled-components';
import { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface QueryResultsProps {
  columns: string[];
  rows: any[][];
  onExport?: (format: 'csv' | 'json') => void;
}

type ViewMode = 'table' | 'bar' | 'line' | 'pie';

interface ChartConfig {
  labelCol: number;
  numericCols: number[];
  isTimeSeries: boolean;
  canPie: boolean;
}

const CHART_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7', '#ec4899'];

// ── Detection ─────────────────────────────────────────────────────────────────

function isNumericCol(rows: any[][], colIdx: number): boolean {
  const sample = rows.slice(0, 20).map(r => r[colIdx]).filter(v => v !== null && v !== undefined && v !== '');
  if (sample.length === 0) return false;
  const numericCount = sample.filter(v => !isNaN(Number(v))).length;
  return numericCount / sample.length >= 0.8;
}

const DATE_COL_NAMES = /date|time|month|year|day|week|quarter|period|created|updated/i;
const DATE_VALUE_RE = /^\d{4}[-\/]\d{1,2}([-\/]\d{1,2})?$|^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}$|^\d{4}$/;

function isTimeSeriesCol(colName: string, rows: any[][], colIdx: number): boolean {
  if (DATE_COL_NAMES.test(colName)) return true;
  const sample = rows.slice(0, 5).map(r => String(r[colIdx] ?? ''));
  return sample.every(v => DATE_VALUE_RE.test(v.trim()));
}

function detectChartConfig(columns: string[], rows: any[][]): ChartConfig | null {
  if (rows.length < 2 || columns.length < 2) return null;

  const numericCols = columns.map((_, i) => i).filter(i => isNumericCol(rows, i));
  if (numericCols.length === 0) return null;

  // Label column: first non-numeric column
  const labelCol = columns.findIndex((_, i) => !numericCols.includes(i));
  if (labelCol === -1) return null;

  const isTimeSeries = isTimeSeriesCol(columns[labelCol], rows, labelCol);
  const canPie = numericCols.length === 1 && rows.length <= 20;

  return { labelCol, numericCols, isTimeSeries, canPie };
}

function buildChartData(columns: string[], rows: any[][], cfg: ChartConfig) {
  return rows.map(row => {
    const obj: Record<string, any> = { _label: String(row[cfg.labelCol] ?? '') };
    cfg.numericCols.forEach(i => {
      obj[columns[i]] = Number(row[i]) || 0;
    });
    return obj;
  });
}

// ── Styles ────────────────────────────────────────────────────────────────────

const Container = styled.div`
  margin-top: ${p => p.theme.spacing.md};
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: ${p => p.theme.borderRadius.md};
  overflow: hidden;
  background-color: ${p => p.theme.colors.surface};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${p => p.theme.spacing.sm} ${p => p.theme.spacing.md};
  background-color: ${p => p.theme.colors.background};
  border-bottom: 1px solid ${p => p.theme.colors.border};
  gap: 8px;
  flex-wrap: wrap;
`;

const Title = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${p => p.theme.colors.text};
`;

const RowCount = styled.span`
  font-size: 12px;
  color: ${p => p.theme.colors.textSecondary};
  margin-left: ${p => p.theme.spacing.sm};
`;

const ViewToggle = styled.div`
  display: flex;
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: ${p => p.theme.borderRadius.sm};
  overflow: hidden;
`;

const ViewBtn = styled.button<{ $active: boolean }>`
  padding: 4px 10px;
  font-size: 12px;
  border: none;
  cursor: pointer;
  background-color: ${p => p.$active ? p.theme.colors.primary : 'transparent'};
  color: ${p => p.$active ? 'white' : p.theme.colors.textSecondary};
  transition: all 0.15s;
  &:hover { background-color: ${p => p.$active ? p.theme.colors.primary : p.theme.colors.border}; }
`;

const Actions = styled.div`
  display: flex;
  gap: ${p => p.theme.spacing.sm};
`;

const ActionButton = styled.button`
  padding: ${p => p.theme.spacing.xs} ${p => p.theme.spacing.sm};
  background-color: ${p => p.theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${p => p.theme.borderRadius.sm};
  font-size: 12px;
  cursor: pointer;
  &:hover { opacity: 0.9; }
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  overflow-y: auto;
  max-height: 400px;
  &::-webkit-scrollbar { width: 8px; height: 8px; }
  &::-webkit-scrollbar-thumb { background: ${p => p.theme.colors.border}; border-radius: 4px; }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
`;

const Thead = styled.thead`
  position: sticky;
  top: 0;
  background-color: ${p => p.theme.colors.background};
  z-index: 1;
`;

const Th = styled.th`
  padding: ${p => p.theme.spacing.sm} ${p => p.theme.spacing.md};
  text-align: left;
  font-weight: 600;
  color: ${p => p.theme.colors.text};
  border-bottom: 2px solid ${p => p.theme.colors.border};
  white-space: nowrap;
`;

const Tbody = styled.tbody``;

const Tr = styled.tr`
  &:hover { background-color: ${p => p.theme.colors.background}; }
`;

const Td = styled.td`
  padding: ${p => p.theme.spacing.sm} ${p => p.theme.spacing.md};
  color: ${p => p.theme.colors.text};
  border-bottom: 1px solid ${p => p.theme.colors.border};
  white-space: nowrap;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ChartWrapper = styled.div`
  padding: 16px;
  height: 360px;
`;

const EmptyState = styled.div`
  padding: ${p => p.theme.spacing.xl};
  text-align: center;
  color: ${p => p.theme.colors.textSecondary};
`;

const TooltipBox = styled.div`
  background-color: ${p => p.theme.colors.surface};
  border: 1px solid ${p => p.theme.colors.border};
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 12px;
  color: ${p => p.theme.colors.text};
`;

// ── Custom tooltip ─────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <TooltipBox>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {Number(p.value).toLocaleString()}
        </div>
      ))}
    </TooltipBox>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

export const QueryResults = ({ columns, rows }: QueryResultsProps) => {
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<ViewMode>('table');

  const chartCfg = useMemo(() => detectChartConfig(columns, rows), [columns, rows]);
  const chartData = useMemo(
    () => chartCfg ? buildChartData(columns, rows, chartCfg) : [],
    [columns, rows, chartCfg]
  );

  const availableViews: ViewMode[] = useMemo(() => {
    const views: ViewMode[] = ['table'];
    if (!chartCfg) return views;
    views.push(chartCfg.isTimeSeries ? 'line' : 'bar');
    if (!chartCfg.isTimeSeries) views.push('line');
    if (chartCfg.canPie) views.push('pie');
    return views;
  }, [chartCfg]);

  const escapeCsvCell = (cell: any): string => {
    if (cell === null || cell === undefined) return '';
    const s = String(cell);
    return s.includes(',') || s.includes('\n') || s.includes('"')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const handleCopyCSV = () => {
    const csv = [columns.map(escapeCsvCell).join(','), ...rows.map(r => r.map(escapeCsvCell).join(','))].join('\n');
    navigator.clipboard.writeText(csv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCSV = () => {
    const csv = [columns.map(escapeCsvCell).join(','), ...rows.map(r => r.map(escapeCsvCell).join(','))].join('\n');
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: `query-results-${Date.now()}.csv`,
    });
    a.click();
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(rows.map(row => Object.fromEntries(columns.map((c, i) => [c, row[i]]))), null, 2);
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([json], { type: 'application/json' })),
      download: `query-results-${Date.now()}.json`,
    });
    a.click();
  };

  if (rows.length === 0) {
    return (
      <Container>
        <Header><Title>Results</Title></Header>
        <EmptyState>No results to display</EmptyState>
      </Container>
    );
  }

  const numericKeys = chartCfg ? chartCfg.numericCols.map(i => columns[i]) : [];

  const renderChart = () => {
    if (!chartCfg || chartData.length === 0) return null;

    if (view === 'pie') {
      const key = numericKeys[0];
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} dataKey={key} nameKey="_label" cx="50%" cy="50%" outerRadius={130} label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}>
              {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v: any) => [Number(v).toLocaleString()]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    const ChartComponent = view === 'line' ? LineChart : BarChart;
    const DataComponent = view === 'line' ? Line : Bar;

    return (
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="_label" tick={{ fontSize: 11 }} angle={chartData.length > 8 ? -35 : 0} textAnchor={chartData.length > 8 ? 'end' : 'middle'} interval={0} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => Number(v).toLocaleString()} />
          <Tooltip content={<CustomTooltip />} />
          {numericKeys.length > 1 && <Legend />}
          {numericKeys.map((key, i) => (
            <DataComponent
              key={key}
              type="monotone"
              dataKey={key}
              fill={CHART_COLORS[i % CHART_COLORS.length]}
              stroke={CHART_COLORS[i % CHART_COLORS.length]}
              strokeWidth={2}
              dot={chartData.length <= 30}
              isAnimationActive={false}
            />
          ))}
        </ChartComponent>
      </ResponsiveContainer>
    );
  };

  return (
    <Container>
      <Header>
        <Title>
          Results
          <RowCount>({rows.length} rows)</RowCount>
        </Title>

        {availableViews.length > 1 && (
          <ViewToggle>
            {availableViews.map(v => (
              <ViewBtn key={v} $active={view === v} onClick={() => setView(v)}>
                {v === 'table' ? 'Table' : v === 'bar' ? 'Bar' : v === 'line' ? 'Line' : 'Pie'}
              </ViewBtn>
            ))}
          </ViewToggle>
        )}

        <Actions>
          <ActionButton onClick={handleCopyCSV}>{copied ? 'Copied!' : 'Copy CSV'}</ActionButton>
          <ActionButton onClick={handleExportCSV}>Export CSV</ActionButton>
          <ActionButton onClick={handleExportJSON}>Export JSON</ActionButton>
        </Actions>
      </Header>

      {view === 'table' ? (
        <TableWrapper>
          <Table>
            <Thead>
              <tr>{columns.map((col, i) => <Th key={i}>{col}</Th>)}</tr>
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
      ) : (
        <ChartWrapper>{renderChart()}</ChartWrapper>
      )}
    </Container>
  );
};
