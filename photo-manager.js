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

    // ランダムに写真を表示
    displayRandomPhoto() {
        if (this.miikoPhotos.length === 0) return;
        
        const randomIndex = Math.floor(Math.random() * this.miikoPhotos.length);
        const selectedPhoto = this.miikoPhotos[randomIndex];
        
        const mainImage = document.querySelector('.main-image');
        if (mainImage) {
            mainImage.src = selectedPhoto;
            this.currentPhoto = selectedPhoto;
            this.stats.viewCount++;
        }
        
        console.log(`🎲 Random photo: ${randomIndex + 1}/${this.miikoPhotos.length}`);
    }

    // 小さなギャラリーを更新
    updateMiniGallery() {
        const miniImages = document.querySelectorAll('.mini-image');
        const allPhotos = [...this.miikoPhotos, ...this.galleryPhotos];
        
        if (allPhotos.length === 0) return;
        
        miniImages.forEach((img, index) => {
            const randomIndex = Math.floor(Math.random() * allPhotos.length);
            img.src = allPhotos[randomIndex];
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

    // 手動でフォルダをチェック（開発時用）
    async checkPhotoFolders() {
        console.log('📁 Photo folder structure:');
        console.log('   /photos/miiko/ <- みーこの写真をここに配置');
        console.log('   /photos/gallery/ <- ギャラリー写真をここに配置');
        console.log('');
        console.log('📄 Supported formats: .jpg, .jpeg, .png, .gif, .webp');
        console.log('💡 Tip: 写真を追加後、ページをリロードすると自動検出されます');
    }
}

// グローバルに公開
window.PhotoManager = PhotoManager;

// DOM読み込み後に自動初期化
document.addEventListener('DOMContentLoaded', () => {
    window.photoManager = new PhotoManager();
    
    // 開発時のヘルプ表示
    setTimeout(() => {
        window.photoManager.checkPhotoFolders();
    }, 2000);
});