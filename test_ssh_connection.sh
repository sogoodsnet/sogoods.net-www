#!/bin/bash

# Sakura サーバー接続テストスクリプト
# GitHub Actions実行前の事前確認用

echo "🔍 Sakura SSH接続テストを開始..."

# SSH接続情報
SSH_HOST="sogoodsnet.sakura.ne.jp"
SSH_USER="sogoodsnet"
SSH_PORT="22"

echo "📋 接続情報:"
echo "  Host: $SSH_HOST"
echo "  User: $SSH_USER" 
echo "  Port: $SSH_PORT"

# 秘密鍵ファイルの確認（ローカルテスト用）
if [ -f ~/.ssh/id_rsa ]; then
    SSH_KEY="~/.ssh/id_rsa"
elif [ -f ~/.ssh/id_ed25519 ]; then
    SSH_KEY="~/.ssh/id_ed25519"
else
    echo "❌ SSH秘密鍵が見つかりません"
    echo "💡 GitHub Actionsでは secrets.SSH_PRIVATE_KEY を使用します"
    exit 1
fi

echo "🔑 Using SSH key: $SSH_KEY"

# SSH接続テスト
echo "🌸 Sakuraサーバーへの接続テスト中..."

# タイムアウト付きSSH接続
timeout 10 ssh -o ConnectTimeout=5 -o BatchMode=yes -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" "
echo '✅ SSH接続成功!'
echo '📂 ホームディレクトリ情報:'
pwd
ls -la

echo '📁 wwwディレクトリの確認:'
if [ -d '/home/sogoodsnet/www' ]; then
    echo '✅ /home/sogoodsnet/www 存在します'
    ls -la /home/sogoodsnet/www/ 2>/dev/null || echo '  (空のディレクトリまたは権限なし)'
else
    echo '⚠️  /home/sogoodsnet/www が存在しません'
    echo '🔧 ディレクトリを作成中...'
    mkdir -p /home/sogoodsnet/www
    echo '✅ /home/sogoodsnet/www を作成しました'
fi

echo '📁 backupディレクトリの確認:'
if [ -d '/home/sogoodsnet/backup' ]; then
    echo '✅ /home/sogoodsnet/backup 存在します'
else
    echo '🔧 バックアップディレクトリを作成中...'
    mkdir -p /home/sogoodsnet/backup
    echo '✅ /home/sogoodsnet/backup を作成しました'
fi

echo '🎯 Git設定の確認:'
which git >/dev/null 2>&1 && echo '✅ Git利用可能' || echo '❌ Gitが見つかりません'

echo '💾 ディスク容量の確認:'
df -h /home/sogoodsnet/ | tail -1

echo '🚀 接続テスト完了 - GitHub Actions準備完了!'
"

# SSH接続結果の判定
if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 SSH接続テスト成功!"
    echo "✅ GitHub Actionsでの自動デプロイ準備完了"
    echo ""
    echo "📋 次のステップ:"
    echo "1. GitHub SecretsにSSH_PRIVATE_KEYを設定"
    echo "2. .github/workflows/deploy-sakura.yml を作成"  
    echo "3. コードをプッシュして自動デプロイを確認"
else
    echo ""
    echo "❌ SSH接続テスト失敗"
    echo "🔧 確認事項:"
    echo "- SSH秘密鍵の権限: chmod 600 ~/.ssh/id_rsa"
    echo "- Sakuraサーバーの接続設定"
    echo "- ネットワーク接続"
fi