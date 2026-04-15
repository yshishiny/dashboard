#!/bin/bash

echo "🚀 Portfolio GitHub Deployment Helper"
echo "======================================"
echo ""

# Check if git is configured
if ! git config user.name > /dev/null 2>&1; then
    echo "⚠️  Git user not configured."
    read -p "Enter your name: " git_name
    git config user.name "$git_name"
fi

if ! git config user.email > /dev/null 2>&1; then
    echo "⚠️  Git email not configured."
    read -p "Enter your email: " git_email
    git config user.email "$git_email"
fi

echo ""
echo "Please provide your GitHub repository details:"
echo ""
read -p "GitHub username: " github_username
read -p "Repository name (e.g., my-portfolio): " repo_name

echo ""
echo "Setting up remote repository..."
git remote remove origin 2>/dev/null
git remote add origin "https://github.com/${github_username}/${repo_name}.git"

echo ""
echo "🔍 Current status:"
git status

echo ""
read -p "Ready to push to GitHub? (yes/no): " confirm

if [ "$confirm" = "yes" ] || [ "$confirm" = "y" ]; then
    echo ""
    echo "📤 Pushing to GitHub..."
    git push -u origin main
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Successfully pushed to GitHub!"
        echo ""
        echo "Next steps:"
        echo "1. Go to https://github.com/${github_username}/${repo_name}"
        echo "2. Deploy to Netlify: https://app.netlify.com/"
        echo "3. Follow DEPLOYMENT_GUIDE.md for detailed instructions"
        echo ""
    else
        echo ""
        echo "❌ Push failed. Please check:"
        echo "1. Repository exists at https://github.com/${github_username}/${repo_name}"
        echo "2. You have permission to push to this repository"
        echo "3. GitHub credentials are configured correctly"
        echo ""
    fi
else
    echo "Cancelled. Run this script again when ready."
fi
