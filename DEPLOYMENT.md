# 🚀 SoGoods.net サーバー同期・デプロイ手順

GitHubリポジトリ: `https://github.com/sogoodsnet/sogoods.net-www`

## 📋 同期方法の選択肢

### 1. GitHub Pages（推奨・最簡単）

**手順:**
1. GitHubリポジトリページにアクセス
2. `Settings` → `Pages` を開く
3. `Source` を `Deploy from a branch` に設定
4. `Branch` を `main` / `/ (root)` に設定
5. `Save` をクリック

**結果:** 
- 自動的に `https://sogoodsnet.github.io/sogoods.net-www/` で公開
- コミットするたびに自動更新
- 設定不要で即座に利用可能

---

### 2. GitHub Actions（自動デプロイ）

**特徴:**
- `.github/workflows/deploy.yml` を使用
- コミット時に自動的にデプロイ処理が実行
- GitHub Pagesまたはカスタムサーバーに対応

**有効化方法:**
1. リポジトリの `Actions` タブで確認
2. 必要に応じて `deploy.yml` の設定を調整

---

### 3. 手動サーバー同期

**サーバー側での実行:**

```bash
# スクリプトをダウンロード
wget https://raw.githubusercontent.com/sogoodsnet/sogoods.net-www/main/deploy-server.sh

# 実行権限を付与
chmod +x deploy-server.sh

# デプロイ実行（デフォルト: /var/www/html/sogoods）
./deploy-server.sh

# カスタムパスに デプロイ
./deploy-server.sh /path/to/your/web/directory
```

**スクリプトの機能:**
- 既存ファイルを自動バックアップ
- GitHubから最新版を取得
- ファイル権限を適切に設定
- Webサーバーを自動再起動

---

### 4. Webhook自動同期

**サーバー設定:**

1. **webhook-deploy.phpをサーバーに配置:**
   ```bash
   # サーバーの適切な場所（例: /var/www/webhook/）に配置
   wget https://raw.githubusercontent.com/sogoodsnet/sogoods.net-www/main/webhook-deploy.php
   ```

2. **設定を編集:**
   ```php
   define('WEBHOOK_SECRET', 'your-secret-key'); // 任意の秘密鍵
   define('TARGET_DIR', '/var/www/html/sogoods'); // デプロイ先
   ```

3. **GitHub Webhook設定:**
   - Repository → Settings → Webhooks
   - Payload URL: `https://your-domain.com/webhook-deploy.php`
   - Content type: `application/json`
   - Secret: 上記で設定した秘密鍵
   - Events: `Just the push event`

**結果:**
- GitHubにプッシュすると自動的にサーバー更新
- ログファイル (`/tmp/sogoods-deploy.log`) で状況確認可能

---

## 🛠️ サーバー要件

### 最小要件
- **Webサーバー**: Apache または Nginx
- **権限**: ファイル書き込み権限
- **Git**: インストール済み（方法3・4の場合）

### 推奨環境
- **OS**: Ubuntu 20.04+ / CentOS 8+
- **PHP**: 7.4+（Webhook使用時）
- **SSL**: HTTPS対応推奨

---

## 📂 ディレクトリ構成（デプロイ後）

```
/var/www/html/sogoods/
├── index.html          # メインページ
├── about.html          # アバウトページ
├── style.css           # スタイルシート
├── README.md           # プロジェクト説明
└── .gitignore         # Git設定（削除される場合あり）
```

---

## 🔧 トラブルシューティング

### よくある問題

1. **権限エラー**
   ```bash
   sudo chown -R www-data:www-data /var/www/html/sogoods
   chmod -R 755 /var/www/html/sogoods
   ```

2. **Git認証エラー**
   ```bash
   git config --global credential.helper store
   ```

3. **Webhookが動作しない**
   - サーバーのログを確認: `tail -f /tmp/sogoods-deploy.log`
   - PHP設定を確認: `php -m | grep curl`

### ログ確認
- **GitHub Actions**: Repository → Actions タブ
- **サーバー**: `/tmp/sogoods-deploy.log`
- **Webサーバー**: `/var/log/nginx/` または `/var/log/apache2/`

---

## 🎯 推奨デプロイ方法

### 開発・テスト用
→ **GitHub Pages** (無料・簡単)

### 本番・カスタムドメイン用  
→ **Webhook自動同期** (自動化・高機能)

### 緊急時・メンテナンス用
→ **手動同期スクリプト** (確実・制御可能)