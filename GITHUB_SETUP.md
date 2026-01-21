# GitHub Setup Guide

This guide will help you push your `onscreen-recorder` package to GitHub.

## Repository Information

- **Repository URL**: https://github.com/sharjeel884/onscreen-recorder.git
- **Owner**: sharjeel884

## Quick Setup

### Option 1: Use the Automated Script (Recommended)

```bash
./push-to-github.sh
```

This script will:
- Initialize git repository (if needed)
- Add the GitHub remote
- Stage all files
- Commit changes
- Push to GitHub

### Option 2: Manual Setup

#### 1. Initialize Git Repository

```bash
git init
```

#### 2. Add Remote

```bash
git remote add origin https://github.com/sharjeel884/onscreen-recorder.git
```

If remote already exists, update it:
```bash
git remote set-url origin https://github.com/sharjeel884/onscreen-recorder.git
```

#### 3. Stage Files

```bash
git add .
```

#### 4. Commit

```bash
git commit -m "Initial commit: Screen recorder React component package"
```

#### 5. Push to GitHub

```bash
git branch -M main
git push -u origin main
```

## Before Pushing

Make sure you have:

1. **GitHub account** - You need to be logged in
2. **Repository created** - The repository should exist at https://github.com/sharjeel884/onscreen-recorder
3. **Authentication** - Either SSH keys or GitHub CLI configured

## Authentication Methods

### Method 1: SSH (Recommended)

1. Generate SSH key (if you don't have one):
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

2. Add SSH key to GitHub:
   - Copy your public key: `cat ~/.ssh/id_ed25519.pub`
   - Go to GitHub Settings → SSH and GPG keys → New SSH key
   - Paste your key

3. Update remote URL to use SSH:
   ```bash
   git remote set-url origin git@github.com:sharjeel884/onscreen-recorder.git
   ```

### Method 2: HTTPS with Personal Access Token

1. Create a Personal Access Token:
   - Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token with `repo` scope

2. Use token when pushing:
   ```bash
   git push -u origin main
   # Username: your_github_username
   # Password: your_personal_access_token
   ```

### Method 3: GitHub CLI

```bash
# Install GitHub CLI
brew install gh  # macOS
# or visit: https://cli.github.com/

# Authenticate
gh auth login

# Push
git push -u origin main
```

## Files to Include

The `.gitignore` file is already configured to exclude:
- `node_modules/`
- `dist/` (build output - you may want to include this)
- Development files
- IDE files

**Note**: For npm packages, you typically don't commit `dist/` to git since it's generated during build. However, if you want to include it, remove `dist` from `.gitignore`.

## After Pushing

1. **Verify on GitHub**: Visit https://github.com/sharjeel884/onscreen-recorder
2. **Update README**: Make sure your README looks good on GitHub
3. **Add topics/tags**: Add relevant topics to your repository
4. **Set up GitHub Pages** (optional): For documentation or demos

## Troubleshooting

### "Repository not found"
- Make sure the repository exists on GitHub
- Check that you have access to the repository
- Verify the repository URL is correct

### "Permission denied"
- Check your authentication method
- Verify SSH keys or tokens are set up correctly
- Make sure you're logged in to GitHub

### "Branch already exists"
- The script will ask if you want to force push
- Or merge changes first: `git pull origin main --rebase`

## Next Steps After GitHub Setup

1. **Publish to npm**: See `NPM_PUBLISH_GUIDE.md`
2. **Add badges**: Add npm version, build status badges to README
3. **Create releases**: Tag versions for releases
4. **Set up CI/CD**: GitHub Actions for automated testing/building
