#!/bin/bash

# Script to fix API calls in all game components
# This adds the proper API_CONFIG import and updates API calls

echo "🔧 Fixing API calls in game components..."

# List of files that need fixing (based on the grep results)
FILES=(
    "src/games/SightWords.tsx"
    "src/games/ArtCritic.tsx"
    "src/games/RiddleMaster.tsx"
    "src/games/CodeBreaker.tsx"
    "src/games/DreamInterpreter.tsx"
    "src/games/JokeMaker.tsx"
    "src/games/RadioSongGuess.tsx"
    "src/games/TriviaBlitz.tsx"
    "src/games/MedicalAssistant.tsx"
    "src/games/AtzrisWorld.tsx"
    "src/games/AtziriWorld.tsx"
    "src/games/Chess.tsx"
    "src/games/Checkers.tsx"
    "src/games/Storyteller.tsx"
    "src/games/DotsAndBoxes.tsx"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "Processing $file..."
        
        # Add API_CONFIG import if not present
        if ! grep -q "import API_CONFIG" "$file"; then
            # Find the line with the last import and add after it
            sed -i '' '/^import.*from/a\
import API_CONFIG from '\''../config/api'\'';
' "$file"
        fi
        
        # Replace fetch calls to /api/ask-ai
        sed -i '' 's|fetch(\x27/api/ask-ai\x27|fetch(`${API_CONFIG.BASE_URL}/api/ask-ai`|g' "$file"
        
        # Replace axios.post calls to /api/ask-ai
        sed -i '' 's|axios\.post(\x27/api/ask-ai\x27|axios.post(`${API_CONFIG.BASE_URL}/api/ask-ai`|g' "$file"
        
        echo "✅ Fixed $file"
    else
        echo "⚠️  File not found: $file"
    fi
done

echo "🎉 All API calls have been fixed!"
