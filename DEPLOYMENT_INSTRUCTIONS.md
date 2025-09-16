# 🚀 sogoods.net デプロイメント完了ガイド

## ✅ 準備完了ファイル

すべてのファイルが最新の状態で準備されています：

### 🎨 **メインサイト**
- **index.html** (13KB) - SO logo + SOGOODS.NET + TII section
- **photo-manager.js** (13KB) - 動的写真・統計システム  
- **notion-api.js** (8.2KB) - Notion API 連携
- **assets/logo/so-logo.png** (1.6KB) - 青/黄色のSOロゴ

### 📁 **フォルダ構造**
```
/photos/miiko/     # みーこの写真
/photos/gallery/   # ギャラリー写真
/assets/logo/      # ロゴファイル
```

## 🚀 デプロイメント方法

### **方法1: GitHub Actions (推奨)**

1. **GitHubにアクセス**:
   https://github.com/sogoodsnet/sogoods.net-www/actions/workflows/deploy-sakura-simple.yml

2. **手動実行**:
   - 右上の「**Run workflow**」ボタンをクリック
   - ブランチ「**main**」を選択
   - 「**Run workflow**」を実行

3. **実行確認**:
   - ワークフローが開始されます（約2-3分）
   - 完了後、サイトが自動更新されます

### **方法2: 手動アップロード**

SSHアクセスがある場合：

```bash
# 1. メインファイルをアップロード
scp index.html photo-manager.js notion-api.js \
    sogoodsnet@sogoodsnet.sakura.ne.jp:~/www/

# 2. ロゴをアップロード
ssh sogoodsnet@sogoodsnet.sakura.ne.jp 'mkdir -p ~/www/assets/logo'
scp assets/logo/so-logo.png \
    sogoodsnet@sogoodsnet.sakura.ne.jp:~/www/assets/logo/

# 3. フォルダ作成
ssh sogoodsnet@sogoodsnet.sakura.ne.jp \
    'mkdir -p ~/www/photos/miiko ~/www/photos/gallery'

# 4. 権限設定
ssh sogoodsnet@sogoodsnet.sakura.ne.jp \
    'chmod 644 ~/www/*.html ~/www/*.js && chmod -R 755 ~/www/assets ~/www/photos'
```

## 🌐 デプロイ後のURL

### **本番サイト**
- **Sakura Server**: https://sogoodsnet.sakura.ne.jp/
- **GitHub Pages**: https://sogoodsnet.github.io/sogoods.net-www/ (要設定)

### **開発サーバー** (現在アクティブ)
- **Dev Server**: https://8000-iuba4jyqih3m9wxl2ysut-6532622b.e2b.dev

## ✨ デプロイ内容

### 🎨 **デザイン特徴**
- **SOロゴ**: 青と黄色の50x35pxロゴ
- **SOGOODS.NET**: 48px巨大ブランドテキスト
- **TIIセクション**: 右側ダークテーマエリア
- **参考画像ベース**: 忠実な3カラムレイアウト

### ⚡ **動的機能**
- **写真ローテーション**: 30秒ごと自動切り替え
- **リアルタイム数字**: 5秒ごと統計更新
- **自動ロゴ検出**: システムが自動でロゴ適用
- **Notion連携**: APIで動的コンテンツ取得

### 📱 **レスポンシブ対応**
- **デスクトップ**: 3カラム最適表示
- **モバイル**: 縦積みレイアウト
- **タブレット**: 適応的レスポンシブ

## 🔧 デプロイ後の作業

### 1. **写真アップロード**
```bash
# みーこの写真をアップロード
scp miiko_*.jpg sogoodsnet@sogoodsnet.sakura.ne.jp:~/www/photos/miiko/

# ギャラリー写真をアップロード
scp gallery_*.jpg sogoodsnet@sogoodsnet.sakura.ne.jp:~/www/photos/gallery/
```

### 2. **Notion API設定**
- Notion APIキーの設定
- データベースID設定
- 動的コンテンツの有効化

### 3. **GitHub Pages有効化**
1. リポジトリ → Settings → Pages
2. Source: "GitHub Actions" 選択
3. 自動デプロイ有効化

## 📊 デプロイメント状況

- ✅ **ローカル開発**: 完了・テスト済み
- ✅ **ファイル準備**: すべて最新版準備完了  
- ⏳ **本番デプロイ**: GitHub Actions実行待ち
- ⏳ **動作確認**: デプロイ後に実施予定

## 🆘 トラブルシューティング

### **サイトにアクセスできない場合**
1. GitHub Actionsの実行状況を確認
2. Sakura サーバーのファイル権限確認 
3. DNS設定・ドメイン確認

### **ロゴが表示されない場合**  
1. `/assets/logo/so-logo.png` のパス確認
2. ファイル権限確認（644推奨）
3. ブラウザキャッシュクリア

### **写真が表示されない場合**
1. `/photos/` フォルダ権限確認（755推奨）
2. 画像ファイル形式確認（jpg,png,gif,webp）
3. photo-manager.js 読み込み確認

---

**🎯 次のステップ**: GitHub Actions ワークフローを実行して本番デプロイを完了してください！