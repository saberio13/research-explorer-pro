# Research Explorer Pro

AI-powered research paper analysis tool. Search by question, topic, author, or methodology. Get consensus analysis, paper summaries, and synthesis.

## Free Deployment Guide (Render + Gemini)

Total cost: **$0/month**

### Step 1: Get a Free Gemini API Key

1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Create API key** → **Create API key in new project**
4. Copy the key

Free tier limits: **10 requests/minute, 500 requests/day** — plenty for personal use.

### Step 2: Push to GitHub

```bash
# Initialize git in the project folder
cd research-explorer
git init
git add .
git commit -m "Initial commit"

# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/research-explorer.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy on Render (Free)

1. Go to [https://render.com](https://render.com) and sign up with GitHub
2. Click **New** → **Web Service**
3. Connect your `research-explorer` repository
4. Configure:
   - **Name:** `research-explorer` (or anything you want)
   - **Region:** Pick the closest to you (Singapore for Taiwan)
   - **Branch:** `main`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `NODE_ENV=production node dist/index.cjs`
   - **Instance Type:** **Free**
5. Click **Environment** → Add environment variable:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** paste your Gemini API key from Step 1
6. Click **Deploy**

Your app will be live at `https://research-explorer.onrender.com` (or similar).

### Important Notes

- **Cold starts:** Free Render services sleep after 15 min of inactivity. First request after sleep takes ~30 seconds.
- **SQLite data:** Search history and saved papers are stored in SQLite. On Render free tier, data resets on each deploy (no persistent disk). For persistent storage, upgrade to Render's $7/month plan which includes a disk.
- **API limits:** Gemini free tier allows ~500 searches/day. More than enough for personal research use.

## Local Development

```bash
# Install dependencies
npm install

# Create .env file with your Gemini key
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Start dev server
npm run dev
```

App runs at `http://localhost:5000`.

## Tech Stack

- **Frontend:** React + Tailwind CSS + shadcn/ui
- **Backend:** Express.js + SQLite (Drizzle ORM)
- **AI:** Google Gemini 2.5 Flash (free tier)
- **Also supports:** Anthropic Claude (if ANTHROPIC_API_KEY is set instead)
