#!/bin/bash

echo "🚀 Manual Deployment to Sakura Server"
echo "======================================="

# Check required files
echo "📁 Checking files to deploy..."
if [ ! -f "index.html" ]; then
    echo "❌ index.html not found!"
    exit 1
fi

echo "✅ Found files to deploy:"
ls -la *.html *.css *.js *.md 2>/dev/null | head -10

# Display first few lines of index.html to verify content
echo ""
echo "📄 Current index.html content preview:"
head -10 index.html

echo ""
echo "🔧 To deploy to Sakura server, you would run:"
echo "   scp *.html *.css *.js sogoodsnet@sogoodsnet.sakura.ne.jp:~/www/"
echo ""
echo "📋 Deployment Summary:"
echo "   - Local files are ready"
echo "   - Manual upload needed via SCP or SFTP"
echo "   - Target: sogoodsnet.sakura.ne.jp:~/www/"
