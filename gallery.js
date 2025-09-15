/**
 * 写真ギャラリー機能
 * マウスオーバーアニメーション + クリックでモーダル表示
 */

class PhotoGallery {
    constructor() {
        this.currentIndex = 0;
        this.photos = [
            {
                id: 1,
                src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop',
                thumb: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
                title: '山の朝霧',
                description: '早朝の山間に立ち込める霧が幻想的な風景を作り出しています。',
                date: '2025.09.15',
                location: '山梨県・富士五湖'
            },
            {
                id: 2,
                src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=800&fit=crop',
                thumb: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
                title: '森の小径',
                description: '木漏れ日が美しい森の小径。自然の静寂に包まれた瞬間です。',
                date: '2025.09.10',
                location: '長野県・軽井沢'
            },
            {
                id: 3,
                src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&h=800&fit=crop',
                thumb: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop',
                title: '湖面の反射',
                description: '穏やかな湖面に映る雲と空。完璧なシンメトリーが印象的でした。',
                date: '2025.09.05',
                location: '北海道・洞爺湖'
            },
            {
                id: 4,
                src: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=1200&h=800&fit=crop',
                thumb: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=400&h=300&fit=crop',
                title: '夕日の丘',
                description: '黄昏時の丘陵地帯。暖かな光に包まれた一日の終わりです。',
                date: '2025.08.28',
                location: '奈良県・生駒山'
            },
            {
                id: 5,
                src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop',
                thumb: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
                title: '都市の夜景',
                description: '街の灯りが作り出す光のアート。夜の都市の美しさを表現しました。',
                date: '2025.08.20',
                location: '東京都・六本木'
            },
            {
                id: 6,
                src: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=800&fit=crop',
                thumb: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
                title: '海岸の朝',
                description: '日の出前の海岸線。静寂に包まれた神聖な時間です。',
                date: '2025.08.15',
                location: '神奈川県・江ノ島'
            }
        ];
        
        this.initializeGallery();
    }

    /**
     * ギャラリーの初期化
     */
    initializeGallery() {
        this.createModalHTML();
        this.bindEvents();
        this.startSlideshow();
    }

    /**
     * モーダル用HTMLを動的生成
     */
    createModalHTML() {
        const modalHTML = `
            <div id="gallery-modal" class="gallery-modal" style="display: none;">
                <div class="gallery-modal-content">
                    <div class="gallery-header">
                        <h2>📸 SoGoods Gallery</h2>
                        <button class="gallery-close" onclick="gallery.closeModal()">&times;</button>
                    </div>
                    
                    <div class="gallery-main">
                        <div class="gallery-image-container">
                            <img id="gallery-main-image" src="" alt="">
                            <div class="gallery-nav">
                                <button class="gallery-prev" onclick="gallery.previousImage()">&#8249;</button>
                                <button class="gallery-next" onclick="gallery.nextImage()">&#8250;</button>
                            </div>
                        </div>
                        
                        <div class="gallery-info">
                            <h3 id="gallery-title"></h3>
                            <p id="gallery-description"></p>
                            <div class="gallery-meta">
                                <span id="gallery-date"></span>
                                <span id="gallery-location"></span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="gallery-thumbnails">
                        <div id="gallery-thumb-container"></div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.addModalStyles();
    }

    /**
     * モーダル用CSSを追加
     */
    addModalStyles() {
        const styles = `
            <style id="gallery-modal-styles">
                .gallery-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.95);
                    z-index: 1000;
                    overflow-y: auto;
                }

                .gallery-modal-content {
                    max-width: 1200px;
                    margin: 2rem auto;
                    background: #fff;
                    border-radius: 15px;
                    overflow: hidden;
                }

                .gallery-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.5rem 2rem;
                    background: #333;
                    color: #fff;
                }

                .gallery-close {
                    background: none;
                    border: none;
                    color: #fff;
                    font-size: 2rem;
                    cursor: pointer;
                    padding: 0;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: background 0.3s ease;
                }

                .gallery-close:hover {
                    background: rgba(255, 255, 255, 0.2);
                }

                .gallery-main {
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    gap: 2rem;
                    padding: 2rem;
                }

                .gallery-image-container {
                    position: relative;
                }

                #gallery-main-image {
                    width: 100%;
                    height: 400px;
                    object-fit: cover;
                    border-radius: 10px;
                }

                .gallery-nav {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 100%;
                    display: flex;
                    justify-content: space-between;
                    padding: 0 1rem;
                }

                .gallery-prev, .gallery-next {
                    background: rgba(0, 0, 0, 0.7);
                    color: #fff;
                    border: none;
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    font-size: 1.5rem;
                    cursor: pointer;
                    transition: background 0.3s ease;
                }

                .gallery-prev:hover, .gallery-next:hover {
                    background: rgba(33, 150, 243, 0.8);
                }

                .gallery-info {
                    padding: 1rem;
                }

                #gallery-title {
                    font-size: 1.5rem;
                    margin-bottom: 1rem;
                    color: #333;
                }

                #gallery-description {
                    color: #666;
                    line-height: 1.6;
                    margin-bottom: 1.5rem;
                }

                .gallery-meta {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    font-size: 0.9rem;
                    color: #888;
                }

                .gallery-thumbnails {
                    padding: 1.5rem 2rem 2rem;
                    background: #f9f9f9;
                }

                #gallery-thumb-container {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
                    gap: 1rem;
                }

                .gallery-thumbnail {
                    width: 100%;
                    height: 80px;
                    object-fit: cover;
                    border-radius: 5px;
                    cursor: pointer;
                    transition: transform 0.2s ease, opacity 0.2s ease;
                    opacity: 0.7;
                }

                .gallery-thumbnail:hover {
                    transform: scale(1.05);
                    opacity: 1;
                }

                .gallery-thumbnail.active {
                    opacity: 1;
                    border: 3px solid #2196F3;
                }

                @media (max-width: 768px) {
                    .gallery-modal-content {
                        margin: 1rem;
                        border-radius: 10px;
                    }

                    .gallery-main {
                        grid-template-columns: 1fr;
                        padding: 1rem;
                    }

                    #gallery-main-image {
                        height: 250px;
                    }

                    .gallery-header {
                        padding: 1rem;
                    }

                    #gallery-thumb-container {
                        grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
                    }
                }
            </style>
        `;

        document.head.insertAdjacentHTML('beforeend', styles);
    }

    /**
     * イベントリスナーをバインド
     */
    bindEvents() {
        // ESCキーでモーダルを閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isModalOpen()) {
                this.closeModal();
            }
        });

        // 左右矢印キーで画像切り替え
        document.addEventListener('keydown', (e) => {
            if (this.isModalOpen()) {
                if (e.key === 'ArrowLeft') {
                    this.previousImage();
                } else if (e.key === 'ArrowRight') {
                    this.nextImage();
                }
            }
        });
    }

    /**
     * メイン画像のスライドショーを開始
     */
    startSlideshow() {
        let currentIndex = 0;
        const mainPhoto = document.querySelector('.main-photo');
        
        if (mainPhoto) {
            setInterval(() => {
                currentIndex = (currentIndex + 1) % this.photos.length;
                mainPhoto.src = this.photos[currentIndex].src;
            }, 5000); // 5秒ごとに切り替え
        }
    }

    /**
     * ギャラリーモーダルを開く
     */
    openModal(index = 0) {
        const modal = document.getElementById('gallery-modal');
        if (modal) {
            this.currentIndex = index;
            this.updateModalContent();
            this.renderThumbnails();
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * ギャラリーモーダルを閉じる
     */
    closeModal() {
        const modal = document.getElementById('gallery-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    /**
     * モーダルが開いているかチェック
     */
    isModalOpen() {
        const modal = document.getElementById('gallery-modal');
        return modal && modal.style.display !== 'none';
    }

    /**
     * 前の画像に切り替え
     */
    previousImage() {
        this.currentIndex = (this.currentIndex - 1 + this.photos.length) % this.photos.length;
        this.updateModalContent();
    }

    /**
     * 次の画像に切り替え
     */
    nextImage() {
        this.currentIndex = (this.currentIndex + 1) % this.photos.length;
        this.updateModalContent();
    }

    /**
     * 指定されたインデックスの画像に切り替え
     */
    goToImage(index) {
        this.currentIndex = index;
        this.updateModalContent();
    }

    /**
     * モーダルの内容を更新
     */
    updateModalContent() {
        const photo = this.photos[this.currentIndex];
        if (!photo) return;

        document.getElementById('gallery-main-image').src = photo.src;
        document.getElementById('gallery-title').textContent = photo.title;
        document.getElementById('gallery-description').textContent = photo.description;
        document.getElementById('gallery-date').textContent = `📅 ${photo.date}`;
        document.getElementById('gallery-location').textContent = `📍 ${photo.location}`;

        this.updateThumbnailActive();
    }

    /**
     * サムネイルを表示
     */
    renderThumbnails() {
        const container = document.getElementById('gallery-thumb-container');
        if (!container) return;

        container.innerHTML = this.photos.map((photo, index) => `
            <img src="${photo.thumb}" 
                 alt="${photo.title}" 
                 class="gallery-thumbnail" 
                 onclick="gallery.goToImage(${index})">
        `).join('');

        this.updateThumbnailActive();
    }

    /**
     * アクティブなサムネイルを更新
     */
    updateThumbnailActive() {
        const thumbnails = document.querySelectorAll('.gallery-thumbnail');
        thumbnails.forEach((thumb, index) => {
            thumb.classList.toggle('active', index === this.currentIndex);
        });
    }
}

// グローバルインスタンス
window.gallery = new PhotoGallery();

// openGallery関数をグローバルに定義（HTMLから呼び出せるように）
window.openGallery = () => {
    window.gallery.openModal();
};