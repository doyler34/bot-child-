# 🚀 Railway Deployment Guide for ZipxMovies Bot

## Prerequisites
- GitHub account
- Railway account (sign up at [railway.app](https://railway.app))
- Discord Bot Token
- TMDB API Key

---

## 📋 Step-by-Step Deployment

### 1. Push to GitHub (If not already done)
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### 2. Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Click **"Start a New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository
5. Railway will automatically detect it's a Node.js project

### 3. Configure Environment Variables

In Railway dashboard, go to **Variables** tab and add:

```env
DISCORD_TOKEN=your_discord_bot_token_here
TMDB_API_KEY=your_tmdb_api_key_here
```

**Where to get these:**
- **DISCORD_TOKEN**: [Discord Developer Portal](https://discord.com/developers/applications) → Your App → Bot → Token
- **TMDB_API_KEY**: [TMDB API](https://www.themoviedb.org/settings/api)

### 4. Deploy!

Railway will automatically:
- ✅ Install dependencies
- ✅ Create database directory
- ✅ Start the bot
- ✅ Keep it running 24/7

---

## 🔍 Monitoring

### Check Logs
- Go to Railway dashboard
- Click on your project
- Go to **"Deployments"** tab
- Click on latest deployment to see logs

### Verify Bot is Online
- Bot should appear online in Discord
- Try `/watch` command
- Check Railway logs for "✓ Bot is now online"

---

## 🛠️ Common Issues & Fixes

### Issue: Bot shows offline
**Fix:** Check Railway logs for errors
- Make sure `DISCORD_TOKEN` is set correctly
- Verify bot has proper Discord permissions

### Issue: "Module not found" error
**Fix:** Clear build cache in Railway
- Settings → Clear Cache → Redeploy

### Issue: Database errors
**Fix:** Railway automatically creates `/data` directory
- No action needed - it works out of the box

### Issue: Bot disconnects randomly
**Fix:** Railway free tier has 500 hours/month
- Upgrade to Hobby plan ($5/month) for unlimited

---

## 📊 Usage Limits

### Free Tier (Trial)
- ✅ $5 credit (usually lasts 1-2 months)
- ✅ 500 execution hours/month
- ✅ All features available

### Hobby Tier ($5/month)
- ✅ Unlimited execution hours
- ✅ Better performance
- ✅ Priority support

---

## 🔄 Updating Your Bot

Railway auto-deploys when you push to GitHub:

```bash
# Make your changes
git add .
git commit -m "Update bot"
git push

# Railway automatically detects and deploys!
```

---

## 🎯 Bot Features

Once deployed, users can:
- ✅ Browse movies and TV shows
- ✅ Search with `/watch`
- ✅ Add items to watchlist
- ✅ Track continue watching
- ✅ Get streaming links from multiple providers

---

## 📞 Support

If you encounter issues:
1. Check Railway logs first
2. Verify environment variables
3. Ensure Discord bot permissions are correct
4. Check TMDB API key is valid

---

## ✅ Post-Deployment Checklist

- [ ] Bot shows online in Discord
- [ ] `/watch` command works
- [ ] Can browse movies/shows
- [ ] Watchlist saves data
- [ ] Continue watching tracks progress
- [ ] Streaming links work
- [ ] Database persists across restarts

---

**🎉 Congratulations! Your bot is now live on Railway!**
