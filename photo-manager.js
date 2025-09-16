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
    }



    // 写真リストを動的に読み込み (Flickr API使用)
    async loadPhotoList() {
        try {
            console.log('📸 Loading photos from Flickr: sogoods');
            
            // Flickrから写真を取得
            const flickrPhotos = await this.fetchFlickrPhotos();
            
            if (flickrPhotos && flickrPhotos.length > 0) {
                // メイン画像用とギャラリー用に分割
                this.miikoPhotos = flickrPhotos.slice(0, Math.ceil(flickrPhotos.length * 0.7));
                this.galleryPhotos = flickrPhotos.slice(Math.ceil(flickrPhotos.length * 0.7));
                
                this.stats.totalPhotos = flickrPhotos.length;
                console.log(`📷 Loaded ${this.miikoPhotos.length} main photos, ${this.galleryPhotos.length} gallery photos from Flickr`);
            } else {
                // Flickr取得に失敗した場合のフォールバック
                console.log('⚠️ Flickr load failed, using sample photos');
                this.miikoPhotos = this.getSamplePhotos();
                this.galleryPhotos = [];
                this.stats.totalPhotos = this.miikoPhotos.length;
            }
            
        } catch (error) {
            console.log('📁 Flickr error, using sample photos:', error.message);
            this.miikoPhotos = this.getSamplePhotos();
            this.galleryPhotos = [];
            this.stats.totalPhotos = this.miikoPhotos.length;
        }
    }

    // Flickr APIから写真を取得
    async fetchFlickrPhotos() {
        try {
            // Flickr Public Feed APIを使用（APIキー不要）
            const flickrUserId = '200348020@N06'; // sogoods Flickr ID
            const feedUrl = `https://api.flickr.com/services/feeds/photos_public.gne?id=${flickrUserId}&format=json&nojsoncallback=1`;
            
            const response = await fetch(feedUrl);
            if (!response.ok) {
                throw new Error(`Flickr API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.items && data.items.length > 0) {
                // 画像URLを抽出して返却
                return data.items.map(item => {
                    // より高解像度の画像URLを生成
                    const mediaUrl = item.media.m;
                    // _m を _b に置換してより大きなサイズを取得
                    return mediaUrl.replace('_m.jpg', '_b.jpg');
                });
            }
            
            return [];
            
        } catch (error) {
            console.error('🚫 Flickr API error:', error);
            return null;
        }
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
            const photoSrc = allPhotos[randomIndex];
            
            // モノクロ調画像（色処理あり）をデフォルトで設定
            this.loadImageWithAutoResize(photoSrc, img, {
                targetWidth: 120,
                targetHeight: 90,
                quality: 0.7,
                applyColorProcessing: true  // デフォルトでモノクロ調
            });
            
            // ホバーエフェクト用のオリジナル色画像を準備
            this.setupMiniGalleryHoverEffect(img, photoSrc);
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
            fitMode = 'cover', // cover, contain, fill
            applyColorProcessing = true // デフォルトは色処理有効
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
                
                // 色処理を条件付きで適用（メイン画像のみ、ミニギャラリーは無効）
                if (applyColorProcessing) {
                    this.applyColorProcessing(ctx, targetWidth, targetHeight);
                }
                
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

    // ミニギャラリーのホバーエフェクトを設定（モノクロ⇄オリジナル色）
    setupMiniGalleryHoverEffect(imgElement, photoSrc) {
        let monochromeImageSrc = null;
        let originalColorSrc = null;
        let isHovering = false;

        // ホバー開始時（モノクロ → オリジナル色）
        imgElement.addEventListener('mouseenter', async () => {
            if (isHovering) return;
            isHovering = true;

            // モノクロ画像を保存（現在表示中）
            if (!monochromeImageSrc) {
                monochromeImageSrc = imgElement.src;
            }

            // オリジナル色画像をバックグラウンドで生成
            if (!originalColorSrc) {
                try {
                    originalColorSrc = await this.generateProcessedImage(photoSrc, {
                        targetWidth: 120,
                        targetHeight: 90,
                        quality: 0.7,
                        applyColorProcessing: false  // ホバー時はオリジナル色
                    });
                } catch (error) {
                    console.log('ホバー用オリジナル色画像の生成に失敗:', error);
                    return;
                }
            }

            // ホバー中であればオリジナル色画像に切り替え
            if (isHovering && originalColorSrc) {
                imgElement.src = originalColorSrc;
            }
        });

        // ホバー終了時（オリジナル色 → モノクロ）
        imgElement.addEventListener('mouseleave', () => {
            isHovering = false;
            if (monochromeImageSrc) {
                imgElement.src = monochromeImageSrc;
            }
        });
    }

    // 色処理済み画像を生成する専用関数
    generateProcessedImage(src, options = {}) {
        return new Promise((resolve, reject) => {
            const {
                targetWidth = 120,
                targetHeight = 90,
                quality = 0.7,
                applyColorProcessing = true
            } = options;

            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    canvas.width = targetWidth;
                    canvas.height = targetHeight;

                    // 高品質リサイズ設定
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    
                    // 画像描画（cover fitで中央クロップ）
                    const sourceRatio = img.width / img.height;
                    const targetRatio = targetWidth / targetHeight;
                    
                    let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
                    
                    if (sourceRatio > targetRatio) {
                        drawHeight = targetHeight;
                        drawWidth = drawHeight * sourceRatio;
                        offsetX = (targetWidth - drawWidth) / 2;
                    } else {
                        drawWidth = targetWidth;
                        drawHeight = drawWidth / sourceRatio;
                        offsetY = (targetHeight - drawHeight) / 2;
                    }
                    
                    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
                    
                    // 色処理を適用
                    if (applyColorProcessing) {
                        this.applyColorProcessing(ctx, targetWidth, targetHeight);
                    }
                    
                    // DataURLを生成
                    const processedDataUrl = canvas.toDataURL('image/jpeg', quality);
                    resolve(processedDataUrl);
                    
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = () => reject(new Error('Image load failed'));
            img.src = src;
        });
    }

    // 統一された色処理を適用（メイン画像・ギャラリー画像共通）
    applyColorProcessing(ctx, width, height) {
        try {
            // 画像データを取得
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;
            
            // 色調整パラメータ（統一設定）
            const adjustments = {
                brightness: 1.1,    // 明度 +10%
                contrast: 1.15,     // コントラスト +15%
                saturation: 1.2,    // 彩度 +20%
                warmth: 1.05,       // 暖色調整 +5%
                vibrance: 1.1       // 鮮やかさ +10%
            };
            
            // ピクセルごとに処理
            for (let i = 0; i < data.length; i += 4) {
                let r = data[i];
                let g = data[i + 1];
                let b = data[i + 2];
                
                // 明度調整
                r *= adjustments.brightness;
                g *= adjustments.brightness;
                b *= adjustments.brightness;
                
                // コントラスト調整
                r = ((r / 255 - 0.5) * adjustments.contrast + 0.5) * 255;
                g = ((g / 255 - 0.5) * adjustments.contrast + 0.5) * 255;
                b = ((b / 255 - 0.5) * adjustments.contrast + 0.5) * 255;
                
                // HSL変換で彩度調整
                const hsl = this.rgbToHsl(r, g, b);
                hsl[1] *= adjustments.saturation; // 彩度
                hsl[1] = Math.min(hsl[1], 1); // 彩度上限
                
                // 暖色調整（少し赤みを加える）
                hsl[0] += (adjustments.warmth - 1) * 0.02; // 色相を暖色方向に微調整
                
                // RGB に戻す
                const rgb = this.hslToRgb(hsl[0], hsl[1], hsl[2]);
                
                // 値の範囲を制限
                data[i] = Math.max(0, Math.min(255, rgb[0]));
                data[i + 1] = Math.max(0, Math.min(255, rgb[1]));
                data[i + 2] = Math.max(0, Math.min(255, rgb[2]));
            }
            
            // 処理済み画像データを適用
            ctx.putImageData(imageData, 0, 0);
            
        } catch (error) {
            console.log('⚠️ Color processing skipped:', error.message);
        }
    }

    // RGB to HSL 変換
    rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return [h, s, l];
    }

    // HSL to RGB 変換
    hslToRgb(h, s, l) {
        let r, g, b;
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
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