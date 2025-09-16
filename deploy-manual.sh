#!/bin/bash

echo "🚀 Manual Deployment to Sakura Server"
echo "====================================="

# Sakura サーバーの情報
SERVER_HOST="sogoodsnet.sakura.ne.jp"
SERVER_USER="sogoodsnet"
SERVER_PATH="~/www"

echo "📋 Files to deploy:"
echo "   • index.html (main page with SO logo + SOGOODS.NET)"
echo "   • photo-manager.js (dynamic photo system)"  
echo "   • notion-api.js (API integration)"
echo "   • assets/logo/so-logo.png (blue/yellow logo)"
echo "   • photos/ folder structure"
echo ""

# ファイルサイズチェック
echo "📊 File sizes:"
ls -lh index.html photo-manager.js notion-api.js assets/logo/so-logo.png 2>/dev/null

echo ""
echo "🔧 Manual upload commands:"
echo "   1. Upload main files:"
echo "      scp index.html photo-manager.js notion-api.js ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/"
echo ""
echo "   2. Create and upload logo:"  
echo "      ssh ${SERVER_USER}@${SERVER_HOST} 'mkdir -p ${SERVER_PATH}/assets/logo'"
echo "      scp assets/logo/so-logo.png ${SERVER_USER}@${SERVER_HOST}:${SERVER_PATH}/assets/logo/"
echo ""
echo "   3. Create photos directories:"
echo "      ssh ${SERVER_USER}@${SERVER_HOST} 'mkdir -p ${SERVER_PATH}/photos/miiko ${SERVER_PATH}/photos/gallery'"
echo ""
echo "   4. Set permissions:"
echo "      ssh ${SERVER_USER}@${SERVER_HOST} 'chmod 644 ${SERVER_PATH}/*.html ${SERVER_PATH}/*.js && chmod -R 755 ${SERVER_PATH}/assets ${SERVER_PATH}/photos'"
echo ""

# 現在のindex.htmlの内容確認
echo "📄 Current index.html preview (first 5 lines):"
head -5 index.html

echo ""
echo "✨ Features included in this deployment:"
echo "   🎨 SO logo (blue/yellow design) 50x35px"
echo "   📝 SOGOODS.NET branding (48px giant text)"
echo "   🔵 TII section (replaces NEWS)"  
echo "   📷 Dynamic photo system (/photos/miiko/, /photos/gallery/)"
echo "   🔢 Real-time statistics (time, views, counters)"
echo "   ♾️  Blue infinity symbol and number overlays"
echo "   📱 Mobile responsive design"
echo ""
echo "🌐 Expected URLs after deployment:"
echo "   https://sogoodsnet.sakura.ne.jp/"
echo ""
echo "💡 Note: Use GitHub Actions workflow for automated deployment:"  
echo "   https://github.com/sogoodsnet/sogoods.net-www/actions/workflows/deploy-sakura-simple.yml"