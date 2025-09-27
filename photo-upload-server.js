/**
 * sogoods.net Photo Upload Server
 * /photos/miiko/ フォルダへの写真保存API
 */

const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors');
const https = require('https'); // HTTPSリクエスト用（フォールバック）

// Flickr API用のHTTPクライアント（Node.js 18+の場合はfetchが組み込み）
let fetch;
try {
    if (typeof globalThis.fetch !== 'undefined') {
        fetch = globalThis.fetch;
    } else {
        fetch = require('node-fetch');
    }
} catch (error) {
    console.log('⚠️ fetch not available, will use https module fallback');
    fetch = null;
}

const app = express();
const port = process.env.PORT || 8081;

// CORS設定
app.use(cors({
    origin: ['http://localhost:3000', 'https://sogoods.net', /\.e2b\.dev$/],
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.static('.'));

// miiko写真フォルダの設定
const PHOTOS_DIR = path.join(__dirname, 'photos', 'miiko');

// multer設定（メモリストレージ使用）
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB制限
    },
    fileFilter: (req, file, cb) => {
        // 画像ファイルのみ許可
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('画像ファイルのみアップロード可能です'), false);
        }
    }
});

// miiko写真フォルダが存在することを確認
async function ensurePhotosDir() {
    try {
        await fs.access(PHOTOS_DIR);
    } catch (error) {
        await fs.mkdir(PHOTOS_DIR, { recursive: true });
        console.log('📁 Created photos/miiko directory');
    }
}

// HTTPSリクエストのフォールバック関数
function httpsGetJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ 
                        ok: res.statusCode >= 200 && res.statusCode < 300, 
                        status: res.statusCode,
                        json: () => Promise.resolve(json)
                    });
                } catch (error) {
                    reject(new Error('JSON parse error: ' + error.message));
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

// Flickr oEmbed API プロキシエンドポイント
app.get('/api/flickr-photos', async (req, res) => {
    try {
        console.log('📸 Server-side Flickr photo fetch requested');
        
        // sogoods Flickr写真ID一覧
        const photoIds = [
            '30157100788',
            '41992530634', 
            '42581572701',
            '42581568481',
            '42530415872',
            '41177730075'
        ];
        
        const validPhotos = [];
        
        for (const photoId of photoIds) {
            try {
                const oembedUrl = `https://www.flickr.com/services/oembed/?url=https://www.flickr.com/photos/sogoods/${photoId}/&format=json&maxwidth=1024`;
                
                console.log(`🔗 Fetching oEmbed for ${photoId}...`);
                
                let response, data;
                
                if (fetch) {
                    // fetch を使用
                    response = await fetch(oembedUrl, {
                        headers: {
                            'User-Agent': 'sogoods.net/1.0 (PhotoManager)'
                        }
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    
                    data = await response.json();
                } else {
                    // httpsモジュールのフォールバックを使用
                    response = await httpsGetJson(oembedUrl);
                    
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    
                    data = await response.json();
                }
                
                if (data.url) {
                    let imageUrl = data.url;
                    
                    // より高解像度に変換
                    const sizeUpgrades = [
                        ['_m.jpg', '_b.jpg'],
                        ['_n.jpg', '_b.jpg'],  
                        ['_q.jpg', '_c.jpg'],
                        ['_s.jpg', '_c.jpg'],
                        ['_t.jpg', '_c.jpg'],
                        ['_z.jpg', '_b.jpg']
                    ];
                    
                    for (const [from, to] of sizeUpgrades) {
                        if (imageUrl.includes(from)) {
                            imageUrl = imageUrl.replace(from, to);
                            break;
                        }
                    }
                    
                    validPhotos.push({
                        id: photoId,
                        url: imageUrl,
                        title: data.title || `sogoods photo ${photoId}`,
                        source: 'flickr_oembed'
                    });
                    
                    console.log(`✅ Flickr oEmbed: ${photoId} -> ${imageUrl}`);
                } else {
                    console.log(`⚠️ No URL in oEmbed response for ${photoId}`);
                }
                
            } catch (error) {
                console.warn(`❌ Flickr oEmbed failed for ${photoId}:`, error.message);
            }
            
            // API率制限回避
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log(`📸 Server Flickr fetch complete: ${validPhotos.length}/${photoIds.length} photos`);
        
        res.json({
            success: true,
            photos: validPhotos,
            totalCount: validPhotos.length,
            sourcePhotoIds: photoIds.length
        });
        
    } catch (error) {
        console.error('❌ Server Flickr API error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            photos: []
        });
    }
});

// ファイル名の生成（重複を避ける）
async function generateUniqueFileName(originalName) {
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const ext = path.extname(originalName).toLowerCase();
    const baseName = path.basename(originalName, ext);
    
    // sogoods形式: 番号-元ファイル名.JPG
    let fileName = `${timestamp}-${baseName}${ext}`;
    let counter = 1;
    
    while (true) {
        try {
            await fs.access(path.join(PHOTOS_DIR, fileName));
            // ファイルが存在する場合、カウンターを追加
            fileName = `${timestamp}-${counter}-${baseName}${ext}`;
            counter++;
        } catch {
            // ファイルが存在しない場合、このファイル名を使用
            break;
        }
    }
    
    return fileName;
}

// 画像の自動リサイズとJPG変換
async function processImage(buffer, originalName) {
    try {
        // 画像情報を取得
        const metadata = await sharp(buffer).metadata();
        
        // 最大サイズ設定（大きすぎる場合はリサイズ）
        const maxWidth = 2048;
        const maxHeight = 2048;
        
        let processedBuffer = buffer;
        
        if (metadata.width > maxWidth || metadata.height > maxHeight) {
            console.log(`📏 Resizing image from ${metadata.width}x${metadata.height}`);
            processedBuffer = await sharp(buffer)
                .resize(maxWidth, maxHeight, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .jpeg({ quality: 85, progressive: true })
                .toBuffer();
        } else {
            // サイズは適切だが、JPG形式に統一
            processedBuffer = await sharp(buffer)
                .jpeg({ quality: 90, progressive: true })
                .toBuffer();
        }
        
        return processedBuffer;
    } catch (error) {
        console.error('❌ Image processing error:', error);
        throw new Error('画像の処理に失敗しました');
    }
}

// 写真アップロードエンドポイント
app.post('/api/upload-photo', upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'ファイルがアップロードされていません' });
        }

        // 管理者認証チェック（簡易版）
        const adminPassword = req.body.password || req.headers['x-admin-password'];
        if (adminPassword !== 'sogoods2024') {
            return res.status(401).json({ error: '管理者パスワードが必要です' });
        }

        console.log(`📤 Uploading photo: ${req.file.originalname} (${req.file.size} bytes)`);

        // ディレクトリの存在確認
        await ensurePhotosDir();

        // 画像処理
        const processedBuffer = await processImage(req.file.buffer, req.file.originalname);

        // 一意なファイル名を生成
        const fileName = await generateUniqueFileName(req.file.originalname);
        const filePath = path.join(PHOTOS_DIR, fileName);

        // ファイルを保存
        await fs.writeFile(filePath, processedBuffer);

        // ファイル情報を取得
        const stats = await fs.stat(filePath);
        const metadata = await sharp(processedBuffer).metadata();

        console.log(`✅ Photo saved: ${fileName} (${stats.size} bytes, ${metadata.width}x${metadata.height})`);

        res.json({
            success: true,
            fileName: fileName,
            filePath: `/photos/miiko/${fileName}`,
            size: stats.size,
            dimensions: {
                width: metadata.width,
                height: metadata.height
            },
            originalName: req.file.originalname,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Upload error:', error);
        res.status(500).json({
            error: '写真のアップロードに失敗しました',
            details: error.message
        });
    }
});

// Base64データのアップロードエンドポイント
app.post('/api/upload-photo-base64', express.json(), async (req, res) => {
    try {
        const { photoData, fileName, password } = req.body;

        // 管理者認証チェック
        if (password !== 'sogoods2024') {
            return res.status(401).json({ error: '管理者パスワードが必要です' });
        }

        if (!photoData || !fileName) {
            return res.status(400).json({ error: 'photoDataとfileNameが必要です' });
        }

        console.log(`📤 Uploading base64 photo: ${fileName}`);

        // Base64データをBufferに変換
        const base64Data = photoData.replace(/^data:image\/[a-z]+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // ディレクトリの存在確認
        await ensurePhotosDir();

        // 画像処理
        const processedBuffer = await processImage(buffer, fileName);

        // 一意なファイル名を生成
        const uniqueFileName = await generateUniqueFileName(fileName);
        const filePath = path.join(PHOTOS_DIR, uniqueFileName);

        // ファイルを保存
        await fs.writeFile(filePath, processedBuffer);

        // ファイル情報を取得
        const stats = await fs.stat(filePath);
        const metadata = await sharp(processedBuffer).metadata();

        console.log(`✅ Base64 photo saved: ${uniqueFileName} (${stats.size} bytes, ${metadata.width}x${metadata.height})`);

        res.json({
            success: true,
            fileName: uniqueFileName,
            filePath: `/photos/miiko/${uniqueFileName}`,
            size: stats.size,
            dimensions: {
                width: metadata.width,
                height: metadata.height
            },
            originalName: fileName,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Base64 upload error:', error);
        res.status(500).json({
            error: 'Base64写真のアップロードに失敗しました',
            details: error.message
        });
    }
});

// miiko写真リスト取得エンドポイント
app.get('/api/photos/miiko', async (req, res) => {
    try {
        await ensurePhotosDir();
        const files = await fs.readdir(PHOTOS_DIR);
        
        const photoFiles = files
            .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
            .map(file => ({
                fileName: file,
                url: `/photos/miiko/${file}`,
                uploadTime: null // ファイルの作成日時は別途取得可能
            }))
            .sort((a, b) => b.fileName.localeCompare(a.fileName)); // 新しい順

        res.json({
            success: true,
            photos: photoFiles,
            totalCount: photoFiles.length
        });

    } catch (error) {
        console.error('❌ Photos list error:', error);
        res.status(500).json({
            error: '写真リストの取得に失敗しました',
            details: error.message
        });
    }
});

// 📝 TII Database System
const TII_DATA_FILE = path.join(__dirname, 'tii-database.json');
const TANKA_VOTES_FILE = path.join(__dirname, 'tanka-votes.csv');

// TII データベース初期化
async function ensureTIIDatabase() {
    try {
        await fs.access(TII_DATA_FILE);
    } catch (error) {
        const initialData = {
            entries: [],
            metadata: {
                created: new Date().toISOString(),
                totalEntries: 0
            }
        };
        await fs.writeFile(TII_DATA_FILE, JSON.stringify(initialData, null, 2));
        console.log('📄 Created TII database file');
    }
}

// 短歌投票CSVファイル初期化
async function ensureTankaVotesFile() {
    try {
        await fs.access(TANKA_VOTES_FILE);
    } catch (error) {
        const header = 'tankaId,tankaText,likes,dislikes,lastUpdated\n';
        await fs.writeFile(TANKA_VOTES_FILE, header);
        console.log('📊 Created tanka votes CSV file');
    }
}

// TII エントリー取得エンドポイント
app.get('/api/tii-entries', async (req, res) => {
    try {
        const data = JSON.parse(await fs.readFile(TII_DATA_FILE, 'utf8'));
        res.json({
            success: true,
            entries: data.entries.slice(-20).reverse(), // 最新20件を逆順
            totalCount: data.metadata.totalEntries
        });
    } catch (error) {
        console.error('❌ TII entries read error:', error);
        res.status(500).json({
            error: 'データの読み込みに失敗しました',
            details: error.message
        });
    }
});

// TII エントリー投稿エンドポイント
app.post('/api/tii-entries', async (req, res) => {
    try {
        const { content, author } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'コンテンツが必要です' });
        }

        const data = JSON.parse(await fs.readFile(TII_DATA_FILE, 'utf8'));
        
        const newEntry = {
            id: Date.now(),
            content: content.trim(),
            author: author || '匿名',
            timestamp: new Date().toISOString(),
            likes: 0
        };

        data.entries.push(newEntry);
        data.metadata.totalEntries = data.entries.length;
        data.metadata.lastUpdated = new Date().toISOString();

        await fs.writeFile(TII_DATA_FILE, JSON.stringify(data, null, 2));

        console.log(`📝 New TII entry added by ${newEntry.author}: "${content.substring(0, 50)}..."`);

        res.json({
            success: true,
            entry: newEntry,
            totalCount: data.metadata.totalEntries
        });

    } catch (error) {
        console.error('❌ TII entry post error:', error);
        res.status(500).json({
            error: 'エントリーの投稿に失敗しました',
            details: error.message
        });
    }
});

// 短歌投票取得エンドポイント
app.get('/api/tanka-votes', async (req, res) => {
    try {
        const csvContent = await fs.readFile(TANKA_VOTES_FILE, 'utf8');
        const lines = csvContent.split('\n').filter(line => line.trim());
        
        const votes = [];
        for (let i = 1; i < lines.length; i++) { // Skip header
            const [tankaId, tankaText, likes, dislikes, lastUpdated] = lines[i].split(',');
            if (tankaId) {
                votes.push({
                    tankaId: parseInt(tankaId),
                    tankaText: tankaText,
                    likes: parseInt(likes) || 0,
                    dislikes: parseInt(dislikes) || 0,
                    lastUpdated: lastUpdated
                });
            }
        }

        res.json({
            success: true,
            votes: votes
        });

    } catch (error) {
        console.error('❌ Tanka votes read error:', error);
        res.json({ success: true, votes: [] }); // Empty if file doesn't exist yet
    }
});

// 短歌投票エンドポイント
app.post('/api/vote-tanka', async (req, res) => {
    try {
        const { tankaId, vote } = req.body;

        if (!tankaId || !vote || !['like', 'dislike'].includes(vote)) {
            return res.status(400).json({ error: 'Invalid vote data' });
        }

        // 現在の投票データを読み込み
        let csvContent = '';
        let votes = new Map();
        
        try {
            csvContent = await fs.readFile(TANKA_VOTES_FILE, 'utf8');
            const lines = csvContent.split('\n').filter(line => line.trim());
            
            for (let i = 1; i < lines.length; i++) {
                const [id, text, likes, dislikes, lastUpdated] = lines[i].split(',');
                if (id) {
                    votes.set(parseInt(id), {
                        tankaText: text,
                        likes: parseInt(likes) || 0,
                        dislikes: parseInt(dislikes) || 0,
                        lastUpdated: lastUpdated
                    });
                }
            }
        } catch (error) {
            console.log('📊 Creating new votes file...');
        }

        // 投票データを更新
        const currentVotes = votes.get(tankaId) || { 
            tankaText: `tanka_${tankaId}`, 
            likes: 0, 
            dislikes: 0 
        };
        
        if (vote === 'like') {
            currentVotes.likes++;
        } else {
            currentVotes.dislikes++;
        }
        
        currentVotes.lastUpdated = new Date().toISOString();
        votes.set(tankaId, currentVotes);

        // CSVファイルを再構築
        let newCsvContent = 'tankaId,tankaText,likes,dislikes,lastUpdated\n';
        votes.forEach((voteData, id) => {
            newCsvContent += `${id},"${voteData.tankaText}",${voteData.likes},${voteData.dislikes},${voteData.lastUpdated}\n`;
        });

        await fs.writeFile(TANKA_VOTES_FILE, newCsvContent);

        console.log(`📊 Tanka ${tankaId} voted: ${vote} (likes: ${currentVotes.likes}, dislikes: ${currentVotes.dislikes})`);

        res.json({
            success: true,
            tankaId: tankaId,
            vote: vote,
            votes: {
                likes: currentVotes.likes,
                dislikes: currentVotes.dislikes
            }
        });

    } catch (error) {
        console.error('❌ Tanka vote error:', error);
        res.status(500).json({
            error: '投票の記録に失敗しました',
            details: error.message
        });
    }
});

// サーバー起動
app.listen(port, '0.0.0.0', async () => {
    await ensurePhotosDir();
    await ensureTIIDatabase();
    await ensureTankaVotesFile();
    console.log(`🚀 sogoods.net Enhanced Server running on port ${port}`);
    console.log(`📁 Photos directory: ${PHOTOS_DIR}`);
    console.log(`📄 TII database: ${TII_DATA_FILE}`);
    console.log(`📊 Tanka votes: ${TANKA_VOTES_FILE}`);
    console.log(`🔒 Admin password required: sogoods2024`);
});

module.exports = app;