#!/bin/bash

# 新しいSSH鍵での接続テストスクリプト
echo "🔑 新しいSSH鍵での接続テストを開始..."

# 接続情報
SSH_HOST="sogoodsnet.sakura.ne.jp"
SSH_USER="sogoodsnet"
SSH_PORT="22"

echo "📋 接続情報:"
echo "  Host: $SSH_HOST"
echo "  User: $SSH_USER"
echo "  Port: $SSH_PORT"

# テスト用の一時秘密鍵ファイルを作成（手動で秘密鍵を貼り付け）
echo ""
echo "🔧 テスト手順:"
echo "1. Sakuraサーバーで以下を実行:"
echo "   ssh-keygen -t ed25519 -C \"github-actions@sogoods.net\" -f ~/.ssh/github_actions_key"
echo "   cat ~/.ssh/github_actions_key.pub >> ~/.ssh/authorized_keys"
echo "   chmod 600 ~/.ssh/authorized_keys ~/.ssh/github_actions_key"
echo ""
echo "2. 秘密鍵の内容を取得:"
echo "   cat ~/.ssh/github_actions_key"
echo ""
echo "3. GitHub Secrets (SSH_PRIVATE_KEY) を更新"
echo ""
echo "4. 接続テスト（Sakuraサーバー上で）:"
echo "   ssh -i ~/.ssh/github_actions_key sogoodsnet@localhost 'echo \"SSH接続テスト成功!\"'"

# GitHub Actions用のテスト情報を表示
echo ""
echo "🚀 GitHub Actions デバッグ情報:"
echo ""
echo "ワークフローファイルでの接続テスト部分:"
echo "---"
cat << 'EOF'
- name: Test SSH Connection
  run: |
    echo "Testing SSH connection..."
    # SSH接続テスト用のコマンドをワークフローに追加
    ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 \
        sogoodsnet@sogoodsnet.sakura.ne.jp \
        "echo 'SSH Connection Success!' && pwd && whoami"
EOF

echo "---"
echo ""
echo "💡 トラブルシューティング:"
echo "- SSH鍵の権限: chmod 600 ~/.ssh/github_actions_key"
echo "- authorized_keysの権限: chmod 600 ~/.ssh/authorized_keys"  
echo "- .sshディレクトリの権限: chmod 700 ~/.ssh"
echo "- 公開鍵が正しく追加されているか確認"
echo ""
echo "🎯 GitHub Actionsでの確認方法:"
echo "1. Actions タブで Deploy to Sakura Server の実行ログを確認"
echo "2. SSH接続エラーの詳細を確認"
echo "3. 必要に応じてワークフローファイルにデバッグ用ログを追加"