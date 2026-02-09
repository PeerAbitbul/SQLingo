#!/usr/bin/env python3
"""Test execution plan analysis API"""
import json
import requests

# Read the XML file
with open('test_execution_plan.xml', 'r') as f:
    xml_content = f.read()

# Create payload
payload = {
    "xml_content": xml_content,
    "database_type": "sqlserver",
    "mode": "byok",
    "ai_provider": "openai",
    "ai_model": "gpt-4"
}

# Call the API
print("Testing execution plan analysis endpoint...")
print()

try:
    response = requests.post(
        'http://localhost:8000/api/execution-plan/analyze',
        json=payload,
        timeout=30
    )

    print(f"Status Code: {response.status_code}")
    print()

    if response.status_code == 200:
        result = response.json()
        print("SUCCESS!")
        print()
        print("Summary:")
        print(f"  - Statement: {result['summary']['statement'][:100]}...")
        print(f"  - Total Cost: {result['summary']['total_cost']}")
        print(f"  - Total Operations: {result['summary']['total_operations']}")
        print(f"  - Most Expensive: {result['summary']['most_expensive_operation']}")
        print(f"  - Warnings: {len(result['summary']['warnings'])}")
        print()
        print(f"Bottlenecks Found: {len(result['bottlenecks'])}")
        print(f"Missing Indexes: {len(result['missing_indexes'])}")
        print(f"Recommendations: {len(result['recommendations'])}")
        print()

        if result['missing_indexes']:
            print("Missing Indexes Details:")
            for idx in result['missing_indexes']:
                print(f"  - Table: {idx['table_name']}")
                print(f"    Impact: {idx['impact']}%")
                print(f"    Equality Columns: {idx['equality_columns']}")
                print(f"    Include Columns: {idx['included_columns']}")
    else:
        print("ERROR!")
        print(response.text)

except Exception as e:
    print(f"Exception: {e}")
