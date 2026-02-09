# Quick Start: Execution Plan Analysis

## Two Simple Ways to Analyze

### 1. Drag & Drop (Easiest)
1. Save execution plan from SSMS as `.sqlplan`
2. Drag file into Qognix chat
3. Get instant analysis

### 2. Paste XML
1. Copy execution plan XML from SSMS
2. Paste into Qognix chat input
3. Press Send

## What You Get

- Query cost and performance summary
- Bottlenecks (operations >20% of cost)
- Missing index recommendations
- AI-powered optimization insights

## Example Output

```
# Execution Plan Analysis

## Summary
- Query Cost: 12.5
- Total Operations: 8
- Most Expensive: Clustered Index Scan ([Orders])

## Bottlenecks Found

### 1. Clustered Index Scan (HIGH)
- Cost: 85.5% of total
- Description: Scanning 1,000,000 rows

## Missing Indexes

### 1. [Orders]
- Impact: 95% (High)
- Equality Columns: [CustomerId]
- Include Columns: [OrderDate], [TotalAmount]

## Recommendations
1. Create index on [Orders]([CustomerId]) INCLUDE ([OrderDate], [TotalAmount])
2. Update statistics on [Orders] table
3. Consider partitioning for large tables

## AI Insights
The main bottleneck is a full table scan on the Orders table.
Creating the recommended index will reduce I/O by 95% and
improve query performance by an estimated 20x...
```

## Setup Required

### BYOK Mode (Free)
Settings > API Keys > Add your OpenAI/Claude/Gemini key

### Managed Mode (Paid)
Sign in to your Qognix account

## Need Help?

See [EXECUTION_PLAN_USER_GUIDE.md](EXECUTION_PLAN_USER_GUIDE.md) for detailed instructions.
