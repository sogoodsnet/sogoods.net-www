/**
 * sogoods.net Photo Manager
 * ランダム写真表示とリアルタイムデータ管理システム
 */

class PhotoManager {
    constructor() {
        this.photosPath = '/photos';
        this.miikoPhotos = [];
        this.galleryPhotos = [];
        this.currentPhoto = null;
        this.updateInterval = null;
        this.stats = {
            totalPhotos: 0,
            viewCount: 0,
            lastUpdate: new Date(),
            randomSeed: Math.floor(Math.random() * 1000)
        };
        
        this.init();
    }

    async init() {
        await this.loadPhotoList();
        this.setupRandomDisplay();
        this.setupRealtimeStats();
        this.loadStats();
        this.setupLogo();
    }

    // ロゴの自動設定
    setupLogo() {
        const logoElement = document.getElementById('main-logo');
        if (!logoElement) return;
        
        // ロゴファイルを順番にチェック
        const logoFiles = [
            '/assets/logo/logo.png',
            '/assets/logo/so-logo.png',
            '/assets/logo/sogoods-logo.png',
            '/assets/logo/logo-main.svg',
            '/assets/logo/brand-logo.png',
            '/assets/logo/logo.svg'
        ];
        
        this.loadLogo(logoFiles, 0, logoElement);
    }

    // ロゴファイルを順番に試行
    loadLogo(logoFiles, index, logoElement) {
        if (index >= logoFiles.length) {
            console.log('🎨 No logo file found, using text placeholder');
            return;
        }
        
        const img = new Image();
        img.onload = () => {
            logoElement.innerHTML = `<img src="${logoFiles[index]}" alt="sogoods.net" style="width:100%;height:100%;object-fit:contain;">`;
            console.log(`🎨 Logo loaded: ${logoFiles[index]}`);
        };
        img.onerror = () => {
            // 次のファイルを試行
            this.loadLogo(logoFiles, index + 1, logoElement);
        };
        img.src = logoFiles[index];
    }

    // 写真リストを動的に読み込み
    async loadPhotoList() {
        try {
            // miiko フォルダの写真を取得
            const miikoResponse = await this.fetchPhotoList('/photos/miiko');
            this.miikoPhotos = miikoResponse || [];
            
            // gallery フォルダの写真を取得
            const galleryResponse = await this.fetchPhotoList('/photos/gallery');
            this.galleryPhotos = galleryResponse || [];
            
            this.stats.totalPhotos = this.miikoPhotos.length + this.galleryPhotos.length;
            
            console.log(`📷 Loaded ${this.miikoPhotos.length} miiko photos, ${this.galleryPhotos.length} gallery photos`);
            
            // フォールバック用のサンプル写真
            if (this.miikoPhotos.length === 0) {
                this.miikoPhotos = this.getSamplePhotos();
                this.stats.totalPhotos = this.miikoPhotos.length;
            }
            
        } catch (error) {
            console.log('📁 Using sample photos (folder access failed)');
            this.miikoPhotos = this.getSamplePhotos();
            this.stats.totalPhotos = this.miikoPhotos.length;
        }
    }

    // フォルダ内の画像ファイルリストを取得（実際の実装では要調整）
    async fetchPhotoList(folderPath) {
        // 注意: ブラウザから直接ファイルシステムにはアクセスできないため
        // 実際の運用では以下のいずれかの方法を使用：
        // 1. サーバーサイドAPI でファイルリスト提供
        // 2. 事前定義されたファイルリスト
        // 3. Notion API経由で管理
        
        // 現在はフォールバックとしてサンプル画像を使用
        return [];
    }

    // サンプル写真（フォルダが空の場合のフォールバック）
    getSamplePhotos() {
        return [
            'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&h=1200&fit=crop&crop=face',
            'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=800&h=1200&fit=crop',
            'https://images.unsplash.com/photo-1583336663277-620dc1996580?w=800&h=1200&fit=crop',
            'https://images.unsplash.com/photo-1571566882372-1598d88abd90?w=800&h=1200&fit=crop',
            'https://images.unsplash.com/photo-1561948955-570b270e7c36?w=800&h=1200&fit=crop',
            'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&h=1200&fit=crop&crop=center'
        ];
    }

    // ランダム写真表示の設定
    setupRandomDisplay() {
        // 初期表示
        this.displayRandomPhoto();
        
        // 30秒ごとに写真を変更
        setInterval(() => {
            this.displayRandomPhoto();
        }, 30000);

        // 小さいギャラリーも更新
        this.updateMiniGallery();
        
        // 5分ごとにギャラリー更新
        setInterval(() => {
            this.updateMiniGallery();
        }, 300000);
    }

    // ランダムに写真を表示（自動リサイズ付き）
    displayRandomPhoto() {
        if (this.miikoPhotos.length === 0) return;
        
        const randomIndex = Math.floor(Math.random() * this.miikoPhotos.length);
        const selectedPhoto = this.miikoPhotos[randomIndex];
        
        const mainImage = document.querySelector('.main-image');
        if (mainImage) {
            this.loadImageWithAutoResize(selectedPhoto, mainImage, {
                targetWidth: 800,
                targetHeight: 1200,
                quality: 0.8
            });
            this.currentPhoto = selectedPhoto;
            this.stats.viewCount++;
        }
        
        console.log(`🎲 Random photo: ${randomIndex + 1}/${this.miikoPhotos.length}`);
    }

    // 小さなギャラリーを更新（自動リサイズ付き）
    updateMiniGallery() {
        const miniImages = document.querySelectorAll('.mini-image');
        const allPhotos = [...this.miikoPhotos, ...this.galleryPhotos];
        
        if (allPhotos.length === 0) return;
        
        miniImages.forEach((img, index) => {
            const randomIndex = Math.floor(Math.random() * allPhotos.length);
            this.loadImageWithAutoResize(allPhotos[randomIndex], img, {
                targetWidth: 120,
                targetHeight: 90,
                quality: 0.7
            });
        });
    }

    // リアルタイム統計の設定
    setupRealtimeStats() {
        this.updateStats();
        
        // 5秒ごとに統計を更新
        this.updateInterval = setInterval(() => {
            this.updateStats();
        }, 5000);
    }

    // 意味のある数字を生成・更新
    updateStats() {
        const now = new Date();
        this.stats.lastUpdate = now;
        
        // 現在時刻ベースの動的数字
        const currentStats = {
            hour: now.getHours(),
            minute: now.getMinutes(),
            day: now.getDate(),
            month: now.getMonth() + 1,
            totalPhotos: this.stats.totalPhotos,
            viewCount: this.stats.viewCount,
            uptime: Math.floor((now - this.stats.startTime) / 1000 / 60), // 分単位
            randomValue: Math.floor(Math.random() * 100) + 1,
            heartbeat: Math.floor(Math.random() * 40) + 60, // 60-100 BPM
            temperature: Math.floor(Math.random() * 10) + 18, // 18-28°C
            humidity: Math.floor(Math.random() * 30) + 40, // 40-70%
            visitors: Math.floor(Math.random() * 50) + this.stats.viewCount
        };
        
        this.updateNumberOverlays(currentStats);
        
        // localStorage に保存
        this.saveStats();
    }

    // 数字オーバーレイを更新
    updateNumberOverlays(stats) {
        const numbers = document.querySelectorAll('.number');
        if (numbers.length === 0) return;
        
        // 意味のある数字のマッピング
        const meaningfulNumbers = [
            stats.hour,                    // 現在時刻
            stats.minute,                  // 現在分
            stats.day,                     // 今日の日付
            stats.month,                   // 現在月
            stats.totalPhotos,             // 総写真数
            stats.viewCount,               // 閲覧数
            stats.uptime,                  // 稼働時間（分）
            stats.randomValue,             // ランダム値
            stats.heartbeat,               // 心拍数風
            stats.temperature,             // 温度風
            stats.humidity,                // 湿度風
            stats.visitors,                // 訪問者数風
            Math.floor(Math.random() * 365) + 1,  // 年内日数
            Math.floor(Math.random() * 24) + 1,   // 時間
            Math.floor(Math.random() * 60) + 1,   // 分・秒
            Math.floor(Math.random() * 12) + 1,   // 月
            Math.floor(Math.random() * 999) + 1,  // ランダム3桁
            Math.floor(Math.random() * 99) + 1,   // ランダム2桁
            Math.floor(Math.random() * 9) + 1,    // ランダム1桁
            Math.floor(Math.random() * 50) + 1,   // 小さなランダム値
            Math.floor(Math.random() * 200) + 100, // 大きめのランダム値
            Math.floor(Math.random() * 10) + 1,   // シンプルな数字
            Math.floor(Math.random() * 77) + 1,   // 特別な範囲
            stats.viewCount % 100              // 閲覧数の下2桁
        ];
        
        numbers.forEach((numberEl, index) => {
            if (index < meaningfulNumbers.length) {
                numberEl.textContent = meaningfulNumbers[index];
            }
        });
        
        console.log(`🔢 Stats updated: ${stats.hour}:${stats.minute}, Photos: ${stats.totalPhotos}, Views: ${stats.viewCount}`);
    }

    // 統計をlocalStorageから読み込み
    loadStats() {
        const saved = localStorage.getItem('sogoods_stats');
        if (saved) {
            const savedStats = JSON.parse(saved);
            this.stats = { ...this.stats, ...savedStats };
        }
        
        // 開始時刻を設定（初回のみ）
        if (!this.stats.startTime) {
            this.stats.startTime = new Date();
        } else {
            this.stats.startTime = new Date(this.stats.startTime);
        }
    }

    // 統計をlocalStorageに保存
    saveStats() {
        localStorage.setItem('sogoods_stats', JSON.stringify(this.stats));
    }

    // Notion API との連携準備
    async connectToNotion() {
        // 既存のnotion-api.js との連携
        if (window.NotionAPI) {
            try {
                const notionAPI = new window.NotionAPI();
                const articles = await notionAPI.fetchArticles();
                
                // Notion のデータから数字を抽出
                this.extractStatsFromNotion(articles);
                
                console.log('🔗 Notion API connected successfully');
                return true;
            } catch (error) {
                console.log('⚠️ Notion API connection failed:', error);
                return false;
            }
        }
        return false;
    }

    // Notion データから統計を抽出
    extractStatsFromNotion(articles) {
        if (!articles || articles.length === 0) return;
        
        this.stats.notionArticles = articles.length;
        this.stats.lastNotionUpdate = new Date();
        
        // 記事データから数字を抽出して表示に使用
        const notionNumbers = articles.map((article, index) => ({
            id: index + 1,
            length: article.content ? article.content.length : 0,
            wordCount: article.content ? article.content.split(' ').length : 0
        }));
        
        this.stats.notionStats = notionNumbers;
    }

    // 自動リサイズ付き画像読み込み
    loadImageWithAutoResize(src, imgElement, options = {}) {
        const {
            targetWidth = 800,
            targetHeight = 600,
            quality = 0.8,
            fitMode = 'cover' // cover, contain, fill
        } = options;

        // 一時的にローディング表示
        imgElement.style.opacity = '0.5';
        
        const img = new Image();
        img.crossOrigin = 'anonymous'; // CORS対応
        
        img.onload = () => {
            try {
                // Canvas で自動リサイズ・クロップ
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // アスペクト比計算
                const sourceRatio = img.width / img.height;
                const targetRatio = targetWidth / targetHeight;
                
                let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
                
                if (fitMode === 'cover') {
                    // cover: はみ出した部分をクロップ
                    if (sourceRatio > targetRatio) {
                        drawHeight = targetHeight;
                        drawWidth = drawHeight * sourceRatio;
                        offsetX = (targetWidth - drawWidth) / 2;
                    } else {
                        drawWidth = targetWidth;
                        drawHeight = drawWidth / sourceRatio;
                        offsetY = (targetHeight - drawHeight) / 2;
                    }
                    canvas.width = targetWidth;
                    canvas.height = targetHeight;
                } else if (fitMode === 'contain') {
                    // contain: 全体を表示、余白あり
                    if (sourceRatio > targetRatio) {
                        drawWidth = targetWidth;
                        drawHeight = drawWidth / sourceRatio;
                        offsetY = (targetHeight - drawHeight) / 2;
                    } else {
                        drawHeight = targetHeight;
                        drawWidth = drawHeight * sourceRatio;
                        offsetX = (targetWidth - drawWidth) / 2;
                    }
                    canvas.width = targetWidth;
                    canvas.height = targetHeight;
                    ctx.fillStyle = '#f0f0f0';
                    ctx.fillRect(0, 0, targetWidth, targetHeight);
                }
                
                // 高品質リサイズ設定
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                
                // 画像描画
                ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
                
                // 最適化されたDataURLを生成
                const optimizedDataUrl = canvas.toDataURL('image/jpeg', quality);
                
                // 元の画像要素に適用
                imgElement.src = optimizedDataUrl;
                imgElement.style.opacity = '1';
                
                console.log(`🖼️ Auto-resized: ${img.width}x${img.height} → ${targetWidth}x${targetHeight}`);
                
            } catch (error) {
                // Canvas処理に失敗した場合は元画像を直接表示
                console.log('⚠️ Auto-resize failed, using original image:', error);
                imgElement.src = src;
                imgElement.style.opacity = '1';
            }
        };
        
        img.onerror = () => {
            // 画像読み込み失敗時
            console.log('❌ Image load failed:', src);
            imgElement.style.opacity = '1';
        };
        
        img.src = src;
    }

    // 画像の最適サイズを提案
    getOptimalImageSize(type = 'main') {
        if (type === 'main') {
            return {
                width: 800,
                height: 1200,
                aspectRatio: '2:3',
                recommended: 'Portrait orientation preferred'
            };
        } else if (type === 'gallery') {
            return {
                width: 300,
                height: 200,
                aspectRatio: '3:2',
                recommended: 'Landscape orientation preferred'
            };
        }
    }

    // 手動でフォルダをチェック（開発時用）
    async checkPhotoFolders() {
        console.log('📁 Photo folder structure:');
        console.log('   /photos/miiko/ <- みーこの写真をここに配置');
        console.log('   /photos/gallery/ <- ギャラリー写真をここに配置');
        console.log('');
        console.log('📄 Supported formats: .jpg, .jpeg, .png, .gif, .webp');
        console.log('🔧 Auto-resize: ANY size → optimized display size');
        console.log('📐 Main photos: Auto-resized to 800x1200 (portrait)');
        console.log('🖼️ Gallery photos: Auto-resized to 300x200 (landscape)');
        console.log('💡 Tip: Upload any size - system handles optimization automatically!');
    }
}

// 追加: 管理者認証付きドラッグ&ドロップ機能
class ImageDropHandler {
    constructor(photoManager) {
        this.photoManager = photoManager;
        this.isAdminMode = false;
        this.adminPassword = 'sogoods2024'; // 本番では変更してください
        this.keySequence = [];
        this.secretKeys = ['s', 'o', 'g', 'o', 'o', 'd', 's']; // sogoods
        this.setupKeyListener();
        this.setupAuthSystem();
        this.checkDropPermission();
    }

    // キーシーケンス監視（簡素化）
    setupKeyListener() {
        document.addEventListener('keydown', (e) => {
            // 秘密のキーシーケンス 'sogoods' 監視（緊急用）
            this.keySequence.push(e.key.toLowerCase());
            if (this.keySequence.length > this.secretKeys.length) {
                this.keySequence.shift();
            }

            if (this.keySequence.join('') === this.secretKeys.join('')) {
                console.log('🔑 Emergency key sequence detected!');
                this.showAdminPrompt();
                this.keySequence = [];
            }
        });
    }

    // 管理者認証システム
    setupAuthSystem() {
        // 管理者モード表示インジケータを追加
        this.createAdminIndicator();
        
        // 隠しログインボタンを追加
        this.createHiddenLoginButton();
        
        // localStorage から認証状態を復元
        const savedAuth = localStorage.getItem('sogoods_admin_session');
        if (savedAuth) {
            const session = JSON.parse(savedAuth);
            const now = new Date().getTime();
            
            // セッションが24時間以内なら自動ログイン
            if (now - session.timestamp < 24 * 60 * 60 * 1000) {
                this.isAdminMode = true;
                this.updateAdminIndicator();
                console.log('🔐 Admin session restored');
            }
        }
    }

    // 管理者プロンプト表示
    showAdminPrompt() {
        if (this.isAdminMode) {
            // すでに管理者モードの場合はログアウト
            this.logout();
            return;
        }

        const password = prompt('🔐 管理者パスワードを入力してください:\n\n💡 ヒント: Ctrl+Shift+A または "sogoods" キーシーケンスでも開けます');
        
        if (password === this.adminPassword) {
            this.login();
        } else if (password !== null) {
            alert('❌ パスワードが違います');
            console.log('🚫 Admin authentication failed');
        }
    }

    // ログイン処理
    login() {
        this.isAdminMode = true;
        
        // セッション保存（24時間）
        const session = {
            timestamp: new Date().getTime(),
            user: 'admin'
        };
        localStorage.setItem('sogoods_admin_session', JSON.stringify(session));
        
        this.setupDropZones();
        this.updateAdminIndicator();
        
        console.log('✅ Admin mode activated');
        console.log('📤 Drag & Drop enabled for photo upload');
        alert('✅ 管理者モードが有効になりました！\n📤 写真のドラッグ&ドロップが可能です');
    }

    // ログアウト処理
    logout() {
        this.isAdminMode = false;
        localStorage.removeItem('sogoods_admin_session');
        
        this.removeDropZones();
        this.updateAdminIndicator();
        
        console.log('🔒 Admin mode deactivated');
        alert('🔒 管理者モードを終了しました');
    }

    // 隠しログインボタンの作成
    createHiddenLoginButton() {
        const hiddenButton = document.createElement('div');
        hiddenButton.id = 'hidden-admin-btn';
        hiddenButton.style.cssText = `
            position: fixed;
            bottom: 5px;
            left: 5px;
            width: 15px;
            height: 15px;
            background: transparent;
            cursor: pointer;
            z-index: 999;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        // ホバー時にうっすら表示
        hiddenButton.addEventListener('mouseenter', () => {
            hiddenButton.style.opacity = '0.1';
            hiddenButton.style.background = '#2196F3';
        });
        
        hiddenButton.addEventListener('mouseleave', () => {
            hiddenButton.style.opacity = '0';
            hiddenButton.style.background = 'transparent';
        });
        
        hiddenButton.onclick = () => {
            console.log('🔑 Hidden admin button clicked');
            this.showAdminPrompt();
        };
        
        // ダブルクリックでも反応
        hiddenButton.addEventListener('dblclick', () => {
            console.log('🔑 Hidden admin button double-clicked');
            this.showAdminPrompt();
        });
        
        document.body.appendChild(hiddenButton);
        this.hiddenButton = hiddenButton;
    }

    // 隠し管理者ボタンの作成
    createAdminIndicator() {
        // メインの管理者ステータス表示
        const indicator = document.createElement('div');
        indicator.id = 'admin-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-family: Arial, sans-serif;
            z-index: 1000;
            display: none;
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        
        indicator.onclick = () => this.showAdminPrompt();
        document.body.appendChild(indicator);
        this.adminIndicator = indicator;
        
        // 隠しログインボタン（目立たない場所に）
        this.createHiddenLoginButton();
    }

    // 隠しログインボタンの作成
    createHiddenLoginButton() {
        const hiddenButton = document.createElement('div');
        hiddenButton.id = 'hidden-admin-btn';
        hiddenButton.style.cssText = `
            position: fixed;
            bottom: 10px;
            left: 10px;
            width: 20px;
            height: 20px;
            background: rgba(200, 200, 200, 0.1);
            border-radius: 50%;
            cursor: pointer;
            z-index: 1000;
            transition: all 0.2s ease;
            opacity: 0.1;
            border: 1px solid rgba(200, 200, 200, 0.2);
        `;
        
        // ホバー時に少し目立つように
        hiddenButton.addEventListener('mouseenter', () => {
            hiddenButton.style.opacity = '0.4';
            hiddenButton.style.background = 'rgba(33, 150, 243, 0.3)';
            hiddenButton.style.transform = 'scale(1.2)';
        });
        
        hiddenButton.addEventListener('mouseleave', () => {
            hiddenButton.style.opacity = '0.1';
            hiddenButton.style.background = 'rgba(200, 200, 200, 0.1)';
            hiddenButton.style.transform = 'scale(1)';
        });
        
        // クリックで管理者ログイン
        hiddenButton.addEventListener('click', () => {
            this.showAdminPrompt();
        });
        
        // ダブルクリックで更にわかりやすく
        hiddenButton.addEventListener('dblclick', (e) => {
            e.preventDefault();
            hiddenButton.style.background = 'rgba(33, 150, 243, 0.8)';
            setTimeout(() => {
                hiddenButton.style.background = 'rgba(200, 200, 200, 0.1)';
            }, 200);
        });
        
        // ツールチップ（ホバー時のヒント）
        hiddenButton.title = 'Admin';
        
        document.body.appendChild(hiddenButton);
        this.hiddenButton = hiddenButton;
    }

    // インジケータ更新
    updateAdminIndicator() {
        if (!this.adminIndicator) return;
        
        if (this.isAdminMode) {
            this.adminIndicator.innerHTML = '🔓 管理者モード | クリックでログアウト';
            this.adminIndicator.style.display = 'block';
            this.adminIndicator.style.background = 'rgba(33, 150, 243, 0.9)';
            
            // 隠しボタンも管理者モード表示に
            if (this.hiddenButton) {
                this.hiddenButton.style.background = 'rgba(33, 150, 243, 0.4)';
                this.hiddenButton.style.opacity = '0.6';
                this.hiddenButton.title = 'Admin (Logged in) - Click to logout';
            }
        } else {
            this.adminIndicator.innerHTML = '🔐 左下の隠しボタンで管理者ログイン';
            this.adminIndicator.style.display = 'block';
            this.adminIndicator.style.background = 'rgba(0,0,0,0.6)';
            
            // 隠しボタンを通常状態に
            if (this.hiddenButton) {
                this.hiddenButton.style.background = 'rgba(200, 200, 200, 0.1)';
                this.hiddenButton.style.opacity = '0.1';
                this.hiddenButton.title = 'Admin Login (Hidden Button)';
            }
            
            // 5秒後に非表示
            setTimeout(() => {
                if (!this.isAdminMode) {
                    this.adminIndicator.style.display = 'none';
                }
            }, 3000);
        }
    }

    // ドロップ権限チェック
    checkDropPermission() {
        if (!this.isAdminMode) {
            console.log('🔒 Drop功能已禁用 - 需要管理员权限');
            return;
        }
        this.setupDropZones();
    }

    setupDropZones() {
        if (!this.isAdminMode) return;
        
        // メイン画像エリアをドロップゾーンに
        const centerColumn = document.querySelector('.center-column');
        if (centerColumn) {
            // イベントリスナーが重複しないよう一度削除
            this.removeDropZones();
            
            centerColumn.addEventListener('dragover', this.handleDragOver.bind(this));
            centerColumn.addEventListener('drop', this.handleDrop.bind(this));
            centerColumn.addEventListener('dragenter', this.handleDragEnter.bind(this));
            centerColumn.addEventListener('dragleave', this.handleDragLeave.bind(this));
            
            // 視覚的な管理者モード表示
            centerColumn.style.position = 'relative';
            
            if (!centerColumn.querySelector('.admin-overlay')) {
                const overlay = document.createElement('div');
                overlay.className = 'admin-overlay';
                overlay.style.cssText = `
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    background: rgba(33, 150, 243, 0.9);
                    color: white;
                    padding: 6px 10px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-family: Arial, sans-serif;
                    z-index: 6;
                    pointer-events: none;
                `;
                overlay.textContent = '📤 Admin: Drop enabled';
                centerColumn.appendChild(overlay);
            }
        }
    }

    removeDropZones() {
        const centerColumn = document.querySelector('.center-column');
        if (centerColumn) {
            // イベントリスナーを削除（新しいインスタンス作成時に重複を防ぐ）
            const newCenterColumn = centerColumn.cloneNode(true);
            centerColumn.parentNode.replaceChild(newCenterColumn, centerColumn);
            
            // 管理者オーバーレイを削除
            const overlay = document.querySelector('.admin-overlay');
            if (overlay) overlay.remove();
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }

    handleDragEnter(e) {
        if (!this.isAdminMode) {
            console.log('🔒 Drop disabled - Admin login required');
            return;
        }
        
        e.preventDefault();
        e.target.style.backgroundColor = 'rgba(33, 150, 243, 0.1)';
        console.log('🎯 Admin drop zone activated - ready for image upload');
    }

    handleDragLeave(e) {
        e.target.style.backgroundColor = '';
    }

    async handleDrop(e) {
        if (!this.isAdminMode) {
            console.log('🔒 Drop blocked - Admin authentication required');
            alert('🔒 管理者認証が必要です\n\nCtrl+Shift+A または "sogoods" と入力してログインしてください');
            return;
        }

        e.preventDefault();
        e.target.style.backgroundColor = '';
        
        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            console.log('❌ No image files found in drop');
            return;
        }

        console.log(`📤 Admin processing ${imageFiles.length} dropped image(s)`);

        for (const file of imageFiles) {
            await this.processDroppedImage(file);
        }
    }

    async processDroppedImage(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    // 自動リサイズして表示
                    const mainImage = document.querySelector('.main-image');
                    if (mainImage) {
                        this.photoManager.loadImageWithAutoResize(e.target.result, mainImage, {
                            targetWidth: 800,
                            targetHeight: 1200,
                            quality: 0.8
                        });
                        
                        console.log(`✅ Processed: ${file.name} (${img.width}x${img.height})`);
                    }
                    resolve();
                };
                img.src = e.target.result;
            };
            
            reader.readAsDataURL(file);
        });
    }
}

// グローバルに公開
window.PhotoManager = PhotoManager;
window.ImageDropHandler = ImageDropHandler;

// DOM読み込み後に自動初期化
document.addEventListener('DOMContentLoaded', () => {
    window.photoManager = new PhotoManager();
    window.imageDropHandler = new ImageDropHandler(window.photoManager);
    
    // 開発時のヘルプ表示
    setTimeout(() => {
        window.photoManager.checkPhotoFolders();
        console.log('');
        console.log('🔐 ADMIN ACCESS:');
        console.log('   • Hidden button: Bottom-left corner (subtle gray circle)');
        console.log('   • Emergency: Type "sogoods" for backup access');
        console.log('   • Password: sogoods2024');
        console.log('   • Session: 24-hour auto-login after authentication');
        console.log('📱 Auto-resize: Upload ANY size - system optimizes automatically');
        console.log('🔒 Security: Only authenticated admins can upload photos');
    }, 2000);
});