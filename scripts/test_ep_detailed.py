#!/usr/bin/env python3
"""Test execution plan analysis API with full output"""
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

    if response.status_code == 200:
        result = response.json()
        print(json.dumps(result, indent=2))
    else:
        print(f"Status Code: {response.status_code}")
        print(response.text)

except Exception as e:
    print(f"Exception: {e}")
