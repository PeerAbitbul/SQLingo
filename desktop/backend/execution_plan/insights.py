"""
AI Insights Generator for Execution Plans

This module generates AI-powered insights using the same AIClient
infrastructure used for SQL generation. This ensures consistency
between BYOK and Managed modes.
"""
import json
from typing import Dict, Any, Optional
from ai.client import AIClient
from ai.base import Message, ChatRequest


async def get_ai_insights(
    ai_client: AIClient,
    analysis: Dict[str, Any],
    statement: str,
    model: str = None
) -> str:
    """
    Get AI-powered insights about the execution plan

    This function is IDENTICAL for both Desktop (BYOK) and Server (Managed).
    The only difference is the API key used to create the AIClient.

    Args:
        ai_client: AIClient instance (with user's or server's API key)
        analysis: Analysis results from ExecutionPlanAnalyzer
        statement: SQL statement being analyzed
        model: Optional specific model to use (overrides default)

    Returns:
        AI-generated insights and recommendations
    """
    prompt = _create_insights_prompt(analysis, statement)

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


def _create_insights_prompt(analysis: Dict[str, Any], statement: str) -> str:
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

    prompt = f"""You are a SQL Server performance expert. Analyze this execution plan and provide optimization insights.

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

**Missing Indexes:**
{missing_indexes_text}

**Top Expensive Operations:**
{expensive_ops_text}

**Current Recommendations:**
{_format_recommendations(recommendations)}

---

Please provide:

1. **Root Cause Analysis** - What's causing the performance issues?

2. **Impact Assessment** - How do these issues affect query performance?

3. **Optimization Strategy** - Specific steps to improve performance (prioritized)

4. **Expected Results** - What improvements can be expected from each optimization?

5. **Additional Considerations** - Any other factors to consider (indexing strategy, query rewrite, statistics, etc.)

Be specific and actionable. Focus on the most impactful optimizations first.
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
