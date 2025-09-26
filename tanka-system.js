/**
 * sogoods.net Advanced Tanka System
 * CSV Database Integration + Vertical Display + Voting System
 */

class TankaSystem {
    constructor() {
        this.tankaDatabase = [];
        this.votingResults = new Map(); // tankaId -> {likes: 0, dislikes: 0}
        this.currentTankaIndex = 0;
        this.isInitialized = false;
        
        this.init();
    }

    async init() {
        console.log('📝 Initializing Advanced Tanka System...');
        
        try {
            await this.loadTankaDatabase();
            await this.loadVotingResults();
            this.isInitialized = true;
            console.log(`✅ Tanka system ready with ${this.tankaDatabase.length} poems`);
        } catch (error) {
            console.error('❌ Tanka system initialization failed:', error);
            this.fallbackToStaticTanka();
        }
    }

    // CSV データベースを読み込み
    async loadTankaDatabase() {
        try {
            const response = await fetch('/tankadb.csv');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const csvText = await response.text();
            this.tankaDatabase = this.parseCSV(csvText);
            
            console.log(`📚 Loaded ${this.tankaDatabase.length} tanka from CSV database`);
            console.log('📊 Sample tanka:', this.tankaDatabase.slice(0, 3));
            
        } catch (error) {
            console.error('❌ Failed to load tanka CSV:', error);
            throw error;
        }
    }

    // CSVパーサー
    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        const header = lines[0].split(',');
        const tanka = [];
        
        for (let i = 1; i < lines.length; i++) {
            const columns = this.parseCSVLine(lines[i]);
            if (columns.length >= 3) {
                tanka.push({
                    id: i,
                    text: columns[0].trim(),
                    date: columns[1].trim(),
                    rating: parseInt(columns[2]) || 0,
                    votes: { likes: 0, dislikes: 0 }
                });
            }
        }
        
        return tanka;
    }

    // CSV行パーサー（カンマが短歌内に含まれる場合に対応）
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result;
    }

    // 投票結果を読み込み（サーバーから）
    async loadVotingResults() {
        try {
            const response = await fetch('/api/tanka-votes');
            if (response.ok) {
                const results = await response.json();
                if (results.success) {
                    results.votes.forEach(vote => {
                        this.votingResults.set(vote.tankaId, {
                            likes: vote.likes || 0,
                            dislikes: vote.dislikes || 0
                        });
                    });
                    console.log(`📊 Loaded voting results for ${this.votingResults.size} tanka`);
                }
            }
        } catch (error) {
            console.log('⚠️ No voting results found (will start fresh)');
        }
    }

    // フォールバック用の静的短歌
    fallbackToStaticTanka() {
        console.log('🔄 Using fallback static tanka collection');
        this.tankaDatabase = [
            { id: 1, text: "冬の朝窓辺に座る猫の瞳静寂を映し時が止まる", date: "2024-01-01", rating: 4 },
            { id: 2, text: "桜散り風に舞い踊る花びらよ心に残る春の記憶", date: "2024-01-02", rating: 5 },
            { id: 3, text: "夕暮れに街灯が点く道すがら影が長くて家路急ぐ", date: "2024-01-03", rating: 3 }
        ];
        this.isInitialized = true;
    }

    // ランダムな短歌を取得
    getRandomTanka() {
        if (!this.isInitialized || this.tankaDatabase.length === 0) {
            return null;
        }
        
        const randomIndex = Math.floor(Math.random() * this.tankaDatabase.length);
        this.currentTankaIndex = randomIndex;
        return this.tankaDatabase[randomIndex];
    }

    // 短歌を縦書き形式に変換
    formatForVerticalDisplay(tankaText) {
        // ひらがな・カタカナ・漢字を適切に分割
        return tankaText.split('').join('|');
    }

    // 縦書き短歌ポップアップを表示
    displayVerticalTanka(tankaData, element) {
        // 既存のポップアップを削除
        const existingPopup = document.querySelector('.tanka-popup');
        if (existingPopup) {
            existingPopup.remove();
        }

        const popup = document.createElement('div');
        popup.className = 'tanka-popup';
        popup.innerHTML = `
            <div class="tanka-popup-content">
                <div class="tanka-close-btn" onclick="this.closest('.tanka-popup').remove()">×</div>
                <div class="tanka-vertical-text">${this.createVerticalText(tankaData.text)}</div>
                <div class="tanka-meta">
                    <span class="tanka-date">${tankaData.date}</span>
                    <span class="tanka-rating">評価: ${tankaData.rating}/5</span>
                </div>
                <div class="tanka-voting">
                    <button class="vote-btn like-btn" onclick="window.tankaSystem.voteTanka(${tankaData.id}, 'like', this)">
                        👍 いいね <span class="vote-count">${this.getVotes(tankaData.id).likes}</span>
                    </button>
                    <button class="vote-btn dislike-btn" onclick="window.tankaSystem.voteTanka(${tankaData.id}, 'dislike', this)">
                        👎 う〜ん <span class="vote-count">${this.getVotes(tankaData.id).dislikes}</span>
                    </button>
                </div>
            </div>
            <div class="tanka-popup-overlay" onclick="this.closest('.tanka-popup').remove()"></div>
        `;

        document.body.appendChild(popup);

        // アニメーション
        requestAnimationFrame(() => {
            popup.classList.add('show');
        });

        console.log(`📝 Displaying tanka: "${tankaData.text.substring(0, 20)}..."`);
    }

    // 縦書きテキストを生成
    createVerticalText(text) {
        const characters = text.split('');
        return characters.map(char => `<span class="vertical-char">${char}</span>`).join('');
    }

    // 投票数を取得
    getVotes(tankaId) {
        return this.votingResults.get(tankaId) || { likes: 0, dislikes: 0 };
    }

    // 短歌に投票
    async voteTanka(tankaId, voteType, buttonElement) {
        try {
            console.log(`📊 Voting for tanka ${tankaId}: ${voteType}`);

            const response = await fetch('/api/vote-tanka', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tankaId: tankaId,
                    vote: voteType
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    // ローカル投票結果を更新
                    this.votingResults.set(tankaId, result.votes);
                    
                    // UI を更新
                    this.updateVotingUI(tankaId);
                    
                    // 視覚的フィードバック
                    buttonElement.classList.add('voted');
                    setTimeout(() => {
                        buttonElement.classList.remove('voted');
                    }, 300);

                    console.log(`✅ Vote recorded: ${voteType} for tanka ${tankaId}`);
                } else {
                    throw new Error(result.error);
                }
            } else {
                throw new Error(`Server error: ${response.status}`);
            }

        } catch (error) {
            console.error('❌ Vote failed:', error);
            alert('投票に失敗しました。もう一度お試しください。');
        }
    }

    // 投票UI を更新
    updateVotingUI(tankaId) {
        const popup = document.querySelector('.tanka-popup');
        if (!popup) return;

        const votes = this.getVotes(tankaId);
        const likesCount = popup.querySelector('.like-btn .vote-count');
        const dislikesCount = popup.querySelector('.dislike-btn .vote-count');

        if (likesCount) likesCount.textContent = votes.likes;
        if (dislikesCount) dislikesCount.textContent = votes.dislikes;
    }

    // 統計情報を取得
    getStats() {
        return {
            totalTanka: this.tankaDatabase.length,
            totalVotes: Array.from(this.votingResults.values()).reduce((sum, votes) => sum + votes.likes + votes.dislikes, 0),
            mostLiked: this.getMostLikedTanka(),
            averageRating: this.getAverageRating()
        };
    }

    getMostLikedTanka() {
        let maxLikes = 0;
        let mostLiked = null;

        this.votingResults.forEach((votes, tankaId) => {
            if (votes.likes > maxLikes) {
                maxLikes = votes.likes;
                mostLiked = this.tankaDatabase.find(t => t.id === tankaId);
            }
        });

        return mostLiked;
    }

    getAverageRating() {
        if (this.tankaDatabase.length === 0) return 0;
        const sum = this.tankaDatabase.reduce((total, tanka) => total + tanka.rating, 0);
        return (sum / this.tankaDatabase.length).toFixed(1);
    }
}

// グローバルインスタンス
window.tankaSystem = new TankaSystem();