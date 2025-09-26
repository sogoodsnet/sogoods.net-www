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

const app = express();
const port = process.env.PORT || 8080;

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

// サーバー起動
app.listen(port, '0.0.0.0', async () => {
    await ensurePhotosDir();
    console.log(`🚀 sogoods.net Photo Upload Server running on port ${port}`);
    console.log(`📁 Photos directory: ${PHOTOS_DIR}`);
    console.log(`🔒 Admin password required: sogoods2024`);
});

module.exports = app;