/**
 * Notion API連携モジュール
 * 記事・日記・短歌を取得して表示
 */

class NotionAPI {
    constructor(config = {}) {
        this.config = {
            // Notion API設定（後で設定）
            notionToken: config.notionToken || '',
            databaseId: config.databaseId || '',
            corsProxy: config.corsProxy || 'https://cors-anywhere.herokuapp.com/',
            // フォールバック用のサンプルデータ
            useFallback: config.useFallback !== false
        };
    }

    /**
     * Notionデータベースから記事を取得
     */
    async fetchArticles(limit = 10) {
        if (!this.config.notionToken || !this.config.databaseId) {
            console.log('Notion APIが設定されていません。サンプルデータを使用します。');
            return this.getFallbackData();
        }

        try {
            const response = await fetch(`${this.config.corsProxy}https://api.notion.com/v1/databases/${this.config.databaseId}/query`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.notionToken}`,
                    'Content-Type': 'application/json',
                    'Notion-Version': '2022-06-28'
                },
                body: JSON.stringify({
                    page_size: limit,
                    sorts: [{
                        property: 'Created',
                        direction: 'descending'
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`Notion API Error: ${response.status}`);
            }

            const data = await response.json();
            return this.processNotionData(data.results);
        } catch (error) {
            console.error('Notion API取得エラー:', error);
            return this.getFallbackData();
        }
    }

    /**
     * Notionデータを処理して表示用に変換
     */
    processNotionData(results) {
        return results.map(page => {
            const properties = page.properties;
            
            return {
                id: page.id,
                title: this.extractText(properties.Title || properties.Name),
                content: this.extractText(properties.Content || properties.Excerpt),
                date: this.extractDate(properties.Date || properties.Created),
                type: this.extractSelect(properties.Type) || 'article',
                tags: this.extractMultiSelect(properties.Tags),
                url: page.url
            };
        });
    }

    /**
     * フォールバック用のサンプルデータ
     */
    getFallbackData() {
        const today = new Date();
        return [
            {
                id: '1',
                title: '新作写真展のお知らせ',
                content: '秋の風景をテーマにした写真展を開催します。自然の美しさと季節の移ろいを表現した作品をお楽しみください...',
                date: this.formatDate(today),
                type: 'news',
                tags: ['写真展', '秋']
            },
            {
                id: '2',
                title: '風のうた',
                content: '風涼し\n山もみじ葉の\n舞い踊り\nレンズに映る\n季節のしらべ',
                date: this.formatDate(new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000)),
                type: 'tanka',
                tags: ['短歌', '自然']
            },
            {
                id: '3',
                title: '撮影日記より',
                content: '今日は早朝から山へ。朝霧が幻想的で、光と影のコントラストが美しい一瞬を捉えることができました...',
                date: this.formatDate(new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000)),
                type: 'diary',
                tags: ['撮影', '山']
            },
            {
                id: '4',
                title: 'ワークショップ開催',
                content: '初心者向け写真撮影ワークショップを開催します。構図の基本から光の使い方まで、実践的に学べます...',
                date: this.formatDate(new Date(today.getTime() - 18 * 24 * 60 * 60 * 1000)),
                type: 'event',
                tags: ['ワークショップ', '初心者']
            },
            {
                id: '5',
                title: '都市の夜景',
                content: '夜の街に輝く光たち。ビルの窓明かりが作り出す幾何学的なパターンに魅力を感じます...',
                date: this.formatDate(new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000)),
                type: 'diary',
                tags: ['夜景', '都市']
            }
        ];
    }

    /**
     * Notionのテキストプロパティを抽出
     */
    extractText(property) {
        if (!property) return '';
        
        if (property.title) {
            return property.title.map(text => text.plain_text).join('');
        }
        if (property.rich_text) {
            return property.rich_text.map(text => text.plain_text).join('');
        }
        return '';
    }

    /**
     * Notionの日付プロパティを抽出
     */
    extractDate(property) {
        if (!property) return this.formatDate(new Date());
        
        if (property.date && property.date.start) {
            return this.formatDate(new Date(property.date.start));
        }
        if (property.created_time) {
            return this.formatDate(new Date(property.created_time));
        }
        return this.formatDate(new Date());
    }

    /**
     * Notionのセレクトプロパティを抽出
     */
    extractSelect(property) {
        return property?.select?.name || '';
    }

    /**
     * Notionのマルチセレクトプロパティを抽出
     */
    extractMultiSelect(property) {
        return property?.multi_select?.map(item => item.name) || [];
    }

    /**
     * 日付をフォーマット
     */
    formatDate(date) {
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).replace(/\//g, '.');
    }

    /**
     * NEWSセクションにデータを表示
     */
    async renderNews(containerId = 'news-container') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        try {
            const articles = await this.fetchArticles(6);
            
            container.innerHTML = articles.map(article => `
                <div class="news-item" data-type="${article.type}">
                    <div class="news-date">${article.date}</div>
                    <div class="news-title">${article.title}</div>
                    <div class="news-excerpt">${this.formatContent(article.content, article.type)}</div>
                    ${article.tags.length > 0 ? `<div class="news-tags">${article.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : ''}
                </div>
            `).join('');
        } catch (error) {
            console.error('News rendering error:', error);
            container.innerHTML = '<div class="error">ニュースの読み込みに失敗しました</div>';
        }
    }

    /**
     * コンテンツタイプに応じてフォーマット
     */
    formatContent(content, type) {
        if (type === 'tanka') {
            // 短歌の場合は改行を保持
            return content.replace(/\n/g, '<br>');
        }
        
        // 他のタイプは一定文字数で切り詰め
        const maxLength = 80;
        if (content.length > maxLength) {
            return content.substring(0, maxLength) + '...';
        }
        return content;
    }
}

// グローバルインスタンス
window.notionAPI = new NotionAPI({
    useFallback: true // 現在はサンプルデータを使用
});

// ページ読み込み時にニュースを表示
document.addEventListener('DOMContentLoaded', () => {
    if (window.notionAPI) {
        window.notionAPI.renderNews('news-container');
    }
});