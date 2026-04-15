# Complete Deployment Guide

Your portfolio is ready! Follow these steps to deploy it.

## ✅ What's Already Done

- ✓ Git repository initialized
- ✓ All files committed
- ✓ Project structure ready
- ✓ SMS functionality configured
- ✓ Auto-deployment workflow set up

## 🚀 Step 1: Create GitHub Repository

### Option A: Via GitHub Website (Easiest)

1. Go to https://github.com/new
2. Name your repository (e.g., `my-portfolio`)
3. Choose **Public** or **Private**
4. **DO NOT** initialize with README (we already have one)
5. Click "Create repository"

### Option B: Via GitHub CLI (if installed)

```bash
cd /home/claude
gh repo create my-portfolio --public --source=. --remote=origin --push
```

## 🔗 Step 2: Push to GitHub

After creating the repository on GitHub, copy the commands they show or use these:

```bash
cd /home/claude
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual values.

## 🌐 Step 3: Deploy to Netlify

### Method 1: Connect GitHub Repository (Recommended)

1. Go to https://app.netlify.com/
2. Click "Add new site" → "Import an existing project"
3. Choose "Deploy with GitHub"
4. Authorize Netlify to access your GitHub
5. Select your portfolio repository
6. Build settings (auto-detected from netlify.toml):
   - Build command: (leave empty)
   - Publish directory: `.`
   - Functions directory: `netlify/functions`
7. Click "Deploy site"

### Method 2: Netlify CLI (Alternative)

```bash
cd /home/claude

# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize and deploy
netlify init

# Follow the prompts:
# - Create & configure a new site
# - Choose your team
# - Site name: (choose a name)
# - Build command: (leave empty)
# - Directory to deploy: .
# - Functions directory: netlify/functions

# Deploy to production
netlify deploy --prod
```

## 🔑 Step 4: Configure Environment Variables

In Netlify Dashboard:

1. Go to your site
2. Click "Site settings" → "Environment variables"
3. Add these variables:

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
YOUR_PHONE_NUMBER=+1987654321
```

**Where to get Twilio credentials:**
1. Sign up at https://www.twilio.com/try-twilio (FREE)
2. Get a free phone number
3. Copy Account SID and Auth Token from console
4. Add them to Netlify environment variables

## ⚡ Step 5: Enable Auto-Deployment (Optional)

This makes every GitHub push automatically deploy to Netlify!

### Get Netlify Tokens:

1. **Netlify Auth Token:**
   - Go to https://app.netlify.com/user/applications
   - Click "New access token"
   - Name it "GitHub Actions"
   - Copy the token

2. **Netlify Site ID:**
   - Go to your site in Netlify
   - Site settings → General → Site details
   - Copy the "Site ID"

### Add to GitHub:

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add two secrets:
   - Name: `NETLIFY_AUTH_TOKEN`, Value: (your token)
   - Name: `NETLIFY_SITE_ID`, Value: (your site ID)

Now every push to `main` branch will automatically deploy! 🎉

## 🎨 Step 6: Customize Your Site

1. **Open your live site** (Netlify gives you a URL)
2. **Use the theme controls** (top-right corner):
   - Pick your colors
   - Upload your profile picture
   - Changes save automatically in browser

3. **Edit content** (in your repository):
   - Open `index.html`
   - Update your name, title, about, projects
   - Commit and push changes
   - Auto-deploys if you set up Step 5!

## 🧪 Test SMS Functionality

1. Open your live site
2. Fill out the contact form
3. Click "Send Message"
4. You should receive an SMS at the number you configured!

## 📱 Your URLs

- **Live Site:** `https://YOUR_SITE_NAME.netlify.app`
- **GitHub Repo:** `https://github.com/YOUR_USERNAME/YOUR_REPO_NAME`
- **Netlify Admin:** `https://app.netlify.com/`

## 🎯 Common Commands

```bash
# Test locally
cd /home/claude
npm run dev
# Visit http://localhost:8888

# Update and redeploy
git add .
git commit -m "Update portfolio"
git push origin main

# Manual deploy via CLI
netlify deploy --prod
```

## 🐛 Troubleshooting

### SMS not working?
- Check Netlify function logs
- Verify environment variables are set
- Ensure Twilio account is active
- Check phone number format (+1234567890)

### Can't push to GitHub?
```bash
# Make sure you added the remote
git remote -v

# If not added:
git remote add origin https://github.com/USERNAME/REPO.git
```

### Auto-deployment not working?
- Check GitHub Actions tab for errors
- Verify secrets are set correctly
- Check workflow file is in `.github/workflows/`

## 🎊 You're Done!

Your portfolio is now:
- ✅ Version controlled with Git
- ✅ Hosted on GitHub
- ✅ Live on Netlify
- ✅ Auto-deploying on push
- ✅ SMS contact form working
- ✅ Theme customizable

---

**Need help?** Check the README.md or QUICKSTART.md files!
