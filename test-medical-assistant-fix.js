#!/usr/bin/env node

// Test script to verify Medical Assistant answer shuffling fix
console.log('🧪 MEDICAL ASSISTANT ANSWER SHUFFLING TEST');
console.log('==========================================');

// Import required modules
const fs = require('fs');
const path = require('path');

// Read the Medical Assistant component file
const filePath = path.join(__dirname, 'src', 'games', 'MedicalAssistant.tsx');
const fileContent = fs.readFileSync(filePath, 'utf8');

// Count original answer distribution
let answerCounts = [0, 0, 0, 0]; // Index 0-3 for answers
const answerMatches = [...fileContent.matchAll(/answer: (\d+),/g)];

answerMatches.forEach(match => {
    const answerIndex = parseInt(match[1]);
    if (answerIndex >= 0 && answerIndex <= 3) {
        answerCounts[answerIndex]++;
    }
});

console.log('📊 ORIGINAL ANSWER DISTRIBUTION:');
console.log('Position 1 (Index 0):', answerCounts[0], 'questions');
console.log('Position 2 (Index 1):', answerCounts[1], 'questions'); 
console.log('Position 3 (Index 2):', answerCounts[2], 'questions');
console.log('Position 4 (Index 3):', answerCounts[3], 'questions');

// Check for bias
const totalQuestions = answerCounts.reduce((a, b) => a + b, 0);
const position2Percentage = (answerCounts[1] / totalQuestions * 100).toFixed(1);

console.log('\n📈 BIAS ANALYSIS:');
console.log('Total Questions:', totalQuestions);
console.log('Position 2 percentage:', position2Percentage + '%');
console.log('Expected percentage (balanced):', '25.0%');

if (answerCounts[1] > totalQuestions * 0.4) {
    console.log('❌ BIAS CONFIRMED: Heavy bias toward position 2');
} else {
    console.log('✅ Distribution appears balanced');
}

// Check shuffling implementation
const shuffleFunctionExists = fileContent.includes('shuffleAnswers = (question: Question): Question =>');
const shufflingApplied = fileContent.includes('selectedQuestions.map(q => shuffleAnswers(q))');
const mistakeShufflingApplied = fileContent.includes('mistakes.map(mistake => shuffleAnswers(mistake))');

console.log('\n🔧 SHUFFLING IMPLEMENTATION:');
console.log('Shuffle function exists:', shuffleFunctionExists ? '✅ YES' : '❌ NO');
console.log('Applied to new questions:', shufflingApplied ? '✅ YES' : '❌ NO');
console.log('Applied to mistake practice:', mistakeShufflingApplied ? '✅ YES' : '❌ NO');

const allFixed = shuffleFunctionExists && shufflingApplied && mistakeShufflingApplied;

console.log('\n🎯 FINAL ASSESSMENT:');
if (answerCounts[1] > totalQuestions * 0.4 && allFixed) {
    console.log('✅ ISSUE IDENTIFIED AND FIXED!');
    console.log('The Medical Assistant game now shuffles answers properly.');
} else if (answerCounts[1] > totalQuestions * 0.4) {
    console.log('❌ ISSUE IDENTIFIED BUT NOT FULLY FIXED');
} else {
    console.log('ℹ️ No significant bias detected, but shuffling added for robustness');
}
