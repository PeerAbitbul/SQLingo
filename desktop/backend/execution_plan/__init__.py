"""
Execution Plan Analysis Module

This module provides tools for analyzing SQL Server execution plans (.sqlplan files).

Features:
- Parse XML execution plan files
- Identify bottlenecks and expensive operations
- Detect missing indexes
- Generate AI-powered optimization recommendations

Usage:
    from execution_plan.parser import ExecutionPlanParser
    from execution_plan.analyzer import ExecutionPlanAnalyzer

    parser = ExecutionPlanParser()
    parsed = parser.parse(xml_content)

    analyzer = ExecutionPlanAnalyzer()
    analysis = analyzer.analyze(parsed)
"""

__version__ = "0.1.0"
