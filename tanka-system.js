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
        console.log(`🔍 Analyzing tanka: "${tankaText}"`);
        
        // より精密な短歌分析のための詳細パターン
        const precisePatterns = [
            {
                pattern: /たまに.*笑.*ふしぎ.*教え.*いない.*笑/,
                style: "赤ちゃんの「なんで笑うの？」っていう瞬間。まだ言葉を教えてもいないのに、なぜかふっと笑顔を見せる不思議。その純粋な反応に、大人が逆に教えられる。"
            },
            {
                pattern: /かみさま.*ちよ.*やちよ.*わから.*お参り.*きもち/,
                style: "「ちよもやちよも」って古い言葉だけど、神様への気持ちって結局よくわからないまま手を合わせる。そのよくわからなさが、かえって純粋で美しい。"
            },
            {
                pattern: /さむしい.*ふところ.*もぐり.*子.*さむしかった.*髪.*なで/,
                style: "「さむしい」という方言の温かさ。懐にもぐりこむ子に「さむしかったね」と髪をなでる瞬間。言葉と触れ合いで包み込む優しさ。"
            },
            {
                pattern: /とけこま.*拒絶.*きょうかい.*手前.*手.*にぎる/,
                style: "完全に溶け込むわけでもなく、かといって拒絶するわけでもない。境界線の手前で手を握る、そのちょうどいい距離感。人間関係の絶妙なバランス。"
            },
            {
                pattern: /生きる.*信じる.*きみ.*信じる.*やめない/,
                style: "「生きるとは信じること」と言った君が、信じることをやめないように。シンプルだけど深い願い。信じる力を失わずにいてほしいという祈り。"
            },
            {
                pattern: /もやもや.*芽.*花.*さく.*よく.*みて.*育て/,
                style: "今のもやもやも、いつか花になるかもしれない。だから諦めずによく見て育ててほしい。不安や迷いさえも、可能性として受け止める眼差し。"
            },
            {
                pattern: /ひと.*よ.*せい.*だま.*心.*なくし.*あかり.*灯す.*ひ.*くる/,
                style: "人や世の中のせいにして騙す心をなくしても、明かりを灯す日がくる。他人を責める気持ちを手放した時に見えてくる、希望の光。"
            },
            {
                pattern: /器用.*叫べない.*花いちもんめ.*あなた.*ほしい/,
                style: "大人になって器用になったら、素直に叫べなくなった。でも心の奥で「花いちもんめ、あなたがほしい」と子どもの頃のように願い続けている。"
            },
            {
                pattern: /人生.*たのしむ.*おもしろく.*おもう.*あり.*むれ.*つづく/,
                style: "人生を楽しむことも、また面白く思うこと。そんな風に思える仲間が続いていく。楽しさの連鎖、笑顔の循環。"
            },
            {
                pattern: /ひとひら.*よひら.*あいだ.*咲く.*花.*あはれ.*思わ.*人.*つぼみ/,
                style: "一片と余片の間に咲く花。普通の人が「あはれ」と思わない小さなつぼみにも、美しさを見つける感性。見過ごされがちなものへの愛情。"
            }
        ];

        // より一般的なテーマパターン
        const generalPatterns = [
            {
                pattern: /笑.*不思議|ふしぎ.*笑/,
                style: "笑いの不思議さ。なぜその瞬間に笑みがこぼれるのか、理由はわからないけれど確かにある温かさ。"
            },
            {
                pattern: /神.*参り|かみさま.*きもち/,
                style: "神様に向き合う時の、言葉にならない気持ち。理屈じゃない、心の奥底からの素直な思い。"
            },
            {
                pattern: /子.*髪.*なで|さむしい.*子/,
                style: "子どもへの優しさが、髪をなでる手のひらに込められている。言葉以上に伝わる愛情。"
            },
            {
                pattern: /生きる.*信じる/,
                style: "生きることと信じること。この二つは切っても切れない関係。信じる力があるから生きていける。"
            },
            {
                pattern: /芽.*花.*育て/,
                style: "今は小さな芽でも、大切に育てればいつか花を咲かせる。成長への希望と愛情。"
            },
            {
                pattern: /夢.*楽し.*道/,
                style: "夢への道のりを楽しむ心。目的地よりも、歩いている今この時間を大切にする生き方。"
            },
            {
                pattern: /冬.*春.*ほしい/,
                style: "厳しい冬を経験したからこそ、春への憧れが深い。困難の後に来る希望への切実な願い。"
            },
            {
                pattern: /窓.*雨.*水|雨.*まかせる/,
                style: "窓辺の雨を見つめる時間。自然に身を任せる心の静けさ。コントロールできないものへの信頼。"
            },
            {
                pattern: /目覚め.*生きる.*意志/,
                style: "毎朝の目覚めは、新しい一日をどう生きるかを問いかけてくる。日常の中にある哲学的な瞬間。"
            },
            {
                pattern: /記憶.*思い出/,
                style: "記憶の中に大切にしまわれた思い出。時間が経つほどに、美しく輝いて見えてくる。"
            },
            {
                pattern: /恋.*愛.*好き/,
                style: "恋をしている時の世界の見え方。すべてがいつもより鮮やかで、特別に感じられる。"
            },
            {
                pattern: /家族.*母.*父.*子/,
                style: "家族という、血の繋がりを超えた心の絆。日常の中にある、かけがえのない愛情。"
            },
            {
                pattern: /一人.*独り.*孤独/,
                style: "一人の時間だからこそ見えてくるもの。孤独の中にある、静かな豊かさ。"
            },
            {
                pattern: /風.*空.*雲.*自然/,
                style: "自然が見せてくれる表情の豊かさ。そこに自分の心情を重ねてしまう。"
            }
        ];

        // まず精密パターンをチェック
        for (let pattern of precisePatterns) {
            if (pattern.pattern.test(tankaText)) {
                console.log(`✅ Matched precise pattern: ${pattern.pattern}`);
                return pattern.style;
            }
        }

        // 次に一般的パターンをチェック
        for (let pattern of generalPatterns) {
            if (pattern.pattern.test(tankaText)) {
                console.log(`✅ Matched general pattern: ${pattern.pattern}`);
                return pattern.style;
            }
        }

        // キーワードベースの解説生成
        return this.generateKeywordBasedCommentary(tankaText);
    }

    // キーワードベースの解説生成
    generateKeywordBasedCommentary(tankaText) {
        const keywords = [];
        
        // 感情キーワード
        if (/嬉し|楽し|幸せ|よろこ/.test(tankaText)) keywords.push('joy');
        if (/悲し|泣|涙|辛|苦し/.test(tankaText)) keywords.push('sadness');
        if (/愛|恋|好き|恋人/.test(tankaText)) keywords.push('love');
        if (/不安|心配|怖|恐/.test(tankaText)) keywords.push('anxiety');
        if (/怒|腹立|いら/.test(tankaText)) keywords.push('anger');
        if (/懐かし|思い出|昔/.test(tankaText)) keywords.push('nostalgia');
        
        // 自然・季節キーワード
        if (/春|桜|花|芽/.test(tankaText)) keywords.push('spring');
        if (/夏|暑|海|陽/.test(tankaText)) keywords.push('summer');
        if (/秋|紅葉|風|落ち葉/.test(tankaText)) keywords.push('autumn');
        if (/冬|雪|寒|氷/.test(tankaText)) keywords.push('winter');
        if (/雨|雲|空|虹/.test(tankaText)) keywords.push('weather');
        
        // 人間関係キーワード
        if (/家族|母|父|子|親/.test(tankaText)) keywords.push('family');
        if (/友|仲間|みんな/.test(tankaText)) keywords.push('friendship');
        if (/一人|独り|孤独|ひとり/.test(tankaText)) keywords.push('solitude');
        
        // 時間キーワード
        if (/過去|昔|思い出|前/.test(tankaText)) keywords.push('past');
        if (/未来|明日|希望|将来/.test(tankaText)) keywords.push('future');
        if (/今|瞬間|現在|いま/.test(tankaText)) keywords.push('present');

        // キーワードに基づいた解説
        const commentaryMap = {
            joy: "この歌に込められた喜びが、読む人の心も明るくしてくれる。幸せって、こうやって人から人へ伝わっていくもの。",
            sadness: "悲しみを丁寧に言葉にすることで、その感情に向き合おうとする強さを感じる。涙の向こう側にある希望。",
            love: "愛情を短歌に込める時の、その人への想いの深さ。言葉を選ぶ一つ一つに、愛が宿っている。",
            anxiety: "不安な気持ちも、こうして歌にすることで少し軽くなる。一人じゃないよ、という声が聞こえてくる。",
            nostalgia: "懐かしさに包まれながら、過去の自分と今の自分が対話している。時間を超えた心の交流。",
            spring: "春の訪れを心で感じ取る繊細さ。新しい季節への期待と希望が、言葉の端々に現れている。",
            family: "家族への愛情が、何気ない日常の描写に込められている。当たり前の幸せを大切にする心。",
            solitude: "一人の時間だからこそ見えてくる景色がある。孤独の中にある豊かさを発見する眼差し。",
            present: "今この瞬間を大切に捉える気持ち。過ぎ去ってしまう時間への愛おしさ。"
        };

        if (keywords.length > 0) {
            const primaryKeyword = keywords[0];
            console.log(`🎯 Generated commentary based on keyword: ${primaryKeyword}`);
            return commentaryMap[primaryKeyword] || this.getDefaultCommentary();
        }

        return this.getDefaultCommentary();
    }

    // デフォルト解説
    getDefaultCommentary() {
        const defaults = [
            "短い言葉の中に、深い想いが込められている。読むたびに新しい発見がある、そんな一首。",
            "日常の中の小さな気づきを、大切に言葉に込めた歌。作者の優しい眼差しが感じられる。",
            "この歌を読んでいると、自分の体験と重なる部分があって、心が動かされる。",
            "言葉と言葉の間にある余白に、読み手の想像が広がっていく。短歌の魅力を感じる一首。",
            "作者の心の動きが、そのまま読み手に伝わってくる。素直な感情表現が印象的。"
        ];
        
        return defaults[Math.floor(Math.random() * defaults.length)];
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