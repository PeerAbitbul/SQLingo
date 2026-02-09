# Execution Plan Analysis - User Guide

## Overview

Qognix now supports SQL Server execution plan analysis directly in the chat interface. Get automated bottleneck detection, missing index recommendations, and AI-powered optimization insights.

## How to Analyze an Execution Plan

### Method 1: Drag & Drop (Recommended)

1. In SQL Server Management Studio (SSMS):
   - Run your query
   - Right-click on the execution plan
   - Select "Save Execution Plan As..."
   - Save with `.sqlplan` extension

2. In Qognix:
   - Open any chat
   - Drag the `.sqlplan` file from your file system
   - Drop it anywhere in the chat window
   - Analysis starts automatically

### Method 2: Paste XML

1. In SSMS:
   - Right-click on the execution plan
   - Select "Show Execution Plan XML"
   - Copy all the XML content (Ctrl+A, Ctrl+C)

2. In Qognix:
   - Paste the XML into the chat input box
   - Press Send or Enter
   - Analysis starts automatically

## What You'll Get

### Execution Plan Summary
- The SQL query being analyzed
- Total query cost
- Number of operations
- Most expensive operation
- SQL Server warnings

### Bottlenecks
Operations consuming >20% of query cost, classified by severity:
- **HIGH**: >50% of cost
- **MEDIUM**: 20-50% of cost

Each bottleneck shows:
- Operation type (e.g., "Clustered Index Scan")
- Percentage of total cost
- Estimated and actual row counts
- Detailed description

### Missing Indexes
SQL Server's index recommendations with:
- Table name
- Impact percentage
- Recommended columns:
  - Equality columns (for WHERE clause)
  - Inequality columns (for range conditions)
  - Include columns (for covering index)
- Estimated improvement level

### Optimization Recommendations
Prioritized list of specific actions to improve performance:
- Index creation suggestions
- Query rewrite recommendations
- Statistics updates
- Configuration changes

### AI Insights
When configured with an AI provider, you get:
- Root cause analysis
- Impact assessment
- Step-by-step optimization strategy
- Expected performance improvements
- Additional considerations

## Configuration

### BYOK Mode (Bring Your Own Key)
1. Go to Settings > API Keys
2. Add your OpenAI, Claude, or Gemini API key
3. Select your preferred AI provider
4. Analysis uses your own API key

### Managed Mode
1. Sign in to your Qognix account
2. Analysis uses Qognix's AI infrastructure
3. Billed as part of your subscription

## Examples

### Example 1: High-Cost Table Scan

**Bottleneck Found:**
```
Clustered Index Scan on [Orders] (HIGH)
- Cost: 85% of total query cost
- Processing 1,000,000 rows
```

**Missing Index:**
```
Table: [Orders]
Impact: 95%
Create index on: [CustomerId], [OrderDate]
Include: [TotalAmount], [Status]
```

**Recommendation:**
```
CREATE NONCLUSTERED INDEX IX_Orders_CustomerId_OrderDate
ON [Orders]([CustomerId], [OrderDate])
INCLUDE ([TotalAmount], [Status])
```

### Example 2: Implicit Conversion

**Warning Detected:**
```
Implicit conversion from VARCHAR to NVARCHAR
Causing index not to be used
```

**AI Insight:**
```
The query is comparing a VARCHAR column with an NVARCHAR
parameter, causing SQL Server to convert all rows before
comparison. This prevents index usage.

Fix: Ensure parameter types match column types in your
application code.
```

## Supported File Types

**Accepted:**
- `.sqlplan` files only

**Rejected:**
- `.txt` files
- `.pdf` files
- `.xml` files (unless content is valid execution plan XML)
- Any other file type

Note: The system validates that the content is actual execution plan XML, not just any XML file.

## Tips for Best Results

1. **Run the query first**: Make sure the plan includes actual execution statistics
2. **Use realistic data**: Test with production-like data volumes
3. **Include SET options**: Capture all relevant session settings
4. **Check warnings**: SQL Server warnings often indicate serious issues
5. **Prioritize high-impact fixes**: Focus on bottlenecks >50% cost first

## Troubleshooting

### "Only .sqlplan files are supported"
- Rename your file to have `.sqlplan` extension
- Or use Method 2 (paste XML) instead

### "Analysis failed: Invalid execution plan XML"
- Verify you copied the complete XML from SSMS
- Ensure the execution plan was generated successfully
- Try saving as `.sqlplan` file instead

### No AI insights appearing
- Check that you have an API key configured (BYOK mode)
- Or verify you're signed in (Managed mode)
- Basic analysis still works without AI insights

### Analysis takes too long
- Large execution plans (>10MB) may take 10-20 seconds
- Check your internet connection
- Verify the AI provider API is accessible

## Privacy & Security

- **BYOK Mode**: Execution plans are sent only to your chosen AI provider (OpenAI, Claude, or Gemini)
- **Managed Mode**: Execution plans are processed through Qognix's secure infrastructure
- **No Storage**: Execution plans are analyzed in real-time and not stored permanently
- **Your Data**: Table names, column names, and query text are included in the AI analysis

## Limitations

Current limitations:
- SQL Server execution plans only (PostgreSQL and MySQL coming soon)
- Text-based analysis (visual tree view coming soon)
- Single plan analysis (comparison mode coming soon)
- No historical tracking (coming soon)

## Getting Help

If you encounter issues:
1. Check this guide for common problems
2. Verify your configuration (API keys, login status)
3. Try with a simple execution plan first
4. Contact support with:
   - Error message shown
   - File size of the `.sqlplan` file
   - Your Qognix version

## Feedback

We're continuously improving this feature. Let us know:
- What types of queries you're analyzing
- What insights are most helpful
- What additional features you need
- Any issues you encounter

---

**Version:** 1.0.0
**Last Updated:** December 2, 2024
