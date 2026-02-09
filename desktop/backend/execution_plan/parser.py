"""
XML Parser for SQL Server Execution Plans (.sqlplan files)
"""
import xml.etree.ElementTree as ET
from typing import Dict, List, Optional, Any
from execution_plan.models import Operation, CostMetrics, ExecutionPlanSummary


class ExecutionPlanParser:
    """Parse SQL Server execution plan XML"""

    # XML namespaces used in execution plans
    NAMESPACES = {
        'plan': 'http://schemas.microsoft.com/sqlserver/2004/07/showplan'
    }

    def parse(self, xml_content: str) -> Dict[str, Any]:
        """
        Parse execution plan XML

        Args:
            xml_content: Raw XML content from .sqlplan file

        Returns:
            Dictionary with parsed plan data:
            {
                "statement": str,
                "database_name": str,
                "operations": List[Operation],
                "costs": CostMetrics,
                "warnings": List[str],
                "missing_indexes": List[Dict]
            }

        Raises:
            ValueError: If XML is invalid or not an execution plan
        """
        try:
            root = ET.fromstring(xml_content)
        except ET.ParseError as e:
            raise ValueError(f"Invalid XML: {str(e)}")

        # Verify this is an execution plan
        if not self._is_execution_plan(root):
            raise ValueError(
                "This doesn't appear to be a SQL Server execution plan XML"
            )

        return {
            "statement": self._extract_statement(root),
            "database_name": self._extract_database_name(root),
            "operations": self._extract_operations(root),
            "costs": self._extract_costs(root),
            "warnings": self._extract_warnings(root),
            "missing_indexes": self._extract_missing_indexes(root)
        }

    def _is_execution_plan(self, root: ET.Element) -> bool:
        """Check if XML is a valid execution plan"""
        # Check for ShowPlanXML root element
        if 'ShowPlanXML' not in root.tag:
            return False

        # Check for BatchSequence
        batch = root.find('.//plan:BatchSequence', self.NAMESPACES)
        return batch is not None

    def _extract_statement(self, root: ET.Element) -> str:
        """Extract the SQL statement"""
        stmt_simple = root.find('.//plan:StmtSimple', self.NAMESPACES)
        if stmt_simple is not None:
            return stmt_simple.get('StatementText', 'N/A')

        stmt_cond = root.find('.//plan:StmtCond', self.NAMESPACES)
        if stmt_cond is not None:
            return stmt_cond.get('StatementText', 'N/A')

        return 'Statement not found'

    def _extract_database_name(self, root: ET.Element) -> Optional[str]:
        """Extract database name if available"""
        batch = root.find('.//plan:Batch', self.NAMESPACES)
        if batch is not None:
            return batch.get('Database')
        return None

    def _extract_operations(self, root: ET.Element) -> List[Operation]:
        """Extract all operations from the plan"""
        operations = []

        # Find all RelOp elements (Relational Operators)
        for relop in root.findall('.//plan:RelOp', self.NAMESPACES):
            operation = self._parse_operation(relop)
            if operation:
                operations.append(operation)

        return operations

    def _parse_operation(self, relop: ET.Element) -> Optional[Operation]:
        """Parse a single RelOp element"""
        try:
            # Get operation type (e.g., "Clustered Index Scan")
            physical_op = relop.get('PhysicalOp', 'Unknown')

            # Get cost metrics
            estimated_cost = float(relop.get('EstimatedTotalSubtreeCost', 0))
            estimated_rows = int(float(relop.get('EstimateRows', 0)))
            actual_rows_attr = relop.get('ActualRows')
            actual_rows = int(float(actual_rows_attr)) if actual_rows_attr else None

            # Get object name if available
            object_name = self._extract_object_name(relop)

            # Calculate percentage (will be updated by analyzer)
            return Operation(
                operation_type=physical_op,
                estimated_cost=estimated_cost,
                estimated_rows=estimated_rows,
                actual_rows=actual_rows,
                cost_percentage=0.0,  # Calculated later
                object_name=object_name
            )
        except (ValueError, TypeError) as e:
            # Skip operations with invalid data
            return None

    def _extract_object_name(self, relop: ET.Element) -> Optional[str]:
        """Extract table/index name from operation"""
        # Look for IndexScan or TableScan
        index_scan = relop.find('.//plan:IndexScan', self.NAMESPACES)
        if index_scan is not None:
            obj = index_scan.find('.//plan:Object', self.NAMESPACES)
            if obj is not None:
                schema = obj.get('Schema', '')
                table = obj.get('Table', '')
                index = obj.get('Index', '')
                if table:
                    return f"{schema}.{table}" if schema else table
                return index

        # Look for TableScan
        table_scan = relop.find('.//plan:TableScan', self.NAMESPACES)
        if table_scan is not None:
            obj = table_scan.find('.//plan:Object', self.NAMESPACES)
            if obj is not None:
                schema = obj.get('Schema', '')
                table = obj.get('Table', '')
                if table:
                    return f"{schema}.{table}" if schema else table

        return None

    def _extract_costs(self, root: ET.Element) -> CostMetrics:
        """Extract cost metrics"""
        stmt_simple = root.find('.//plan:StmtSimple', self.NAMESPACES)

        if stmt_simple is not None:
            total_cost = float(
                stmt_simple.get('StatementSubTreeCost', 0)
            )
            compile_time = float(
                stmt_simple.get('StatementCompileTime', 0)
            ) * 1000  # Convert to ms

            estimated_rows = int(
                float(stmt_simple.get('StatementEstRows', 0))
            )

            return CostMetrics(
                total_cost=total_cost,
                compile_time_ms=compile_time if compile_time > 0 else None,
                execution_time_ms=None,  # Not always available
                estimated_rows=estimated_rows,
                actual_rows=None
            )

        # Fallback: calculate from operations
        operations = root.findall('.//plan:RelOp', self.NAMESPACES)
        max_cost = 0.0
        for op in operations:
            cost = float(op.get('EstimatedTotalSubtreeCost', 0))
            max_cost = max(max_cost, cost)

        return CostMetrics(
            total_cost=max_cost,
            compile_time_ms=None,
            execution_time_ms=None,
            estimated_rows=0,
            actual_rows=None
        )

    def _extract_warnings(self, root: ET.Element) -> List[str]:
        """Extract warnings from the plan"""
        warnings = []

        # Look for Warnings elements
        for warning_elem in root.findall('.//plan:Warnings', self.NAMESPACES):
            # No Join Predicate
            if warning_elem.find('.//plan:NoJoinPredicate', self.NAMESPACES) is not None:
                warnings.append(
                    "No join predicate detected - possible Cartesian product"
                )

            # Unmatched Indexes
            unmatched = warning_elem.findall(
                './/plan:UnmatchedIndexes',
                self.NAMESPACES
            )
            if unmatched:
                warnings.append(
                    f"Unmatched indexes detected ({len(unmatched)} instances)"
                )

            # Spills
            spill_to_tempdb = warning_elem.find(
                './/plan:SpillToTempDb',
                self.NAMESPACES
            )
            if spill_to_tempdb is not None:
                warnings.append("Query is spilling to tempdb")

        # Look for implicit conversions
        for convert in root.findall('.//plan:Convert', self.NAMESPACES):
            if convert.get('Implicit') == 'true':
                warnings.append(
                    "Implicit conversion detected - may impact performance"
                )

        return warnings

    def _extract_missing_indexes(self, root: ET.Element) -> List[Dict[str, Any]]:
        """Extract missing index suggestions"""
        missing_indexes = []

        for missing_idx in root.findall(
            './/plan:MissingIndexes/plan:MissingIndexGroup/plan:MissingIndex',
            self.NAMESPACES
        ):
            # Get impact
            group = missing_idx.find('../..', self.NAMESPACES)
            impact = float(group.get('Impact', 0)) if group is not None else 0

            # Get table
            table = missing_idx.get('Table', 'Unknown')

            # Get columns
            equality_cols = []
            inequality_cols = []
            included_cols = []

            # Equality columns (WHERE col = value)
            col_group = missing_idx.find('.//plan:ColumnGroup[@Usage="EQUALITY"]', self.NAMESPACES)
            if col_group is not None:
                for col in col_group.findall('.//plan:Column', self.NAMESPACES):
                    equality_cols.append(col.get('Name', ''))

            # Inequality columns (WHERE col > value)
            col_group = missing_idx.find('.//plan:ColumnGroup[@Usage="INEQUALITY"]', self.NAMESPACES)
            if col_group is not None:
                for col in col_group.findall('.//plan:Column', self.NAMESPACES):
                    inequality_cols.append(col.get('Name', ''))

            # Included columns
            col_group = missing_idx.find('.//plan:ColumnGroup[@Usage="INCLUDE"]', self.NAMESPACES)
            if col_group is not None:
                for col in col_group.findall('.//plan:Column', self.NAMESPACES):
                    included_cols.append(col.get('Name', ''))

            missing_indexes.append({
                'table': table,
                'equality_columns': equality_cols,
                'inequality_columns': inequality_cols,
                'included_columns': included_cols,
                'impact': impact
            })

        return missing_indexes
