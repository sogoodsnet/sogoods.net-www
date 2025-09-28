#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * sogoods.net 写真リスト生成スクリプト
 * /photos/main/ と /photos/gallery/ フォルダをスキャンして
 * photo-list.js ファイルを自動生成します
 */

function getPhotoFiles(dirPath) {
    try {
        if (!fs.existsSync(dirPath)) {
            console.log(`⚠️ Directory not found: ${dirPath}`);
            return [];
        }
        
        const files = fs.readdirSync(dirPath);
        const photoFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
        });
        
        console.log(`📁 Found ${photoFiles.length} photos in ${dirPath}`);
        return photoFiles.sort();
    } catch (error) {
        console.error(`❌ Error reading directory ${dirPath}:`, error.message);
        return [];
    }
}

function generatePhotoList() {
    const mainDir = './photos/main';
    const galleryDir = './photos/gallery';
    
    console.log('📸 Generating photo list...');
    
    const mainPhotos = getPhotoFiles(mainDir);
    const galleryPhotos = getPhotoFiles(galleryDir);
    
    const photoListContent = `// sogoods.net 静的写真リスト
// このファイルはデプロイ時に自動生成されます

window.sogoodsPhotoList = {
    main: ${JSON.stringify(mainPhotos, null, 8)},
    gallery: ${JSON.stringify(galleryPhotos, null, 8)},
    lastUpdated: "${new Date().toISOString()}"
};`;

    const outputPath = './photos/photo-list.js';
    
    try {
        fs.writeFileSync(outputPath, photoListContent);
        console.log(`✅ Photo list generated: ${outputPath}`);
        console.log(`📷 Main photos: ${mainPhotos.length}`);
        console.log(`🖼️ Gallery photos: ${galleryPhotos.length}`);
        
        // 生成されたリストの一部をプレビュー
        if (mainPhotos.length > 0) {
            console.log(`📁 Main photos preview: ${mainPhotos.slice(0, 3).join(', ')}${mainPhotos.length > 3 ? '...' : ''}`);
        }
        if (galleryPhotos.length > 0) {
            console.log(`🖼️ Gallery photos preview: ${galleryPhotos.slice(0, 3).join(', ')}${galleryPhotos.length > 3 ? '...' : ''}`);
        }
        
        return true;
    } catch (error) {
        console.error('❌ Error writing photo list:', error.message);
        return false;
    }
}

if (require.main === module) {
    // スクリプトが直接実行された場合
    generatePhotoList();
} else {
    // モジュールとしてインポートされた場合
    module.exports = generatePhotoList;
}