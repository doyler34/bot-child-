# ✅ Railway Deployment Checklist

## Pre-Deployment
- [ ] Code is tested locally and working
- [ ] `.gitignore` excludes `node_modules`, `.env`, `data/`
- [ ] `package.json` has correct start script
- [ ] Environment variables documented

## GitHub Setup
- [ ] Repository created on GitHub
- [ ] Code pushed to main branch
- [ ] `.env` file NOT committed (security!)

## Railway Setup
- [ ] Account created at railway.app
- [ ] GitHub repository connected
- [ ] Project deployed

## Environment Variables (Railway Dashboard)
Set these in Railway → Variables:
- [ ] `DISCORD_TOKEN` = Your Discord bot token
- [ ] `TMDB_API_KEY` = Your TMDB API key

## Discord Bot Setup
- [ ] Bot created at Discord Developer Portal
- [ ] Bot token copied
- [ ] Intents enabled:
  - [ ] Guilds
  - [ ] Guild Messages  
  - [ ] Message Content
- [ ] Bot invited to server with permissions:
  - [ ] View Channels
  - [ ] Send Messages
  - [ ] Embed Links
  - [ ] Use Application Commands
  - [ ] Add Reactions
  - [ ] Read Message History

## TMDB API Setup
- [ ] Account created at themoviedb.org
- [ ] API key requested (free)
- [ ] API key copied

## Post-Deployment Verification
- [ ] Railway shows "Success" deployment status
- [ ] Check Railway logs for "Bot is now online"
- [ ] Bot shows online in Discord
- [ ] Test `/watch` command
- [ ] Test browsing movies
- [ ] Test adding to watchlist
- [ ] Test continue watching
- [ ] Verify database persistence (restart bot, check data still there)

## Railway Configuration Files
- [x] `railway.toml` - Railway build config
- [x] `.railwayignore` - Exclude unnecessary files
- [x] `package.json` - Has Node.js engines specified
- [x] Proper start command defined

## Database
- [x] SQLite database auto-creates on first run
- [x] Migrations run automatically
- [x] Data persists in Railway volume
- [x] No manual setup required

## Monitoring
- [ ] Check Railway logs regularly for errors
- [ ] Monitor Railway usage (free tier: $5 credit)
- [ ] Set up Railway webhooks (optional)

## Common Issues
✅ **Bot offline** → Check environment variables
✅ **Commands not working** → Wait 1 hour, check permissions
✅ **Database errors** → Check Railway logs, restart if needed
✅ **Out of credits** → Upgrade to Hobby plan ($5/month)

---

## Quick Start Commands

### Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit - Ready for Railway"
git branch -M main
git remote add origin YOUR_REPO_URL
git push -u origin main
```

### Test Locally First
```bash
npm install
npm start
# Test /watch command
```

---

## Railway Free Tier Info
- ✅ $5 credit to start
- ✅ ~500 hours execution/month
- ✅ Usually lasts 1-2 months for small bots
- ✅ Upgrade to Hobby ($5/month) for unlimited

---

## 🎉 Success!
Once all checkboxes are ✅, your bot is live on Railway!

**Test it:** Type `/watch` in Discord and enjoy! 🚀
