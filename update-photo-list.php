<?php
/**
 * sogoods.net 写真リスト自動更新システム
 * サーバー上の写真フォルダをスキャンしてphoto-list.jsを自動生成
 */

header('Content-Type: application/json');

// 写真ディレクトリパス
$mainPhotosDir = __DIR__ . '/photos/main';
$galleryPhotosDir = __DIR__ . '/photos/gallery';
$outputFile = __DIR__ . '/photos/photo-list.js';

// 対応画像拡張子
$allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'JPG', 'JPEG', 'PNG', 'GIF', 'WEBP'];

/**
 * ディレクトリから写真ファイルを取得
 */
function getPhotoFiles($directory, $allowedExtensions) {
    $photos = [];
    
    if (!is_dir($directory)) {
        return $photos;
    }
    
    $files = scandir($directory);
    foreach ($files as $file) {
        if ($file === '.' || $file === '..') {
            continue;
        }
        
        $filePath = $directory . '/' . $file;
        if (is_file($filePath)) {
            $extension = pathinfo($file, PATHINFO_EXTENSION);
            if (in_array($extension, $allowedExtensions)) {
                $photos[] = $file;
            }
        }
    }
    
    // ファイル名でソート
    sort($photos);
    return $photos;
}

/**
 * photo-list.jsファイルを生成
 */
function generatePhotoListJS($mainPhotos, $galleryPhotos, $outputFile) {
    $content = "// sogoods.net 静的写真リスト\n";
    $content .= "// このファイルはサーバー上で自動生成されます\n";
    $content .= "// 最終更新: " . date('Y-m-d H:i:s') . "\n\n";
    
    $content .= "window.sogoodsPhotoList = {\n";
    $content .= "    main: " . json_encode($mainPhotos, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . ",\n";
    $content .= "    gallery: " . json_encode($galleryPhotos, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . ",\n";
    $content .= "    lastUpdated: \"" . date('c') . "\",\n";
    $content .= "    totalCount: {\n";
    $content .= "        main: " . count($mainPhotos) . ",\n";
    $content .= "        gallery: " . count($galleryPhotos) . "\n";
    $content .= "    }\n";
    $content .= "};";
    
    $result = file_put_contents($outputFile, $content);
    return $result !== false;
}

/**
 * メイン処理
 */
try {
    // 写真ディレクトリをスキャン
    $mainPhotos = getPhotoFiles($mainPhotosDir, $allowedExtensions);
    $galleryPhotos = getPhotoFiles($galleryPhotosDir, $allowedExtensions);
    
    // photo-list.jsを生成
    $success = generatePhotoListJS($mainPhotos, $galleryPhotos, $outputFile);
    
    if ($success) {
        $response = [
            'success' => true,
            'message' => 'Photo list updated successfully',
            'data' => [
                'mainPhotos' => $mainPhotos,
                'galleryPhotos' => $galleryPhotos,
                'mainCount' => count($mainPhotos),
                'galleryCount' => count($galleryPhotos),
                'lastUpdated' => date('c'),
                'outputFile' => $outputFile
            ]
        ];
    } else {
        throw new Exception('Failed to write photo list file');
    }
    
} catch (Exception $e) {
    $response = [
        'success' => false,
        'error' => $e->getMessage(),
        'data' => [
            'mainPhotos' => [],
            'galleryPhotos' => [],
            'mainCount' => 0,
            'galleryCount' => 0
        ]
    ];
}

// JSON レスポンス
echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

// ログファイルに記録（オプション）
if (isset($_GET['log']) && $_GET['log'] === 'true') {
    $logFile = __DIR__ . '/photo-update.log';
    $logEntry = date('Y-m-d H:i:s') . " - " . json_encode($response) . "\n";
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}
?>