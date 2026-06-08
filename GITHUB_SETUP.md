# GitHub Setup Guide

Follow these steps once to get EcoHomes on GitHub.

---

## Step 1 — Install Git (if not already)

Download from https://git-scm.com/download/win and install with default settings.

Verify:
```bash
git --version
```

---

## Step 2 — Create GitHub Account & Repository

1. Go to https://github.com and sign in (or create an account)
2. Click the **+** icon → **New repository**
3. Fill in:
   - Repository name: `ecohomes`
   - Description: `Climate-adaptive home planner based on ENS guidelines`
   - Visibility: **Private** (recommended while building) or Public
   - **Do NOT** check "Add README" — we already have one
4. Click **Create repository**
5. Copy the repository URL — it will look like:
   `https://github.com/YOUR_USERNAME/ecohomes.git`

---

## Step 3 — Initialize Git in the Project Folder

Open a terminal (Command Prompt or PowerShell) and run:

```bash
# Navigate to your project folder
cd "F:\PM Course Case studies\EcoHomes"

# Initialize git
git init

# Add all files
git add .

# First commit
git commit -m "feat: Phase 0 foundation — React wizard, Tauri setup, ENS store"

# Set main as default branch name
git branch -M main

# Link to your GitHub repo (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/ecohomes.git

# Push to GitHub
git push -u origin main
```

---

## Step 4 — Authenticate with GitHub

If Git asks for credentials, use one of these:

**Option A — GitHub CLI (easiest):**
```bash
# Install from https://cli.github.com
gh auth login
# Choose: GitHub.com → HTTPS → Authenticate with browser
```

**Option B — Personal Access Token:**
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Select scope: `repo` (full control)
4. Copy the token — use it as your password when Git prompts

---

## Step 5 — Recommended Branch Strategy

```
main          ← stable, deployed code only
develop       ← active development, merge feature branches here
feature/...   ← one branch per feature (e.g. feature/climate-engine)
```

Set up the develop branch:
```bash
git checkout -b develop
git push -u origin develop
```

From now on, work on `develop` or feature branches, never directly on `main`.

---

## Step 6 — Daily Workflow

```bash
# Pull latest changes
git pull

# Create a feature branch for new work
git checkout -b feature/step1-location-map

# ... make changes ...

# Stage and commit
git add .
git commit -m "feat: add Leaflet map with Nominatim search"

# Push branch to GitHub
git push -u origin feature/step1-location-map

# On GitHub: open a Pull Request → merge into develop
```

---

## Step 7 — Protect Main Branch (Optional but Recommended)

On GitHub:
1. Repo → Settings → Branches → Add branch protection rule
2. Branch name: `main`
3. Enable: ✅ Require pull request before merging
4. Enable: ✅ Require at least 1 approval

---

## Useful Git Commands

```bash
git status              # See what's changed
git log --oneline       # See commit history
git diff                # See exact changes
git stash               # Temporarily save uncommitted work
git stash pop           # Restore stashed work
```

---

*Once set up, every time you finish a working feature: commit → push → you're backed up.*
