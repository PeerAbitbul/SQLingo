"""
Execution Plan Analyzer - Identify bottlenecks and issues
"""
from typing import Dict, List, Any
from execution_plan.models import (
    Operation,
    Bottleneck,
    MissingIndex,
    CostMetrics,
    ExecutionPlanSummary
)


class ExecutionPlanAnalyzer:
    """Analyze execution plans for performance issues"""

    # Thresholds for identifying issues
    BOTTLENECK_THRESHOLD = 20.0  # Operations using >20% of total cost
    HIGH_SEVERITY_THRESHOLD = 40.0  # >40% = high severity
    MEDIUM_SEVERITY_THRESHOLD = 20.0  # 20-40% = medium severity

    def analyze(self, parsed_plan: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze parsed execution plan

        Args:
            parsed_plan: Output from ExecutionPlanParser.parse()

        Returns:
            Dictionary with analysis results:
            {
                "summary": ExecutionPlanSummary,
                "bottlenecks": List[Bottleneck],
                "missing_indexes": List[MissingIndex],
                "expensive_operations": List[Operation],
                "recommendations": List[str]
            }
        """
        operations = parsed_plan['operations']
        costs = parsed_plan['costs']
        warnings = parsed_plan['warnings']
        missing_idx_data = parsed_plan['missing_indexes']

        # Calculate cost percentages
        total_cost = costs.total_cost
        if total_cost > 0:
            for op in operations:
                op.cost_percentage = (op.estimated_cost / total_cost) * 100

        # Sort operations by cost (descending)
        operations_sorted = sorted(
            operations,
            key=lambda x: x.estimated_cost,
            reverse=True
        )

        # Identify bottlenecks
        bottlenecks = self._identify_bottlenecks(operations_sorted, total_cost)

        # Convert missing index data to MissingIndex objects
        missing_indexes = self._process_missing_indexes(missing_idx_data)

        # Get top expensive operations
        expensive_operations = operations_sorted[:5]  # Top 5

        # Create summary
        summary = self._create_summary(
            parsed_plan['statement'],
            parsed_plan['database_name'],
            operations_sorted,
            costs,
            warnings
        )

        # Generate recommendations
        recommendations = self._generate_recommendations(
            bottlenecks,
            missing_indexes,
            warnings,
            operations_sorted
        )

        return {
            "summary": summary,
            "bottlenecks": bottlenecks,
            "missing_indexes": missing_indexes,
            "expensive_operations": expensive_operations,
            "recommendations": recommendations,
            "all_operations": operations_sorted  # For detailed view
        }

    def _identify_bottlenecks(
        self,
        operations: List[Operation],
        total_cost: float
    ) -> List[Bottleneck]:
        """Identify operations that are bottlenecks"""
        bottlenecks = []

        for op in operations:
            if op.cost_percentage >= self.BOTTLENECK_THRESHOLD:
                # Determine severity
                if op.cost_percentage >= self.HIGH_SEVERITY_THRESHOLD:
                    severity = "high"
                elif op.cost_percentage >= self.MEDIUM_SEVERITY_THRESHOLD:
                    severity = "medium"
                else:
                    severity = "low"

                # Create description
                description = self._describe_bottleneck(op)

                bottlenecks.append(Bottleneck(
                    operation_type=op.operation_type,
                    cost_percentage=round(op.cost_percentage, 2),
                    estimated_rows=op.estimated_rows,
                    actual_rows=op.actual_rows,
                    description=description,
                    severity=severity
                ))

        return bottlenecks

    def _describe_bottleneck(self, op: Operation) -> str:
        """Create human-readable description of bottleneck"""
        desc_parts = [f"{op.operation_type}"]

        if op.object_name:
            desc_parts.append(f"on {op.object_name}")

        if op.estimated_rows > 1000000:
            desc_parts.append(
                f"processing {op.estimated_rows:,} rows (large dataset)"
            )
        elif op.estimated_rows > 0:
            desc_parts.append(f"processing {op.estimated_rows:,} rows")

        # Check for row estimate mismatch (if actual rows available)
        if op.actual_rows is not None and op.estimated_rows > 0:
            ratio = op.actual_rows / op.estimated_rows
            if ratio > 10 or ratio < 0.1:
                desc_parts.append(
                    f"(estimate mismatch: estimated {op.estimated_rows:,}, "
                    f"actual {op.actual_rows:,})"
                )

        return " ".join(desc_parts)

    def _process_missing_indexes(
        self,
        missing_idx_data: List[Dict[str, Any]]
    ) -> List[MissingIndex]:
        """Convert missing index data to MissingIndex objects"""
        missing_indexes = []

        for idx_data in missing_idx_data:
            impact = idx_data['impact']
            if impact >= 90:
                improvement = "Very High (90%+)"
            elif impact >= 70:
                improvement = "High (70-90%)"
            elif impact >= 50:
                improvement = "Medium (50-70%)"
            else:
                improvement = "Low (<50%)"

            create_index_sql = self._generate_create_index_sql(idx_data)

            missing_indexes.append(MissingIndex(
                table_name=idx_data['table'],
                equality_columns=idx_data['equality_columns'],
                inequality_columns=idx_data['inequality_columns'],
                included_columns=idx_data['included_columns'],
                impact=round(impact, 2),
                estimated_improvement=improvement,
                create_index_sql=create_index_sql
            ))

        missing_indexes.sort(key=lambda x: x.impact, reverse=True)
        return missing_indexes

    def _generate_create_index_sql(self, idx_data: Dict[str, Any]) -> str:
        """Generate a CREATE INDEX DDL statement from missing index data."""
        table = idx_data.get('table', 'UnknownTable')
        eq_cols = idx_data.get('equality_columns', [])
        ineq_cols = idx_data.get('inequality_columns', [])
        inc_cols = idx_data.get('included_columns', [])

        key_cols = eq_cols + ineq_cols
        if not key_cols:
            return ''

        # Build a readable index name
        col_part = '_'.join(c.lstrip('[').rstrip(']') for c in key_cols[:3])
        table_part = table.split('.')[-1].strip('[').strip(']')
        index_name = f"IX_{table_part}_{col_part}"

        key_str = ', '.join(key_cols)
        sql = f"CREATE NONCLUSTERED INDEX [{index_name}]\nON {table} ({key_str})"

        if inc_cols:
            inc_str = ', '.join(inc_cols)
            sql += f"\nINCLUDE ({inc_str})"

        sql += ';'
        return sql

    def _create_summary(
        self,
        statement: str,
        database_name: str,
        operations: List[Operation],
        costs: CostMetrics,
        warnings: List[str]
    ) -> ExecutionPlanSummary:
        """Create execution plan summary"""
        most_expensive_op = "None"
        if operations:
            op = operations[0]  # Already sorted by cost
            most_expensive_op = f"{op.operation_type}"
            if op.object_name:
                most_expensive_op += f" ({op.object_name})"

        # Truncate long statements
        if len(statement) > 200:
            statement = statement[:200] + "..."

        return ExecutionPlanSummary(
            statement=statement,
            database_name=database_name,
            total_operations=len(operations),
            most_expensive_operation=most_expensive_op,
            total_cost=round(costs.total_cost, 4),
            warnings=warnings
        )

    def _generate_recommendations(
        self,
        bottlenecks: List[Bottleneck],
        missing_indexes: List[MissingIndex],
        warnings: List[str],
        operations: List[Operation]
    ) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []

        # Recommendations based on bottlenecks
        for bottleneck in bottlenecks[:3]:  # Top 3 bottlenecks
            if "Scan" in bottleneck.operation_type:
                recommendations.append(
                    f"Consider adding an index to avoid {bottleneck.operation_type} "
                    f"(consuming {bottleneck.cost_percentage:.1f}% of query cost)"
                )
            elif "Loop" in bottleneck.operation_type:
                recommendations.append(
                    f"Review join conditions for {bottleneck.operation_type} "
                    f"(consuming {bottleneck.cost_percentage:.1f}% of query cost)"
                )
            elif "Sort" in bottleneck.operation_type:
                recommendations.append(
                    f"Consider pre-sorting data or adding an index for ORDER BY "
                    f"(Sort consuming {bottleneck.cost_percentage:.1f}% of query cost)"
                )

        # Recommendations based on missing indexes
        if missing_indexes:
            top_missing = missing_indexes[0]
            cols = ", ".join(top_missing.equality_columns[:3])
            recommendations.append(
                f"Create index on {top_missing.table_name}({cols}) "
                f"- estimated {top_missing.estimated_improvement} improvement"
            )

        # Recommendations based on warnings
        for warning in warnings:
            if "Cartesian" in warning:
                recommendations.append(
                    "Fix missing join predicate to avoid Cartesian product"
                )
            elif "tempdb" in warning:
                recommendations.append(
                    "Query is spilling to tempdb - consider increasing memory "
                    "or optimizing the query"
                )
            elif "conversion" in warning:
                recommendations.append(
                    "Fix implicit type conversions to improve performance"
                )

        # Check for table scans on large tables
        for op in operations[:10]:  # Check top 10 operations
            if "Table Scan" in op.operation_type and op.estimated_rows > 10000:
                recommendations.append(
                    f"Table scan on large table ({op.object_name or 'unknown'}) "
                    f"- consider adding an index"
                )
                break  # Only mention once

        # If no specific recommendations, give general advice
        if not recommendations:
            if operations and operations[0].cost_percentage > 30:
                recommendations.append(
                    "The query has one dominant operation. "
                    "Focus optimization efforts there first."
                )
            else:
                recommendations.append(
                    "Query appears reasonably optimized. "
                    "Monitor for performance changes over time."
                )

        return recommendations
