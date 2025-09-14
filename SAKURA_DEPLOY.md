# 🌸 Sakuraサーバー 自動デプロイ設定

## 📋 サーバー情報
- **ホスト**: `sogoodsnet.sakura.ne.jp`
- **ユーザー**: `sogoodsnet`
- **ポート**: `22`
- **デプロイ先**: `/home/sogoodsnet/www`

## 🚀 GitHub Actions設定手順

### ステップ1: GitHub Secretsの設定

1. **GitHubリポジトリ**にアクセス:
   ```
   https://github.com/sogoodsnet/sogoods.net-www
   ```

2. **Settings** → **Secrets and variables** → **Actions** をクリック

3. **New repository secret** で以下を追加:

   | Secret名 | 値 |
   |----------|----| 
   | `SSH_PRIVATE_KEY` | SSH秘密鍵の内容 |

   **SSH秘密鍵の設定内容:**
   ```
   -----BEGIN OPENSSH PRIVATE KEY-----
   b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
   QyNTUxOQAAACD1hVZargoGjJ6uv2I78mmBsGIX0O2pHLl+OhqwVexwvgAAAKAEtH9xBLR/
   cQAAAAtzc2gtZWQyNTUxOQAAACD1hVZargoGjJ6uv2I78mmBsGIX0O2pHLl+OhqwVexwvg
   AAAECzM8/e5THHYtQnOL75rN7O2l9PrQz3fFSBANMqp3bIEPWFVlquCgaMnq6/YjvyaYGw
   YhfQ7akcuX46GrBV7HC+AAAAGmdpdGh1Yi1hY3Rpb25zQHNvZ29vZHMubmV0AQID
   -----END OPENSSH PRIVATE KEY-----
   ```

### ステップ2: ワークフローファイルの追加

1. **GitHubリポジトリ**で新しいファイルを作成:
   - パス: `.github/workflows/deploy-sakura.yml`
   - 内容: 下記のワークフロー設定をコピー

### ステップ3: 自動デプロイの確認

設定完了後:
1. **コード変更** → **プッシュ**
2. **GitHub Actions** が自動実行
3. **約1-2分後** にSakuraサーバーに反映

---

## 📂 サーバーディレクトリ構造

### デプロイ後の構成:
```
/home/sogoodsnet/www/
├── index.html              # メインページ
├── about.html              # アバウトページ  
├── style.css               # スタイルシート
├── README.md               # プロジェクト説明
├── DEPLOYMENT.md           # デプロイ手順
└── GITHUB_ACTIONS.md       # GitHub Actions設定
```

### バックアップディレクトリ:
```
/home/sogoodsnet/backup/
└── sogoods-backup-YYYYMMDD-HHMMSS/  # 自動バックアップ
    ├── index.html (旧版)
    └── ...
```

---

## 🔄 デプロイフロー

```mermaid
graph TD
    A[コードをプッシュ] --> B[GitHub Actions開始]
    B --> C[SSH接続確立]
    C --> D[既存ファイルをバックアップ]
    D --> E[最新コードを取得]
    E --> F[不要ファイルを削除]
    F --> G[ファイル権限を設定]
    G --> H[デプロイ完了]
    H --> I[Sakuraサーバーで公開]
```

---

## 🛠️ 機能

### ✅ **自動バックアップ**
- デプロイ前に既存ファイルを自動バックアップ
- バックアップ先: `/home/sogoodsnet/backup/`
- 日時付きフォルダで管理

### ✅ **クリーンデプロイ**
- 開発用ファイル（AGENT.md等）を自動除外
- 本番に必要なファイルのみをデプロイ

### ✅ **権限設定**
- HTMLファイル: 644
- CSSファイル: 644  
- JSファイル: 644
- ディレクトリ: 755

### ✅ **エラーハンドリング**
- SSH接続失敗時の詳細ログ
- ファイル権限エラーの自動修復

---

## 🌐 アクセスURL

デプロイ完了後、以下のURLでサイトにアクセス可能:

- **メインサイト**: `https://sogoodsnet.sakura.ne.jp/`
- **アバウトページ**: `https://sogoodsnet.sakura.ne.jp/about.html`

---

## 🔧 トラブルシューティング

### よくある問題:

#### 1. **SSH接続エラー**
```bash
# ローカルでSSH接続をテスト
ssh -i ~/.ssh/private_key sogoodsnet@sogoodsnet.sakura.ne.jp
```

#### 2. **権限エラー**
```bash
# サーバー側で権限を確認
ls -la /home/sogoodsnet/www/
chmod -R 644 /home/sogoodsnet/www/*.html
chmod -R 644 /home/sogoodsnet/www/*.css
```

#### 3. **デプロイディレクトリ作成**
```bash
# サーバー側でディレクトリを確認・作成
mkdir -p /home/sogoodsnet/www
mkdir -p /home/sogoodsnet/backup
```

### ログの確認:
- **GitHub**: Actions タブでワークフローログを確認
- **Sakura**: SSH接続してデプロイログを確認

---

## 🎯 推奨設定

1. **GitHub Pages** - 開発・テスト用 ✅ 
2. **Sakura サーバー** - 本番・カスタムドメイン用 🌸

**両方設定することで、開発環境と本番環境の使い分けが可能です！**