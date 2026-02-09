#!/bin/bash

# Read the XML file
XML_CONTENT=$(cat test_execution_plan.xml)

# Escape the XML for JSON
XML_ESCAPED=$(echo "$XML_CONTENT" | jq -Rs .)

# Create JSON payload
PAYLOAD=$(cat <<EOF
{
  "xml_content": $XML_ESCAPED,
  "database_type": "sqlserver",
  "mode": "byok",
  "ai_provider": "openai",
  "ai_model": "gpt-4"
}
EOF
)

# Call the API
echo "Testing execution plan analysis endpoint..."
echo ""
curl -X POST http://localhost:8000/api/execution-plan/analyze \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  2>&1 | jq .
