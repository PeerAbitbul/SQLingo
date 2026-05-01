"""
AI Insights Generator for Execution Plans

This module generates AI-powered insights using the same AIClient
infrastructure used for SQL generation. This ensures consistency
between BYOK and Managed modes.
"""
from typing import Dict, Any, Optional
from ai.client import AIClient
from ai.base import Message, ChatRequest


async def get_ai_insights(
    ai_client: AIClient,
    analysis: Dict[str, Any],
    statement: str,
    model: str = None,
    connected_database: str = None,
    connected_db_type: str = None,
) -> str:
    """
    Get AI-powered insights about the execution plan.

    Args:
        ai_client: AIClient instance (with user's or server's API key)
        analysis: Analysis results from ExecutionPlanAnalyzer
        statement: SQL statement being analyzed
        model: Optional specific model to use (overrides default)
        connected_database: The database name the chat is currently connected to
        connected_db_type: The database engine type of the current connection
    """
    prompt = _create_insights_prompt(analysis, statement, connected_database, connected_db_type)

    # Create chat request
    request = ChatRequest(
        messages=[Message(role="user", content=prompt)],
        temperature=0.7,
        max_tokens=4096,  # Increased for detailed execution plan analysis
        model=model  # Pass model if provided
    )

    # Call AI (same for BYOK and Managed)
    response = ai_client.client.chat(request)

    return response.content


def _create_insights_prompt(
    analysis: Dict[str, Any],
    statement: str,
    connected_database: str = None,
    connected_db_type: str = None,
) -> str:
    """
    Create prompt for AI analysis

    This prompt is IDENTICAL for Desktop and Server.
    """
    # Extract key data
    bottlenecks = analysis.get('bottlenecks', [])
    missing_indexes = analysis.get('missing_indexes', [])
    summary = analysis.get('summary')
    recommendations = analysis.get('recommendations', [])
    expensive_ops = analysis.get('expensive_operations', [])

    # Format bottlenecks
    bottlenecks_text = _format_bottlenecks(bottlenecks)

    # Format missing indexes
    missing_indexes_text = _format_missing_indexes(missing_indexes)

    # Format expensive operations
    expensive_ops_text = _format_expensive_operations(expensive_ops)

    # Attach create_index_sql for each missing index if available
    missing_index_sqls = []
    for idx in missing_indexes:
        sql = getattr(idx, 'create_index_sql', None)
        if sql:
            missing_index_sqls.append(sql)
    index_sql_block = '\n\n'.join(f"```sql\n{s}\n```" for s in missing_index_sqls) if missing_index_sqls else ''
    index_sql_section = ('**Suggested CREATE INDEX statements:**\n' + index_sql_block) if index_sql_block else ''

    # Build database context section
    plan_db = (summary.database_name or '').strip('[]').lower() if summary and summary.database_name else None
    conn_db = connected_database.strip('[]').lower() if connected_database else None

    if conn_db and plan_db and plan_db == conn_db:
        db_context = (
            f"**Database Context:** The execution plan is from `{summary.database_name}`, "
            f"which matches the connected database (`{connected_database}`, {connected_db_type or 'unknown'}). "
            f"You may provide deep schema-aware recommendations."
        )
    elif conn_db:
        db_context = (
            f"**Database Context:** Connected to `{connected_database}` ({connected_db_type or 'unknown'}). "
            f"The execution plan source database does not match or is unknown. "
            f"Base recommendations only on data explicitly present in this analysis."
        )
    else:
        db_context = (
            "**Database Context:** No active database connection. "
            "Base recommendations only on data explicitly present in this analysis."
        )

    prompt = f"""You are a SQL Server performance expert. Analyze this execution plan and provide deep, actionable insights.

**STRICT RULES — follow exactly:**
1. Only reference object names (tables, indexes, schemas) that appear explicitly in the data below. Never invent or guess names.
2. Do NOT write ALTER INDEX commands — you do not have existing index names from the plan.
3. For UPDATE STATISTICS, use only table names that appear in the plan data below.
4. Do NOT apply functions (TRY_CONVERT, CAST) to indexed columns in WHERE clauses — this destroys sargability.
5. Do NOT change JOIN types (e.g. LEFT JOIN → INNER JOIN) — join semantics are business logic decisions, not performance optimizations.
6. If you are unsure about something, say so explicitly rather than guessing.

{db_context}

**SQL Statement:**
```sql
{statement[:500]}{'...' if len(statement) > 500 else ''}
```

**Execution Plan Summary:**
- Total Operations: {summary.total_operations if summary else 'N/A'}
- Total Cost: {summary.total_cost if summary else 'N/A'}
- Most Expensive Operation: {summary.most_expensive_operation if summary else 'N/A'}
- Warnings: {len(summary.warnings) if summary else 0}

**Bottlenecks Identified:**
{bottlenecks_text}

**Missing Indexes (auto-detected by SQL Server engine — use these exact table/column names):**
{missing_indexes_text}
{index_sql_section}

**Top Expensive Operations:**
{expensive_ops_text}

**Current Recommendations:**
{_format_recommendations(recommendations)}

---

Respond with the following sections. Include SQL code blocks where relevant.

## Root Cause
One paragraph explaining what is causing the slowness. Be specific about which operations and why.

## Fixes (ordered by impact)

For each fix:
- What the problem is
- The exact SQL (```sql block```) — only use names from the plan data above
- Why this helps and expected improvement

Cover only what the plan data actually shows:
- Missing indexes: use the CREATE INDEX statements from "Suggested CREATE INDEX statements" above, unchanged
- Implicit type conversions if detected in warnings
- Table/index scans on large tables if present in operations
- Do NOT fabricate fixes for issues not present in the data

## Query Rewrite (if applicable)
Only if the SQL statement above clearly has a rewriteable pattern. Skip entirely if not applicable.

## Statistics & Maintenance
Only `UPDATE STATISTICS [table]` for tables that appear in the plan above. No invented index names.
"""

    return prompt


def _format_bottlenecks(bottlenecks: list) -> str:
    """Format bottlenecks for the prompt"""
    if not bottlenecks:
        return "No significant bottlenecks identified (all operations < 20% of total cost)"

    lines = []
    for i, b in enumerate(bottlenecks[:5], 1):  # Top 5
        severity_emoji = {
            'high': '🔴',
            'medium': '🟡',
            'low': '🟢'
        }.get(b.severity, '')

        lines.append(
            f"{i}. {severity_emoji} **{b.operation_type}** "
            f"({b.cost_percentage:.1f}% of total cost)\n"
            f"   - {b.description}\n"
            f"   - Severity: {b.severity.upper()}"
        )

    return "\n".join(lines)


def _format_missing_indexes(missing_indexes: list) -> str:
    """Format missing indexes for the prompt"""
    if not missing_indexes:
        return "No missing indexes detected by SQL Server"

    lines = []
    for i, idx in enumerate(missing_indexes[:3], 1):  # Top 3
        eq_cols = ', '.join(idx.equality_columns) if idx.equality_columns else 'N/A'
        ineq_cols = ', '.join(idx.inequality_columns) if idx.inequality_columns else 'N/A'
        inc_cols = ', '.join(idx.included_columns) if idx.included_columns else 'N/A'

        lines.append(
            f"{i}. **{idx.table_name}** (Impact: {idx.impact:.1f}%, "
            f"Improvement: {idx.estimated_improvement})\n"
            f"   - Equality columns: {eq_cols}\n"
            f"   - Inequality columns: {ineq_cols}\n"
            f"   - Included columns: {inc_cols}"
        )

    return "\n".join(lines)


def _format_expensive_operations(operations: list) -> str:
    """Format expensive operations for the prompt"""
    if not operations:
        return "No operations data available"

    lines = []
    for i, op in enumerate(operations[:5], 1):  # Top 5
        obj_name = f" on {op.object_name}" if op.object_name else ""
        rows_info = f"{op.estimated_rows:,} rows"

        if op.actual_rows is not None:
            rows_info += f" (actual: {op.actual_rows:,})"

        lines.append(
            f"{i}. **{op.operation_type}**{obj_name} - "
            f"{op.cost_percentage:.1f}% cost, {rows_info}"
        )

    return "\n".join(lines)


def _format_recommendations(recommendations: list) -> str:
    """Format current recommendations"""
    if not recommendations:
        return "No specific recommendations generated"

    return "\n".join(f"- {rec}" for rec in recommendations)


async def get_ai_comparison(
    ai_client: AIClient,
    analysis_a: Dict[str, Any],
    analysis_b: Dict[str, Any],
    statement_a: str,
    statement_b: str,
    model: str = None,
) -> str:
    """
    Compare two execution plans using AI and return a structured verdict.
    """
    prompt = _create_comparison_prompt(analysis_a, analysis_b, statement_a, statement_b)
    request = ChatRequest(
        messages=[Message(role="user", content=prompt)],
        temperature=0.7,
        max_tokens=4096,
        model=model
    )
    response = ai_client.client.chat(request)
    return response.content


def _format_operations_table(operations: list, total_cost: float) -> str:
    """Format top operations as a cost-ranked table for the comparison prompt."""
    if not operations:
        return "No operations data available"
    sorted_ops = sorted(operations, key=lambda o: o.estimated_cost, reverse=True)
    lines = ["| # | Operation | Table/Object | Cost | Cost% |",
             "|---|-----------|-------------|------|-------|"]
    for i, op in enumerate(sorted_ops[:10], 1):
        pct = (op.estimated_cost / total_cost * 100) if total_cost > 0 else 0
        obj = op.object_name or "—"
        lines.append(f"| {i} | {op.operation_type} | {obj} | {op.estimated_cost:.4f} | {pct:.1f}% |")
    return "\n".join(lines)


def _extract_table_names(operations: list) -> list:
    """Extract unique table/object names referenced in operations."""
    seen = set()
    names = []
    for op in operations:
        if op.object_name and op.object_name not in seen:
            seen.add(op.object_name)
            names.append(op.object_name)
    return names


def _create_comparison_prompt(
    analysis_a: Dict[str, Any],
    analysis_b: Dict[str, Any],
    statement_a: str,
    statement_b: str,
) -> str:
    summary_a = analysis_a.get('summary')
    summary_b = analysis_b.get('summary')
    ops_a = analysis_a.get('expensive_operations', [])
    ops_b = analysis_b.get('expensive_operations', [])
    missing_a = analysis_a.get('missing_indexes', [])
    missing_b = analysis_b.get('missing_indexes', [])
    warnings_a = summary_a.warnings if summary_a else []
    warnings_b = summary_b.warnings if summary_b else []

    cost_a = summary_a.total_cost if summary_a else 0
    cost_b = summary_b.total_cost if summary_b else 0
    cost_diff = ((cost_a - cost_b) / cost_a * 100) if cost_a > 0 else 0
    better = 'A' if cost_b > cost_a else 'B'
    worse  = 'B' if cost_b > cost_a else 'A'

    tables_a = _extract_table_names(ops_a)
    tables_b = _extract_table_names(ops_b)
    tables_only_in_a = [t for t in tables_a if t not in tables_b]
    tables_only_in_b = [t for t in tables_b if t not in tables_a]

    ops_table_a = _format_operations_table(ops_a, cost_a)
    ops_table_b = _format_operations_table(ops_b, cost_b)

    missing_a_txt = _format_missing_indexes(missing_a) if missing_a else "None"
    missing_b_txt = _format_missing_indexes(missing_b) if missing_b else "None"

    return f"""You are a SQL Server performance expert. Compare these two execution plans and provide a precise, structured verdict.

⚠️ CRITICAL ACCURACY RULES — read before answering:
1. The cost percentages below are CALCULATED FROM THE RAW PLAN DATA. Use these exact numbers. Do NOT recalculate or estimate.
2. A node is a bottleneck ONLY if its Cost% column shows > 20%. Do not call a node a bottleneck if its cost is low.
3. The "Total Cost" row is the single authoritative cost for each plan. Do NOT add up individual operation costs.
4. If the same table appears in both plans but with different operation types (e.g. Scan vs Seek), call that out as the KEY change.
5. If a table name appears in Plan A but NOT in Plan B (or vice versa), flag it — the user may have switched to a different table (e.g. a TEST table).
6. Join strategy changes (Nested Loops → Hash Match → Merge Join) are significant. Name them explicitly.

---

**Plan A — SQL Statement:**
```sql
{statement_a[:500]}{'...' if len(statement_a) > 500 else ''}
```
**Plan A — Total Cost: {cost_a:.4f} | Operations: {summary_a.total_operations if summary_a else 'N/A'} | Warnings: {len(warnings_a)}**

**Plan A — Top Operations (ranked by cost, highest first):**
{ops_table_a}

**Plan A — Missing Indexes suggested by SQL Server:**
{missing_a_txt}

**Plan A — Warnings:** {', '.join(warnings_a) if warnings_a else 'None'}

---

**Plan B — SQL Statement:**
```sql
{statement_b[:500]}{'...' if len(statement_b) > 500 else ''}
```
**Plan B — Total Cost: {cost_b:.4f} | Operations: {summary_b.total_operations if summary_b else 'N/A'} | Warnings: {len(warnings_b)}**

**Plan B — Top Operations (ranked by cost, highest first):**
{ops_table_b}

**Plan B — Missing Indexes suggested by SQL Server:**
{missing_b_txt}

**Plan B — Warnings:** {', '.join(warnings_b) if warnings_b else 'None'}

---

**Table name diff:**
- Tables in Plan A only: {', '.join(tables_only_in_a) if tables_only_in_a else 'None'}
- Tables in Plan B only: {', '.join(tables_only_in_b) if tables_only_in_b else 'None'}
- Tables in both plans: {', '.join(t for t in tables_a if t in tables_b) or 'None'}

**Overall cost: Plan {worse} costs {abs(cost_diff):.1f}% more than Plan {better}.**

---

Now respond with the following sections:

## Verdict
One sentence stating which plan is better, by what %, and the single most important reason (based on the data above).

## Root Cause of Improvement
Explain precisely WHY the better plan is cheaper. Focus on:
- The #1 most expensive operation in Plan A and what replaced it in Plan B (use the cost% table)
- Any Scan→Seek upgrades — name the table and the cost change
- Any join strategy changes (Nested Loops→Hash Match etc.) — name the table
- If different tables were used (see table diff above) — note this and its implications
- Resolved missing indexes from Plan A

## Remaining Bottlenecks in the Better Plan
List only operations with Cost% > 20% from the better plan's table above. If none, say "No significant bottlenecks remain."

## Next Step
One specific, actionable recommendation based on the remaining bottleneck. Include the table name and column if possible. Skip if the plan is already optimal.
"""


def generate_summary_for_chat(analysis: Dict[str, Any]) -> str:
    """
    Generate a brief summary to display in chat before AI analysis

    Args:
        analysis: Analysis results from ExecutionPlanAnalyzer

    Returns:
        Formatted summary text for display in chat
    """
    summary = analysis.get('summary')
    bottlenecks = analysis.get('bottlenecks', [])
    missing_indexes = analysis.get('missing_indexes', [])

    lines = [
        "**Execution Plan Analysis**",
        "",
        f"**Query Cost:** {summary.total_cost if summary else 'N/A'}",
        f"**Total Operations:** {summary.total_operations if summary else 'N/A'}",
        f"**Bottlenecks Found:** {len(bottlenecks)}",
        f"**Missing Indexes:** {len(missing_indexes)}",
        ""
    ]

    if bottlenecks:
        lines.append("**Top Bottlenecks:**")
        for b in bottlenecks[:3]:
            severity_icon = {
                'high': '🔴',
                'medium': '🟡',
                'low': '🟢'
            }.get(b.severity, '')
            lines.append(
                f"{severity_icon} {b.operation_type} - {b.cost_percentage:.1f}%"
            )
        lines.append("")

    if missing_indexes:
        lines.append("**Missing Indexes:**")
        for idx in missing_indexes[:2]:
            lines.append(
                f"- {idx.table_name} (Impact: {idx.impact:.0f}%)"
            )
        lines.append("")

    lines.append("*Getting AI insights...*")

    return "\n".join(lines)
