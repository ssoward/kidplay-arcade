# Sight Words Enhancement Testing Guide

## Testing the New "No Repeated Words" Feature

### Test Scenario 1: First Time Usage
1. Open the Sight Words game
2. Select "Easy" difficulty
3. Observe: "Words used this level: 0" should be displayed
4. Generate first set of words
5. Note the 20 words presented
6. Complete the word set
7. Generate next set of words
8. Verify: New words should be different from the first set

### Test Scenario 2: Word History Persistence
1. Use the game and complete several word sets
2. Note the "Words used this level" count increasing
3. Close the browser/tab
4. Reopen the game
5. Verify: Word count is preserved
6. Generate new words
7. Verify: No words from previous sessions are repeated

### Test Scenario 3: Difficulty Level Separation
1. Practice words on "Easy" level
2. Switch to "Medium" level
3. Observe: "Words used this level" resets to count for medium level
4. Generate words for medium
5. Switch back to "Easy"
6. Verify: Easy level count is preserved separately

### Test Scenario 4: Clear History Feature
1. Build up a word history (multiple sets)
2. Note the "Words used this level" count
3. Click "Clear Word History" button
4. Verify: Count resets to 0
5. Generate new words
6. Verify: Previously seen words can now appear again

### Test Scenario 5: AI Integration
1. Use browser developer tools (F12)
2. Go to Network tab
3. Generate new words
4. Check the API request to `/api/ask-ai`
5. Verify: Request includes "Previously used words to avoid: [word list]"

### Expected Behaviors

#### ✅ Correct Behaviors
- [ ] No word repetition within same difficulty level
- [ ] Word history persists across browser sessions
- [ ] Each difficulty level maintains separate word history
- [ ] Clear history button resets word tracking
- [ ] Word count display updates correctly
- [ ] AI requests include previous words to avoid
- [ ] Fallback words work if AI request fails

#### ❌ Issues to Report
- Repeated words in same difficulty session
- Word history not persisting
- Word count not updating
- Clear history not working
- UI elements not displaying correctly

### Browser Storage Inspection

To verify localStorage is working:
1. Open browser Developer Tools (F12)
2. Go to Application/Storage tab
3. Check Local Storage for current domain
4. Look for keys:
   - `sightwords-used-words-easy`
   - `sightwords-used-words-medium` 
   - `sightwords-used-words-hard`
   - `sightwords-total-score`

### Performance Considerations

The enhancement:
- ✅ Maintains fast loading times
- ✅ Uses minimal browser storage
- ✅ Handles large word histories efficiently
- ✅ Gracefully degrades if storage is unavailable

---

**Test Guide Created**: May 31, 2025  
**Feature**: Sight Words - No Repeated Words  
**Status**: Ready for Testing
