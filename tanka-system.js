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

        // エモーショナルな解説を生成
        const commentary = this.generateEmotionalCommentary(tankaData.text);

        const popup = document.createElement('div');
        popup.className = 'tanka-popup';
        popup.innerHTML = `
            <div class="tanka-popup-content">
                <div class="tanka-close-btn" onclick="this.closest('.tanka-popup').remove()">×</div>
                <div class="tanka-vertical-text">${this.createVerticalText(tankaData.text)}</div>
                <div class="tanka-commentary">
                    ${commentary}
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

        console.log(`📝 Displaying tanka with commentary: "${tankaData.text.substring(0, 20)}..."`);
    }

    // 木下龍也・俵万智スタイルのエモーショナルな解説を生成
    generateEmotionalCommentary(tankaText) {
        // 短歌の内容を分析してテーマを抽出
        const themes = this.analyzeTankaThemes(tankaText);
        
        // 現代的でエモーショナルな解説パターン
        const commentaryStyles = [
            // 木下龍也スタイル - SNS世代の感覚
            {
                pattern: /笑|わら|ふしぎ/,
                style: "この瞬間の「？？？」感。理由なんてわからないけど、そこに確かにある幸せ。SNSで「いいね」を押す指先みたいに、心が勝手に反応してしまう。"
            },
            {
                pattern: /かみさま|お参り|気持ち/,
                style: "神様に向かう気持ちって、きっと「とりあえず」みたいなところがあって。でもその「とりあえず」の中に、人間の純粋さが宿っている。"
            },
            {
                pattern: /さむしい|子|髪|なで/,
                style: "「さむしい」って方言が、距離を縮めてくれる。髪をなでる手のひらに込められた「わかってる」という気持ち。言葉にしなくても伝わるもの。"
            },
            {
                pattern: /生きる|信じる|やめない/,
                style: "「生きるとは信じること」という言葉の重さ。でも重すぎないように、そっと手を差し伸べる。信じることをやめないでいられる世界を願う。"
            },
            {
                pattern: /芽|花|育て/,
                style: "もやもやにも花が咲く可能性。今はぼんやりしていても、きっと何かになる。その「かもしれない」を大切に見守る眼差し。"
            },
            {
                pattern: /器用|叫べない|あなた|ほしい/,
                style: "大人になると叫べなくなる。でも心の奥で「あなたがほしい」と言い続けている自分がいる。器用さという檻の中での静かな叫び。"
            },
            {
                pattern: /夢|楽し|行き先/,
                style: "夢って目的地じゃなくて、歩いている時間そのものなのかも。ゆるく楽しんでいるうちに、気づいたら違う場所にいる。"
            },
            {
                pattern: /厳しい|冬|春|ほしい/,
                style: "一番厳しい冬を経験した人だからこそ、春への渇望が深い。「君と春がほしい」という願いに、すべてが込められている。"
            },
            {
                pattern: /窓|水路|雨/,
                style: "窓についた水滴を追いかける視線。そこに人生の行方を重ねてしまう。雨に任せる、という諦めと信頼。"
            },
            {
                pattern: /四苦八苦|目覚め|生きる/,
                style: "朝の目覚めが幻想的に感じる瞬間。日常の中に非日常が混じり込む。「どう生きるか」という問いは、毎朝新しく立ち上がる。"
            }
        ];

        // 俵万智スタイル - 日常の中の詩的発見
        const tawaraStyles = [
            {
                pattern: /思い出|記憶|覚え/,
                style: "記憶って不思議。痛かったことも美しく変わっていく。時間が、私たちの心にそっと魔法をかけてくれる。"
            },
            {
                pattern: /恋|愛|好き/,
                style: "恋をしている時の世界の見え方。いつもの景色が、まるで初めて見るもののように輝いて見える。"
            },
            {
                pattern: /日常|毎日|普通/,
                style: "何でもない日々の中に、実は宝物が隠れている。後から振り返った時、「あの時間が一番幸せだった」と気づく。"
            },
            {
                pattern: /自然|風|空|雲/,
                style: "自然が見せてくれる一瞬の表情。それを心に留めておきたくて、言葉にしてみる。言葉にした瞬間、それは永遠になる。"
            }
        ];

        // 全パターンを統合
        const allStyles = [...commentaryStyles, ...tawaraStyles];

        // 短歌にマッチするスタイルを検索
        for (let style of allStyles) {
            if (style.pattern.test(tankaText)) {
                return style.style;
            }
        }

        // デフォルトの現代的解説
        return this.generateDefaultCommentary(tankaText, themes);
    }

    // 短歌のテーマ分析
    analyzeTankaThemes(text) {
        const themes = [];
        
        // 感情テーマ
        if (/嬉し|楽し|幸せ|笑/.test(text)) themes.push('joy');
        if (/悲し|泣|涙|辛/.test(text)) themes.push('sadness');
        if (/恋|愛|好き|恋人/.test(text)) themes.push('love');
        if (/不安|心配|怖/.test(text)) themes.push('anxiety');
        if (/怒|腹立/.test(text)) themes.push('anger');
        
        // 自然テーマ
        if (/春|桜|花/.test(text)) themes.push('spring');
        if (/夏|暑|海/.test(text)) themes.push('summer');
        if (/秋|紅葉|風/.test(text)) themes.push('autumn');
        if (/冬|雪|寒/.test(text)) themes.push('winter');
        if (/雨|雲|空/.test(text)) themes.push('weather');
        
        // 人間関係テーマ
        if (/家族|母|父|子/.test(text)) themes.push('family');
        if (/友|仲間/.test(text)) themes.push('friendship');
        if (/一人|独り|孤独/.test(text)) themes.push('solitude');
        
        // 時間テーマ
        if (/過去|昔|思い出/.test(text)) themes.push('past');
        if (/未来|明日|希望/.test(text)) themes.push('future');
        if (/今|瞬間|現在/.test(text)) themes.push('present');
        
        return themes;
    }

    // デフォルト解説生成
    generateDefaultCommentary(text, themes) {
        const defaultCommentaries = [
            "この短歌に込められた感情が、読む人の心にそっと寄り添う。言葉の向こう側にある、作者の優しい眼差しを感じる。",
            "日常の中にある小さな発見。それを短歌という形に込めることで、誰かの心に届く贈り物になる。",
            "短い言葉の中に、長い時間をかけて育まれた気持ちが詰まっている。読むたびに違う味わいを感じられる。",
            "この歌を読んでいると、自分も同じような経験をしたことがあるような気がしてくる。共感という名前の橋が、心と心を繋いでくれる。",
            "作者の心の動きが、そのまま読み手の心に響いてくる。短歌の持つ力を、改めて感じさせてくれる一首。",
            "言葉と言葉の間にある「余白」に、読み手の想像が広がっていく。そこに短歌の魅力がある。",
            "この瞬間の気持ちを、未来の自分や誰かに伝えたくて生まれた歌。時間を超えて響き続ける。"
        ];

        // テーマに基づいた補完
        let themeAddition = "";
        if (themes.includes('love')) {
            themeAddition = "恋する気持ちの繊細さが、言葉の選び方からも伝わってくる。";
        } else if (themes.includes('solitude')) {
            themeAddition = "一人の時間の中で見つけた、かけがえのない発見。";
        } else if (themes.includes('nature')) {
            themeAddition = "自然が見せてくれる表情と、心の動きが重なり合う。";
        } else if (themes.includes('family')) {
            themeAddition = "家族への想いが、優しい言葉となって現れている。";
        }

        const baseCommentary = defaultCommentaries[Math.floor(Math.random() * defaultCommentaries.length)];
        return themeAddition ? `${themeAddition}${baseCommentary}` : baseCommentary;
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