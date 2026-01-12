# Phase 1 Testing Checklist

Use this checklist to verify Phase 1 is working correctly before moving to Phase 2.

## Pre-Testing Setup

- [ ] Node.js is installed (`node --version` works)
- [ ] Dependencies are installed (`npm install` completed successfully)
- [ ] `.env` file exists with valid credentials
- [ ] Discord bot token is set in `.env`
- [ ] TMDB API key is set in `.env`
- [ ] Bot is invited to your test Discord server

## Bot Connection Tests

### Test 1: Bot Starts Successfully

- [ ] Run `npm start`
- [ ] No error messages appear
- [ ] "Discord Streaming Bot - Ready!" message displays
- [ ] Bot username and ID are shown
- [ ] Server count is correct
- [ ] Version shows 1.0.0

### Test 2: Bot Shows Online

- [ ] Bot appears in Discord server member list
- [ ] Bot status is green (online)
- [ ] Bot activity shows "Watching movies & TV shows"

### Test 3: Configuration Loading

- [ ] No warnings about missing environment variables
- [ ] Bot connects within 5 seconds
- [ ] Console shows clean startup log

### Test 4: Error Handling

- [ ] Stop the bot with Ctrl+C
- [ ] "Shutting down bot gracefully..." message appears
- [ ] Bot goes offline in Discord
- [ ] No error messages during shutdown

### Test 5: Invalid Token Handling

- [ ] Temporarily remove Discord token from `.env`
- [ ] Run `npm start`
- [ ] Error message "Discord token not found!" appears
- [ ] Bot exits cleanly without crashing
- [ ] Restore token in `.env`

## File Structure Verification

- [ ] `src/bot.js` exists
- [ ] `src/config/config.js` exists
- [ ] `src/config/keys.js` exists
- [ ] `src/commands/` directory exists (empty)
- [ ] `src/interactions/` directory exists (empty)
- [ ] `src/services/` directory exists (empty)
- [ ] `src/ui/` directory exists (empty)
- [ ] `src/utils/` directory exists (empty)
- [ ] `package.json` exists with correct dependencies
- [ ] `.gitignore` exists
- [ ] `README.md` exists

## Expected Results

✅ **All tests passing?** Phase 1 is complete!

You're ready to move to Phase 2: API Integration

❌ **Some tests failing?** Review the troubleshooting guide in `SETUP.md`

## Notes

Write any observations or issues here:

```
[Your notes here]
```
