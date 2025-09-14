# 🚀 GitHub Actions 自動デプロイ設定

このリポジトリには3つのGitHub Actionsワークフローが設定されています。

## 📋 ワークフロー一覧

### 1. **Deploy SoGoods.net** (`deploy.yml`)
- **トリガー**: mainブランチへのpush、手動実行
- **機能**: HTMLファイルの検証とGitHub Pagesへのデプロイ
- **自動実行**: ✅ コミット時に自動実行

### 2. **Pages Deployment** (`pages.yml`) 
- **トリガー**: mainブランチへのpush、手動実行
- **機能**: GitHub Pages専用の最適化されたデプロイ
- **自動実行**: ✅ コミット時に自動実行

### 3. **Deploy to Custom Server** (`deploy-server.yml`)
- **トリガー**: mainブランチへのpush、手動実行
- **機能**: カスタムサーバーへのSSHデプロイ
- **自動実行**: ⚙️ サーバー設定後に自動実行

---

## 🌐 GitHub Pages設定（推奨）

### 自動設定手順:
1. このコードをプッシュ
2. GitHubが自動的にActionsを実行
3. GitHub Pagesが自動的に有効になります

### 手動設定手順:
1. GitHubリポジトリページへ移動
2. **Settings** → **Pages** をクリック
3. **Source** を「**GitHub Actions**」に設定
4. 保存すると自動デプロイが開始されます

### 🔗 公開URL:
```
https://sogoodsnet.github.io/sogoods.net-www/
```

---

## 🖥️ カスタムサーバー設定

### 必要なSecrets設定:

GitHubリポジトリの **Settings** → **Secrets and variables** → **Actions** で以下を設定:

| Secret名 | 説明 | 例 |
|----------|------|----| 
| `SERVER_HOST` | サーバーのホスト名またはIP | `your-domain.com` |
| `SERVER_USER` | SSHユーザー名 | `ubuntu` |
| `SERVER_SSH_KEY` | SSH秘密鍵 | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `DEPLOY_PATH` | デプロイ先パス（オプション） | `/var/www/html/sogoods` |
| `SERVER_PORT` | SSHポート（オプション） | `22` |

### SSH秘密鍵の生成方法:
```bash
# サーバー側で鍵ペアを生成
ssh-keygen -t rsa -b 4096 -C "github-actions"

# 公開鍵をauthorized_keysに追加
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys

# 秘密鍵の内容をGitHub Secretsに登録
cat ~/.ssh/id_rsa
```

---

## 🔄 ワークフローの実行

### 自動実行:
- mainブランチにプッシュすると自動的に全ワークフローが実行されます

### 手動実行:
1. GitHubリポジトリの **Actions** タブを開く
2. 実行したいワークフローを選択
3. **Run workflow** をクリック

---

## 📊 デプロイ状況の確認

### GitHub Pages:
- **Actions** タブで実行状況を確認
- **Settings** → **Pages** でサイトURLを確認

### カスタムサーバー:
- **Actions** タブの「Deploy to Custom Server」で実行ログを確認
- サーバーにSSHでアクセスしてファイルを確認

---

## 🛠️ トラブルシューティング

### よくある問題:

#### 1. GitHub Pagesが表示されない
- **Repository** → **Settings** → **Pages** を確認
- **Source** が「GitHub Actions」に設定されているか確認

#### 2. サーバーデプロイが失敗する
- **Secrets** の設定を再確認
- SSH接続をローカルでテスト:
  ```bash
  ssh -i ~/.ssh/id_rsa user@server-ip
  ```

#### 3. 権限エラー
- サーバー側のディレクトリ権限を確認:
  ```bash
  sudo chown -R www-data:www-data /var/www/html/sogoods
  chmod -R 755 /var/www/html/sogoods
  ```

### ログの確認:
- **GitHub**: Actions タブでワークフローのログを確認
- **サーバー**: `/tmp/sogoods-backup-*` ディレクトリでバックアップを確認

---

## 🚀 デプロイフロー

```mermaid
graph TD
    A[Code Push to main] --> B[GitHub Actions Triggered]
    B --> C[File Validation]
    C --> D[GitHub Pages Deploy]
    C --> E[Custom Server Deploy]
    D --> F[Site Live at GitHub Pages]
    E --> G[Site Live at Custom Server]
```

### 実行時間:
- **GitHub Pages**: 約2-3分
- **カスタムサーバー**: 約1-2分（SSH接続による）

---

## 🎯 次のステップ

1. **GitHub Pages**: 特別な設定不要、自動で利用可能
2. **カスタムサーバー**: Secretsを設定して本格運用
3. **ドメイン**: 独自ドメインを設定して本格運用

**GitHub Pagesなら即座に利用開始できます！** 🌟