import styled from 'styled-components';
import { ExecutionPlanAnalysis } from '../utils/executionPlanApi';

interface Props {
  analysis: ExecutionPlanAnalysis;
}

export const ExecutionPlanViewer = ({ analysis }: Props) => {
  if (!analysis.success) {
    return (
      <ErrorContainer>
        <ErrorIcon>⚠️</ErrorIcon>
        <ErrorTitle>Analysis Failed</ErrorTitle>
        <ErrorMessage>{analysis.error || 'Unknown error occurred'}</ErrorMessage>
      </ErrorContainer>
    );
  }

  const { summary, bottlenecks, missing_indexes, recommendations, ai_insights } = analysis;

  if (!summary) {
    return (
      <ErrorContainer>
        <ErrorIcon>⚠️</ErrorIcon>
        <ErrorTitle>Invalid Analysis</ErrorTitle>
        <ErrorMessage>Analysis summary is missing</ErrorMessage>
      </ErrorContainer>
    );
  }

  return (
    <Container>
      {/* Summary Section */}
      <Section>
        <SectionTitle>Execution Plan Summary</SectionTitle>
        <SummaryGrid>
          <SummaryItem>
            <Label>Total Cost</Label>
            <Value>{summary.total_cost.toFixed(4)}</Value>
          </SummaryItem>
          <SummaryItem>
            <Label>Operations</Label>
            <Value>{summary.total_operations}</Value>
          </SummaryItem>
          {summary.database_name && (
            <SummaryItem>
              <Label>Database</Label>
              <Value>{summary.database_name}</Value>
            </SummaryItem>
          )}
        </SummaryGrid>

        <StatementBox>
          <StatementLabel>SQL Statement:</StatementLabel>
          <StatementText>{summary.statement}</StatementText>
        </StatementBox>

        {summary.warnings && summary.warnings.length > 0 && (
          <WarningsBox>
            <WarningIcon>⚠️</WarningIcon>
            <WarningsTitle>Warnings ({summary.warnings.length})</WarningsTitle>
            {summary.warnings.map((warning, idx) => (
              <WarningItem key={idx}>{warning}</WarningItem>
            ))}
          </WarningsBox>
        )}
      </Section>

      {/* Bottlenecks Section */}
      {bottlenecks.length > 0 && (
        <Section>
          <SectionTitle>Bottlenecks Found ({bottlenecks.length})</SectionTitle>
          {bottlenecks.map((bottleneck, idx) => (
            <BottleneckCard key={idx} severity={bottleneck.severity}>
              <BottleneckHeader>
                <SeverityBadge severity={bottleneck.severity}>
                  {getSeverityIcon(bottleneck.severity)} {bottleneck.severity.toUpperCase()}
                </SeverityBadge>
                <CostBadge>{bottleneck.cost_percentage.toFixed(1)}% of cost</CostBadge>
              </BottleneckHeader>
              <OperationType>{bottleneck.operation_type}</OperationType>
              <Description>{bottleneck.description}</Description>
              <RowInfo>
                Estimated rows: {bottleneck.estimated_rows.toLocaleString()}
                {bottleneck.actual_rows && ` | Actual: ${bottleneck.actual_rows.toLocaleString()}`}
              </RowInfo>
            </BottleneckCard>
          ))}
        </Section>
      )}

      {/* Missing Indexes Section */}
      {missing_indexes.length > 0 && (
        <Section>
          <SectionTitle>Missing Indexes ({missing_indexes.length})</SectionTitle>
          {missing_indexes.map((index, idx) => (
            <IndexCard key={idx}>
              <IndexHeader>
                <IndexTable>{index.table_name}</IndexTable>
                <ImpactBadge impact={index.impact}>
                  Impact: {index.impact.toFixed(0)}% - {index.estimated_improvement}
                </ImpactBadge>
              </IndexHeader>
              {index.equality_columns.length > 0 && (
                <IndexColumns>
                  <ColumnLabel>Equality:</ColumnLabel>
                  <ColumnList>{index.equality_columns.join(', ')}</ColumnList>
                </IndexColumns>
              )}
              {index.inequality_columns.length > 0 && (
                <IndexColumns>
                  <ColumnLabel>Inequality:</ColumnLabel>
                  <ColumnList>{index.inequality_columns.join(', ')}</ColumnList>
                </IndexColumns>
              )}
              {index.included_columns.length > 0 && (
                <IndexColumns>
                  <ColumnLabel>Include:</ColumnLabel>
                  <ColumnList>{index.included_columns.join(', ')}</ColumnList>
                </IndexColumns>
              )}
              {index.create_index_sql && (
                <IndexSqlBlock>
                  <IndexSqlHeader>
                    <span>CREATE INDEX</span>
                    <CopyBtn onClick={() => navigator.clipboard.writeText(index.create_index_sql!)}>
                      Copy
                    </CopyBtn>
                  </IndexSqlHeader>
                  <IndexSqlCode>{index.create_index_sql}</IndexSqlCode>
                </IndexSqlBlock>
              )}
            </IndexCard>
          ))}
        </Section>
      )}

      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <Section>
          <SectionTitle>Recommendations</SectionTitle>
          <RecommendationsList>
            {recommendations.map((rec, idx) => (
              <RecommendationItem key={idx}>
                <RecommendationBullet>•</RecommendationBullet>
                <RecommendationText>{rec}</RecommendationText>
              </RecommendationItem>
            ))}
          </RecommendationsList>
        </Section>
      )}

      {/* AI Insights Section */}
      {ai_insights && (
        <Section>
          <SectionTitle>AI Insights</SectionTitle>
          <AIInsightsBox>
            <AIContent>{ai_insights}</AIContent>
          </AIInsightsBox>
        </Section>
      )}
    </Container>
  );
};

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'high': return '🔴';
    case 'medium': return '🟡';
    case 'low': return '🟢';
    default: return '⚪';
  }
};

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing.lg};
  padding: ${(props) => props.theme.spacing.md};
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.theme.spacing.md};
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: ${(props) => props.theme.colors.text};
  margin: 0;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: ${(props) => props.theme.spacing.md};
`;

const SummaryItem = styled.div`
  background: ${(props) => props.theme.colors.surface};
  padding: ${(props) => props.theme.spacing.md};
  border-radius: ${(props) => props.theme.borderRadius.md};
  border: 1px solid ${(props) => props.theme.colors.border};
`;

const Label = styled.div`
  font-size: 12px;
  color: ${(props) => props.theme.colors.textSecondary};
  margin-bottom: 4px;
`;

const Value = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: ${(props) => props.theme.colors.text};
`;

const StatementBox = styled.div`
  background: ${(props) => props.theme.colors.surface};
  padding: ${(props) => props.theme.spacing.md};
  border-radius: ${(props) => props.theme.borderRadius.md};
  border: 1px solid ${(props) => props.theme.colors.border};
`;

const StatementLabel = styled.div`
  font-size: 12px;
  color: ${(props) => props.theme.colors.textSecondary};
  margin-bottom: 8px;
`;

const StatementText = styled.code`
  font-size: 13px;
  color: ${(props) => props.theme.colors.text};
  white-space: pre-wrap;
  word-break: break-word;
`;

const WarningsBox = styled.div`
  background: ${(props) => props.theme.colors.warning}15;
  padding: ${(props) => props.theme.spacing.md};
  border-radius: ${(props) => props.theme.borderRadius.md};
  border: 1px solid ${(props) => props.theme.colors.warning}40;
`;

const WarningIcon = styled.span`
  font-size: 18px;
  margin-right: 8px;
`;

const WarningsTitle = styled.div`
  font-weight: 600;
  color: ${(props) => props.theme.colors.warning};
  margin-bottom: 8px;
`;

const WarningItem = styled.div`
  font-size: 13px;
  color: ${(props) => props.theme.colors.text};
  margin: 4px 0 4px 26px;
`;

const BottleneckCard = styled.div<{ severity: string }>`
  background: ${(props) => props.theme.colors.surface};
  padding: ${(props) => props.theme.spacing.md};
  border-radius: ${(props) => props.theme.borderRadius.md};
  border-left: 4px solid ${(props) =>
    props.severity === 'high' ? '#ef4444' :
    props.severity === 'medium' ? '#f59e0b' : '#10b981'
  };
`;

const BottleneckHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const SeverityBadge = styled.span<{ severity: string }>`
  padding: 4px 8px;
  border-radius: ${(props) => props.theme.borderRadius.sm};
  font-size: 11px;
  font-weight: 600;
  background: ${(props) =>
    props.severity === 'high' ? '#ef444415' :
    props.severity === 'medium' ? '#f59e0b15' : '#10b98115'
  };
  color: ${(props) =>
    props.severity === 'high' ? '#ef4444' :
    props.severity === 'medium' ? '#f59e0b' : '#10b981'
  };
`;

const CostBadge = styled.span`
  padding: 4px 8px;
  border-radius: ${(props) => props.theme.borderRadius.sm};
  font-size: 11px;
  font-weight: 600;
  background: ${(props) => props.theme.colors.primary}15;
  color: ${(props) => props.theme.colors.primary};
`;

const OperationType = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${(props) => props.theme.colors.text};
  margin-bottom: 8px;
`;

const Description = styled.div`
  font-size: 13px;
  color: ${(props) => props.theme.colors.textSecondary};
  margin-bottom: 8px;
`;

const RowInfo = styled.div`
  font-size: 12px;
  color: ${(props) => props.theme.colors.textSecondary};
`;

const IndexCard = styled.div`
  background: ${(props) => props.theme.colors.surface};
  padding: ${(props) => props.theme.spacing.md};
  border-radius: ${(props) => props.theme.borderRadius.md};
  border: 1px solid ${(props) => props.theme.colors.border};
`;

const IndexHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const IndexTable = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${(props) => props.theme.colors.text};
`;

const ImpactBadge = styled.span<{ impact: number }>`
  padding: 4px 8px;
  border-radius: ${(props) => props.theme.borderRadius.sm};
  font-size: 11px;
  font-weight: 600;
  background: ${(props) =>
    props.impact >= 90 ? '#ef444415' :
    props.impact >= 70 ? '#f59e0b15' : '#10b98115'
  };
  color: ${(props) =>
    props.impact >= 90 ? '#ef4444' :
    props.impact >= 70 ? '#f59e0b' : '#10b981'
  };
`;

const IndexColumns = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 13px;
`;

const ColumnLabel = styled.span`
  color: ${(props) => props.theme.colors.textSecondary};
  font-weight: 500;
  min-width: 80px;
`;

const ColumnList = styled.span`
  color: ${(props) => props.theme.colors.text};
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
`;

const IndexSqlBlock = styled.div`
  margin-top: 10px;
  background-color: ${(props) => props.theme.colors.background};
  border: 1px solid ${(props) => props.theme.colors.border};
  border-radius: 6px;
  overflow: hidden;
`;

const IndexSqlHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 10px;
  background-color: ${(props) => props.theme.colors.surface};
  border-bottom: 1px solid ${(props) => props.theme.colors.border};
  font-size: 11px;
  color: ${(props) => props.theme.colors.textSecondary};
`;

const CopyBtn = styled.button`
  background: none;
  border: none;
  color: ${(props) => props.theme.colors.primary};
  font-size: 11px;
  cursor: pointer;
  padding: 0;
  &:hover { text-decoration: underline; }
`;

const IndexSqlCode = styled.pre`
  margin: 0;
  padding: 10px;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 12px;
  color: ${(props) => props.theme.colors.text};
  white-space: pre-wrap;
  word-break: break-all;
`;

const RecommendationsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const RecommendationItem = styled.div`
  display: flex;
  gap: 8px;
  padding: ${(props) => props.theme.spacing.sm};
  background: ${(props) => props.theme.colors.surface};
  border-radius: ${(props) => props.theme.borderRadius.sm};
`;

const RecommendationBullet = styled.span`
  color: ${(props) => props.theme.colors.primary};
  font-weight: bold;
`;

const RecommendationText = styled.span`
  font-size: 13px;
  color: ${(props) => props.theme.colors.text};
  flex: 1;
`;

const AIInsightsBox = styled.div`
  background: ${(props) => props.theme.colors.surface};
  padding: ${(props) => props.theme.spacing.md};
  border-radius: ${(props) => props.theme.borderRadius.md};
  border: 1px solid ${(props) => props.theme.colors.primary}40;
`;

const AIContent = styled.div`
  font-size: 13px;
  color: ${(props) => props.theme.colors.text};
  line-height: 1.6;
  white-space: pre-wrap;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${(props) => props.theme.spacing.xl};
  text-align: center;
`;

const ErrorIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const ErrorTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${(props) => props.theme.colors.error};
  margin: 0 0 8px 0;
`;

const ErrorMessage = styled.p`
  font-size: 14px;
  color: ${(props) => props.theme.colors.textSecondary};
  margin: 0;
`;
