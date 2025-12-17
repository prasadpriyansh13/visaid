# Git & GitHub Setup Instructions for VisionAid

## Initialize Git Repository

If Git is not already initialized in your project, run:

```bash
git init
```

## Verify .gitignore

Ensure your `.gitignore` file includes:
- `node_modules/`
- `.env`
- `.next/`
- Other build artifacts

The current `.gitignore` is already properly configured.

## Commit Your Project

Stage all files:

```bash
git add .
```

Commit with a descriptive message:

```bash
git commit -m "Initial VisionAid release with live detection and TTS"
```

## Set Main Branch (if needed)

```bash
git branch -M main
```

## Push to GitHub

### Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Name it `visaid` or `visionaid` (or your preferred name)
5. **Do NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

### Step 2: Add Remote and Push

After creating the repository, GitHub will show you commands. Use these:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub username and repository name.

### Alternative: Using SSH

If you prefer SSH:

```bash
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

## Complete Command Sequence

Here's the complete sequence from scratch:

```bash
# Initialize Git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial VisionAid release with live detection and TTS"

# Rename branch to main (if needed)
git branch -M main

# Add remote (replace with your actual GitHub repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git push -u origin main
```

## Troubleshooting

### If you get "remote origin already exists"

```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

### If you need to authenticate

GitHub may require authentication. Use:
- Personal Access Token (recommended)
- GitHub CLI (`gh auth login`)
- SSH keys

### If push is rejected

If the remote repository has content (like a README), you may need to pull first:

```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

## Next Steps

After pushing to GitHub:
1. Your code is now backed up and version controlled
2. You can collaborate with others
3. Set up CI/CD if needed
4. Enable GitHub Pages for deployment (optional)

