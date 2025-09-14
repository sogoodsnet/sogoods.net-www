#!/bin/bash

# SoGoods.net サーバー同期スクリプト
# Usage: ./deploy-server.sh [target-directory]

set -e

# 設定
REPO_URL="https://github.com/sogoodsnet/sogoods.net-www.git"
TARGET_DIR="${1:-/var/www/html/sogoods}"
BACKUP_DIR="/tmp/sogoods-backup-$(date +%Y%m%d-%H%M%S)"

echo "🚀 SoGoods.net サーバー同期を開始..."

# バックアップディレクトリの作成
if [ -d "$TARGET_DIR" ]; then
    echo "📦 既存ファイルをバックアップ: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
    cp -r "$TARGET_DIR"/* "$BACKUP_DIR/" 2>/dev/null || true
fi

# ターゲットディレクトリの準備
mkdir -p "$TARGET_DIR"
cd "$TARGET_DIR"

# Gitリポジトリの初期化または更新
if [ -d ".git" ]; then
    echo "🔄 既存リポジトリを更新..."
    git fetch origin
    git reset --hard origin/main
else
    echo "📥 リポジトリを新規クローン..."
    cd "$(dirname "$TARGET_DIR")"
    rm -rf "$(basename "$TARGET_DIR")"
    git clone "$REPO_URL" "$(basename "$TARGET_DIR")"
    cd "$TARGET_DIR"
fi

# 不要ファイルの削除
echo "🧹 不要ファイルを削除..."
rm -rf .git .github deploy-server.sh AGENT.md 2>/dev/null || true

# ファイル権限の設定
echo "🔧 ファイル権限を設定..."
find . -type f -name "*.html" -exec chmod 644 {} \;
find . -type f -name "*.css" -exec chmod 644 {} \;
find . -type f -name "*.js" -exec chmod 644 {} \;
find . -type d -exec chmod 755 {} \;

# 結果の確認
echo "✅ デプロイ完了!"
echo "📂 デプロイ先: $TARGET_DIR"
echo "📋 ファイル一覧:"
ls -la

# Webサーバーの再起動（必要に応じて）
if command -v systemctl >/dev/null 2>&1; then
    if systemctl is-active --quiet nginx; then
        echo "🔄 Nginxを再起動..."
        sudo systemctl reload nginx
    elif systemctl is-active --quiet apache2; then
        echo "🔄 Apache2を再起動..."
        sudo systemctl reload apache2
    fi
fi

echo "🌟 https://your-domain.com でサイトにアクセスできます"