#!/bin/bash

# Test KidPlay Arcade AI Endpoints
# Usage: ./test-ai-endpoints.sh [IP_ADDRESS]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="${1:-localhost}"
if [[ "$BASE_URL" != http* ]]; then
    BASE_URL="http://$BASE_URL"
fi

print_status() {
    echo -e "${GREEN}[TEST]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_status "Testing AI endpoints at $BASE_URL"

# Test health endpoint
print_status "Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s "$BASE_URL/api/health" || echo "ERROR")
if echo "$HEALTH_RESPONSE" | grep -q "OK"; then
    print_success "Health endpoint working"
    echo "$HEALTH_RESPONSE" | jq . 2>/dev/null || echo "$HEALTH_RESPONSE"
else
    print_error "Health endpoint failed: $HEALTH_RESPONSE"
fi

# Test AI chat endpoint
print_status "Testing AI chat endpoint..."
AI_CHAT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/ask-ai" \
    -H "Content-Type: application/json" \
    -d '{"history":[{"role":"user","content":"Say hello in one word"}]}' || echo "ERROR")

if echo "$AI_CHAT_RESPONSE" | grep -q "message"; then
    print_success "AI chat endpoint working"
    echo "$AI_CHAT_RESPONSE" | jq . 2>/dev/null || echo "$AI_CHAT_RESPONSE"
else
    print_error "AI chat endpoint failed: $AI_CHAT_RESPONSE"
fi

# Test Twenty Questions format (what the game actually uses)
print_status "Testing Twenty Questions AI format..."
TWENTY_Q_RESPONSE=$(curl -s -X POST "$BASE_URL/api/ask-ai" \
    -H "Content-Type: application/json" \
    -d '{
        "history": [
            {"role": "system", "content": "You are playing Twenty Questions. I am thinking of something. Ask me yes/no questions to guess what it is. Ask only one question at a time."},
            {"role": "user", "content": "I am thinking of something. Ask me your first question."}
        ]
    }' || echo "ERROR")

if echo "$TWENTY_Q_RESPONSE" | grep -q "message"; then
    print_success "Twenty Questions AI format working"
    echo "$TWENTY_Q_RESPONSE" | jq . 2>/dev/null || echo "$TWENTY_Q_RESPONSE"
else
    print_error "Twenty Questions AI format failed: $TWENTY_Q_RESPONSE"
fi

# Test word generator
print_status "Testing Word Generator AI..."
WORD_GEN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/ask-ai" \
    -H "Content-Type: application/json" \
    -d '{
        "game": "word-guess-generator",
        "difficulty": "easy",
        "systemPrompt": "Generate a simple word for a word guessing game. Return only the word, nothing else.",
        "userMessage": "Generate an easy difficulty word"
    }' || echo "ERROR")

if echo "$WORD_GEN_RESPONSE" | grep -q "word"; then
    print_success "Word Generator working"
    echo "$WORD_GEN_RESPONSE" | jq . 2>/dev/null || echo "$WORD_GEN_RESPONSE"
else
    print_error "Word Generator failed: $WORD_GEN_RESPONSE"
fi

print_status "AI endpoint testing completed!"
