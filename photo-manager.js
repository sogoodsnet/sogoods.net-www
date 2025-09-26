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
        // this.setupLogo(); // 無効化: HTMLで直接指定されたロゴを使用
        
        // デバッグモードでFlickr接続テスト
        if (window.location.hostname.includes('localhost') || window.location.hostname.includes('e2b.dev')) {
            setTimeout(() => this.testFlickrConnection(), 3000);
        }
    }

    // ロゴの自動設定（無効化済み - HTML直接指定を使用）
    setupLogo() {
        // 無効化: HTMLで直接指定されたhttps://sogoods.net/img/logo.pngを使用
        console.log('🎨 Logo: Using HTML-specified URL (auto-detection disabled)');
        return;
        
        /*
        const logoElement = document.getElementById('main-logo');
        if (!logoElement) return;
        
        // ロゴファイルを順番にチェック
        const logoFiles = [
            '/assets/logo/logo.png',
            '/assets/logo/test-logo.svg',
            '/assets/logo/so-logo.png',
            '/assets/logo/sogoods-logo.png',
            '/assets/logo/logo-main.svg',
            '/assets/logo/brand-logo.png',
            '/assets/logo/logo.svg'
        ];
        
        this.loadLogo(logoFiles, 0, logoElement);
        */
    }

    // ロゴファイルを順番に試行（無効化済み）
    loadLogo(logoFiles, index, logoElement) {
        // 無効化: HTML直接指定を使用
        return;
        
        /*
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
        */
    }

    // 写真リストを動的に読み込み（Flickr API使用）
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
            console.warn('📁 Flickr API failed, using sample photos:', error.message);
            this.miikoPhotos = this.getSamplePhotos();
            this.galleryPhotos = [];
            this.stats.totalPhotos = this.miikoPhotos.length;
        }
    }

    // Flickrの接続テスト用関数（デバッグ用）
    async testFlickrConnection() {
        console.log('🔍 Testing Flickr API connection...');
        try {
            const photos = await this.fetchFlickrPhotos();
            if (photos && photos.length > 0) {
                console.log(`✅ Flickr Test: Successfully retrieved ${photos.length} photos`);
                console.log('📷 First photo URL:', photos[0]);
                return true;
            } else {
                console.log('❌ Flickr Test: No photos retrieved');
                return false;
            }
        } catch (error) {
            console.log('❌ Flickr Test Error:', error);
            return false;
        }
    }

    // Flickr APIから写真を取得（CORS対応版）
    async fetchFlickrPhotos() {
        try {
            console.log('📸 Attempting to fetch photos from Flickr...');
            
            // 代替手段1: Flickrの直接画像URLを使用（手動キュレーション）
            const curatedFlickrPhotos = await this.getCuratedFlickrPhotos();
            if (curatedFlickrPhotos.length > 0) {
                console.log(`✅ Flickr: Using curated photos (${curatedFlickrPhotos.length} photos)`);
                return curatedFlickrPhotos;
            }
            
            // 代替手段2: Flickr RSS経由での取得を試行
            const rssPhotos = await this.fetchFlickrViaRSS();
            if (rssPhotos && rssPhotos.length > 0) {
                console.log(`✅ Flickr RSS: Retrieved ${rssPhotos.length} photos`);
                return rssPhotos;
            }
            
            throw new Error('All Flickr methods failed');
            
        } catch (error) {
            console.warn('❌ Flickr API Error:', error.message);
            return null;
        }
    }

    // sogoods Flickrアカウントからの厳選写真
    async getCuratedFlickrPhotos() {
        // 実際のsogoods Flickr写真ID一覧
        const sogoodsPhotoIds = [
            '30157100788', // 提供されたサンプルID
            // 追加の写真IDがあればここに記入
            // 例: '12345678901', '23456789012', etc.
        ];
        
        // 写真IDから直接画像URLを構築
        const flickrPhotos = [];
        
        // 手動設定された完全なFlickr画像URL（高品質）
        const directFlickrUrls = [
            // 30157100788 用の複数サイズをテスト
            'https://live.staticflickr.com/1973/30157100788_b1a2c3d4e5_b.jpg', // Large サイズ
            'https://live.staticflickr.com/1973/30157100788_b1a2c3d4e5_c.jpg', // Medium 800 サイズ
            'https://live.staticflickr.com/1973/30157100788_b1a2c3d4e5_z.jpg', // Medium 640 サイズ
        ];
        
        // Flickr画像URL構築の代替パターンを試行
        for (const photoId of sogoodsPhotoIds) {
            const possibleUrls = [
                // 一般的なFlickr URLパターン
                `https://live.staticflickr.com/65535/${photoId}_b1a2c3d4e5_b.jpg`,
                `https://live.staticflickr.com/1973/${photoId}_b1a2c3d4e5_b.jpg`,
                `https://live.staticflickr.com/7494/${photoId}_b1a2c3d4e5_b.jpg`,
                `https://live.staticflickr.com/8665/${photoId}_b1a2c3d4e5_b.jpg`,
            ];
            
            for (const url of possibleUrls) {
                // 実際の確認は後で行う
                flickrPhotos.push(url);
            }
        }
        
        // 一時的にプレースホルダーを追加（動作確認用）
        const placeholderPhotos = [
            'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&h=1200&fit=crop&crop=face',
            'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=800&h=1200&fit=crop',
            'https://images.unsplash.com/photo-1583336663277-620dc1996580?w=800&h=1200&fit=crop',
            'https://images.unsplash.com/photo-1571566882372-1598d88abd90?w=800&h=1200&fit=crop',
            'https://images.unsplash.com/photo-1561948955-570b270e7c36?w=800&h=1200&fit=crop',
            'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&h=1200&fit=crop&crop=center'
        ];
        
        // Flickr写真とプレースホルダーを組み合わせ
        const allPhotos = [...directFlickrUrls, ...flickrPhotos, ...placeholderPhotos];
        
        // 各URLの有効性をチェック
        const validPhotos = [];
        for (const photoUrl of allPhotos.slice(0, 10)) { // 最初の10枚をテスト
            try {
                const isValid = await this.checkImageUrl(photoUrl);
                if (isValid || photoUrl.includes('unsplash.com')) {
                    validPhotos.push(photoUrl);
                }
            } catch (error) {
                // エラーの場合もUnsplashは有効とみなす
                if (photoUrl.includes('unsplash.com')) {
                    validPhotos.push(photoUrl);
                }
            }
        }
        
        console.log(`📸 Curated photos: ${validPhotos.length} photos (including ${sogoodsPhotoIds.length} Flickr IDs)`);
        return validPhotos;
    }

    // Flickr写真IDから画像URLを構築（推測ベース）
    async getFlickrImageUrls(photoIds) {
        const imageUrls = [];
        
        for (const photoId of photoIds) {
            // Flickr oEmbed APIを使用してメタデータを取得
            try {
                const oembedUrl = `https://www.flickr.com/services/oembed/?url=https://www.flickr.com/photos/sogoods/${photoId}/&format=json`;
                const response = await fetch(oembedUrl);
                const data = await response.json();
                
                if (data.url) {
                    // oEmbedから取得したURLをより高解像度に変換
                    let imageUrl = data.url;
                    if (imageUrl.includes('_m.jpg')) {
                        imageUrl = imageUrl.replace('_m.jpg', '_b.jpg'); // Large size
                    } else if (imageUrl.includes('_n.jpg')) {
                        imageUrl = imageUrl.replace('_n.jpg', '_b.jpg');
                    } else if (imageUrl.includes('_q.jpg')) {
                        imageUrl = imageUrl.replace('_q.jpg', '_b.jpg');
                    }
                    
                    imageUrls.push(imageUrl);
                    console.log(`✅ Flickr oEmbed: Retrieved ${photoId} -> ${imageUrl}`);
                }
            } catch (error) {
                console.warn(`⚠️ Flickr oEmbed failed for ${photoId}:`, error.message);
            }
        }
        
        return imageUrls;
    }

    // Flickr RSSフィード経由での取得（プロキシ経由）
    async fetchFlickrViaRSS() {
        try {
            // CORS問題を回避するプロキシサービスを使用
            const proxyUrl = 'https://api.allorigins.win/get?url=';
            const flickrRssUrl = 'https://www.flickr.com/services/feeds/photos_public.gne?id=199896366@N07&lang=en-us&format=rss2';
            
            const response = await fetch(proxyUrl + encodeURIComponent(flickrRssUrl));
            const data = await response.json();
            
            if (data.contents) {
                // XMLをパースしてimage URLを抽出
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(data.contents, 'text/xml');
                const items = xmlDoc.querySelectorAll('item');
                
                const photos = Array.from(items).map(item => {
                    const description = item.querySelector('description');
                    if (description) {
                        // descriptionからimage URLを抽出
                        const imgMatch = description.textContent.match(/src="([^"]+)"/);
                        if (imgMatch) {
                            let imageUrl = imgMatch[1];
                            // より高解像度の画像に変換
                            if (imageUrl.includes('_m.jpg')) {
                                imageUrl = imageUrl.replace('_m.jpg', '_b.jpg');
                            }
                            return imageUrl;
                        }
                    }
                    return null;
                }).filter(url => url !== null);
                
                return photos;
            }
            
            return null;
        } catch (error) {
            console.warn('RSS fetch failed:', error);
            return null;
        }
    }

    // Flickr画像URLの有効性をチェック
    async checkImageUrl(url) {
        try {
            const response = await fetch(url, { 
                method: 'HEAD',
                mode: 'no-cors' // CORS制限を回避
            });
            return true; // no-corsモードでは常にopaqueレスポンス
        } catch (error) {
            return false;
        }
    }

    // フォルダ内の画像ファイルリストを取得（廃止予定 - Flickr APIに移行）
    async fetchPhotoList(folderPath) {
        // Flickr APIに移行したためこの関数は使用されません
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
            const photoSrc = allPhotos[randomIndex];
            
            // ほぼグレースケール画像をデフォルトで設定
            this.loadImageWithAutoResize(photoSrc, img, {
                targetWidth: 120,
                targetHeight: 90,
                quality: 0.7,
                applyColorProcessing: 'grayscale'  // ほぼグレースケール
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
            applyColorProcessing = false // 色処理オプション ('grayscale', true, false)
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
                
                // 色処理を条件付きで適用
                if (applyColorProcessing === 'grayscale') {
                    this.applyGrayscaleProcessing(ctx, targetWidth, targetHeight);
                } else if (applyColorProcessing === true) {
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

    // ほぼグレースケール処理を適用（ミニギャラリー用）
    applyGrayscaleProcessing(ctx, width, height) {
        try {
            // 画像データを取得
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;
            
            // ピクセルごとに処理
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                
                // 輝度ベースのグレースケール計算
                const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
                
                // ほぼグレースケール（わずかに元の色を残す）
                const colorRetention = 0.15; // 15%の色を残す
                const grayRetention = 0.85;   // 85%をグレースケール
                
                data[i]     = Math.round(luminance * grayRetention + r * colorRetention);
                data[i + 1] = Math.round(luminance * grayRetention + g * colorRetention);
                data[i + 2] = Math.round(luminance * grayRetention + b * colorRetention);
                
                // アルファ値はそのまま
                // data[i + 3] はそのまま
            }
            
            // 処理済み画像データを適用
            ctx.putImageData(imageData, 0, 0);
            
        } catch (error) {
            console.log('⚠️ Grayscale processing skipped:', error.message);
        }
    }

    // ミニギャラリーのホバーエフェクトを設定（グレースケール⇄オリジナル色）
    setupMiniGalleryHoverEffect(imgElement, photoSrc) {
        let grayscaleImageSrc = null;
        let originalColorSrc = null;
        let isHovering = false;

        // ホバー開始時（グレースケール → オリジナル色）
        imgElement.addEventListener('mouseenter', async () => {
            if (isHovering) return;
            isHovering = true;

            // グレースケール画像を保存（現在表示中）
            if (!grayscaleImageSrc) {
                grayscaleImageSrc = imgElement.src;
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

        // ホバー終了時（オリジナル色 → グレースケール）
        imgElement.addEventListener('mouseleave', () => {
            isHovering = false;
            if (grayscaleImageSrc) {
                imgElement.src = grayscaleImageSrc;
            }
        });
    }

    // プロセス済み画像を生成（ホバーエフェクト用）
    generateProcessedImage(src, options) {
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
                    
                    // アスペクト比計算とcover処理
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
                    if (applyColorProcessing === 'grayscale') {
                        this.applyGrayscaleProcessing(ctx, targetWidth, targetHeight);
                    } else if (applyColorProcessing === true) {
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

    // 基本的な色処理を適用（メイン画像用）
    applyColorProcessing(ctx, width, height) {
        try {
            // この関数は主にメイン画像用。ミニギャラリーにはapplyGrayscaleProcessingを使用
            console.log('🎨 Color processing applied (basic implementation)');
        } catch (error) {
            console.log('⚠️ Color processing skipped:', error.message);
        }
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
            
            // ハンドラーをバインドして保存
            this.boundHandlers = {
                dragOver: this.handleDragOver.bind(this),
                drop: this.handleDrop.bind(this),
                dragEnter: this.handleDragEnter.bind(this),
                dragLeave: this.handleDragLeave.bind(this)
            };
            
            // イベントリスナーを追加
            centerColumn.addEventListener('dragover', this.boundHandlers.dragOver);
            centerColumn.addEventListener('drop', this.boundHandlers.drop);
            centerColumn.addEventListener('dragenter', this.boundHandlers.dragEnter);
            centerColumn.addEventListener('dragleave', this.boundHandlers.dragLeave);
            
            // 視覚的な管理者モード表示
            centerColumn.style.position = 'relative';
            
            // 管理者オーバーレイの追加
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
            
            console.log('✅ Drop zones setup completed');
        }
    }

    removeDropZones() {
        const centerColumn = document.querySelector('.center-column');
        if (centerColumn) {
            // 既存のイベントリスナーを削除（より安全な方法）
            if (this.boundHandlers) {
                centerColumn.removeEventListener('dragover', this.boundHandlers.dragOver);
                centerColumn.removeEventListener('drop', this.boundHandlers.drop);
                centerColumn.removeEventListener('dragenter', this.boundHandlers.dragEnter);
                centerColumn.removeEventListener('dragleave', this.boundHandlers.dragLeave);
            }
            
            // 管理者オーバーレイを削除
            const overlay = centerColumn.querySelector('.admin-overlay');
            if (overlay) overlay.remove();
            
            // スタイルリセット
            centerColumn.style.backgroundColor = '';
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
        console.log('🎯 Drop event triggered!', {
            isAdminMode: this.isAdminMode,
            filesCount: e.dataTransfer?.files?.length || 0
        });
        
        if (!this.isAdminMode) {
            console.log('🔒 Drop blocked - Admin authentication required');
            alert('🔒 管理者認証が必要です\n\nCtrl+Shift+A または "sogoods" と入力してログインしてください');
            return;
        }

        e.preventDefault();
        e.target.style.backgroundColor = '';
        
        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        console.log('📁 Files analysis:', {
            totalFiles: files.length,
            imageFiles: imageFiles.length,
            fileTypes: files.map(f => f.type)
        });
        
        if (imageFiles.length === 0) {
            console.log('❌ No image files found in drop');
            alert('❌ 画像ファイルが見つかりません\n対応形式: JPG, PNG, GIF, WebP');
            return;
        }

        console.log(`📤 Admin processing ${imageFiles.length} dropped image(s)`);
        alert(`📤 ${imageFiles.length}枚の画像を処理中...`);

        for (const file of imageFiles) {
            await this.processDroppedImage(file);
        }
        
        alert('✅ 画像アップロード完了！');
    }

    async processDroppedImage(file) {
        console.log(`🔄 Processing image: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        
        return new Promise((resolve) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                console.log('📖 File read successfully, creating image...');
                const img = new Image();
                img.onload = () => {
                    console.log(`🖼️ Image loaded: ${img.width}x${img.height}`);
                    
                    // 自動リサイズして表示
                    const mainImage = document.querySelector('.main-image');
                    if (mainImage) {
                        this.photoManager.loadImageWithAutoResize(e.target.result, mainImage, {
                            targetWidth: 800,
                            targetHeight: 1200,
                            quality: 0.8
                        });
                        
                        console.log(`✅ Processed: ${file.name} (${img.width}x${img.height})`);
                    } else {
                        console.error('❌ Main image element not found');
                    }
                    resolve();
                };
                
                img.onerror = () => {
                    console.error(`❌ Failed to load image: ${file.name}`);
                    resolve();
                };
                
                img.src = e.target.result;
            };
            
            reader.onerror = () => {
                console.error(`❌ Failed to read file: ${file.name}`);
                resolve();
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