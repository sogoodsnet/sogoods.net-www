<?php
/**
 * sogoods.net 写真管理システム
 * 写真のアップロード、削除、リスト表示
 */

// 基本認証（簡単なパスワード保護）
$adminPassword = 'sogoods2024';
session_start();

if ($_POST['password'] ?? '' === $adminPassword) {
    $_SESSION['photo_admin'] = true;
}

$isAuthenticated = $_SESSION['photo_admin'] ?? false;

// 写真ディレクトリ設定
$mainPhotosDir = __DIR__ . '/photos/main';
$galleryPhotosDir = __DIR__ . '/photos/gallery';
$maxFileSize = 10 * 1024 * 1024; // 10MB
$allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

/**
 * 写真アップロード処理
 */
function handlePhotoUpload($targetDir, $file) {
    global $maxFileSize, $allowedTypes;
    
    if ($file['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('Upload error: ' . $file['error']);
    }
    
    if ($file['size'] > $maxFileSize) {
        throw new Exception('File too large. Maximum size: 10MB');
    }
    
    if (!in_array($file['type'], $allowedTypes)) {
        throw new Exception('Invalid file type. Allowed: JPEG, PNG, GIF, WebP');
    }
    
    // 安全なファイル名を生成
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $safeName = time() . '_' . uniqid() . '.' . $extension;
    $targetPath = $targetDir . '/' . $safeName;
    
    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        throw new Exception('Failed to move uploaded file');
    }
    
    return $safeName;
}

/**
 * 写真削除処理
 */
function deletePhoto($directory, $filename) {
    $filePath = $directory . '/' . $filename;
    
    if (!file_exists($filePath)) {
        throw new Exception('File not found');
    }
    
    if (!unlink($filePath)) {
        throw new Exception('Failed to delete file');
    }
    
    return true;
}

/**
 * 写真リスト取得
 */
function getPhotoList($directory) {
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
            $photos[] = [
                'filename' => $file,
                'size' => filesize($filePath),
                'modified' => filemtime($filePath),
                'url' => '/photos/' . basename($directory) . '/' . $file
            ];
        }
    }
    
    // 更新日時でソート（新しい順）
    usort($photos, function($a, $b) {
        return $b['modified'] - $a['modified'];
    });
    
    return $photos;
}

// API処理
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $isAuthenticated) {
    header('Content-Type: application/json');
    
    try {
        $action = $_POST['action'] ?? '';
        
        switch ($action) {
            case 'upload':
                $targetType = $_POST['target'] ?? 'main';
                $targetDir = $targetType === 'gallery' ? $galleryPhotosDir : $mainPhotosDir;
                
                if (!isset($_FILES['photo'])) {
                    throw new Exception('No file uploaded');
                }
                
                $filename = handlePhotoUpload($targetDir, $_FILES['photo']);
                
                // photo-list.jsを自動更新
                include __DIR__ . '/update-photo-list.php';
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Photo uploaded successfully',
                    'filename' => $filename,
                    'target' => $targetType
                ]);
                exit;
                
            case 'delete':
                $targetType = $_POST['target'] ?? 'main';
                $filename = $_POST['filename'] ?? '';
                $targetDir = $targetType === 'gallery' ? $galleryPhotosDir : $mainPhotosDir;
                
                deletePhoto($targetDir, $filename);
                
                // photo-list.jsを自動更新
                include __DIR__ . '/update-photo-list.php';
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Photo deleted successfully'
                ]);
                exit;
                
            case 'refresh':
                // photo-list.jsを更新
                include __DIR__ . '/update-photo-list.php';
                exit;
        }
        
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
        exit;
    }
}

// HTML界面
if (!$isAuthenticated) {
    ?>
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>sogoods.net 写真管理 - ログイン</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 400px; margin: 50px auto; padding: 20px; }
            .login-form { background: #f5f5f5; padding: 20px; border-radius: 8px; }
            input[type="password"] { width: 100%; padding: 10px; margin: 10px 0; }
            button { width: 100%; padding: 10px; background: #2196F3; color: white; border: none; border-radius: 4px; }
        </style>
    </head>
    <body>
        <div class="login-form">
            <h2>sogoods.net 写真管理</h2>
            <form method="POST">
                <input type="password" name="password" placeholder="管理パスワード" required>
                <button type="submit">ログイン</button>
            </form>
        </div>
    </body>
    </html>
    <?php
    exit;
}

// 写真リストを取得
$mainPhotos = getPhotoList($mainPhotosDir);
$galleryPhotos = getPhotoList($galleryPhotosDir);
?>

<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>sogoods.net 写真管理システム</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: #2196F3; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .section { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .upload-form { display: flex; gap: 10px; align-items: center; margin-bottom: 20px; }
        .photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; }
        .photo-item { background: white; padding: 10px; border-radius: 8px; text-align: center; }
        .photo-item img { width: 100%; max-width: 180px; height: 120px; object-fit: cover; border-radius: 4px; }
        .photo-info { font-size: 12px; color: #666; margin: 5px 0; }
        .delete-btn { background: #f44336; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; }
        .refresh-btn { background: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
        input[type="file"] { margin-right: 10px; }
        select { margin-right: 10px; padding: 8px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🖼️ sogoods.net 写真管理システム</h1>
        <p>写真のアップロード・削除・管理</p>
    </div>

    <div class="section">
        <h2>📤 写真アップロード</h2>
        <form class="upload-form" id="uploadForm" enctype="multipart/form-data">
            <input type="file" name="photo" accept="image/*" required>
            <select name="target">
                <option value="main">メイン画像</option>
                <option value="gallery">ギャラリー画像</option>
            </select>
            <button type="submit">アップロード</button>
            <button type="button" class="refresh-btn" onclick="refreshPhotoList()">リスト更新</button>
        </form>
    </div>

    <div class="section">
        <h2>📸 メイン画像 (<?= count($mainPhotos) ?>枚)</h2>
        <div class="photo-grid" id="mainPhotos">
            <?php foreach ($mainPhotos as $photo): ?>
                <div class="photo-item">
                    <img src="<?= htmlspecialchars($photo['url']) ?>" alt="<?= htmlspecialchars($photo['filename']) ?>">
                    <div class="photo-info"><?= htmlspecialchars($photo['filename']) ?></div>
                    <div class="photo-info"><?= date('Y-m-d H:i', $photo['modified']) ?></div>
                    <button class="delete-btn" onclick="deletePhoto('main', '<?= htmlspecialchars($photo['filename']) ?>')">削除</button>
                </div>
            <?php endforeach; ?>
        </div>
    </div>

    <div class="section">
        <h2>🖼️ ギャラリー画像 (<?= count($galleryPhotos) ?>枚)</h2>
        <div class="photo-grid" id="galleryPhotos">
            <?php foreach ($galleryPhotos as $photo): ?>
                <div class="photo-item">
                    <img src="<?= htmlspecialchars($photo['url']) ?>" alt="<?= htmlspecialchars($photo['filename']) ?>">
                    <div class="photo-info"><?= htmlspecialchars($photo['filename']) ?></div>
                    <div class="photo-info"><?= date('Y-m-d H:i', $photo['modified']) ?></div>
                    <button class="delete-btn" onclick="deletePhoto('gallery', '<?= htmlspecialchars($photo['filename']) ?>')">削除</button>
                </div>
            <?php endforeach; ?>
        </div>
    </div>

    <script>
        // フォーム送信処理
        document.getElementById('uploadForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            formData.append('action', 'upload');
            
            fetch('photo-admin.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('写真をアップロードしました！');
                    location.reload();
                } else {
                    alert('エラー: ' + data.error);
                }
            })
            .catch(error => {
                alert('アップロードエラー: ' + error);
            });
        });

        // 写真削除
        function deletePhoto(target, filename) {
            if (!confirm('この写真を削除しますか？')) return;
            
            const formData = new FormData();
            formData.append('action', 'delete');
            formData.append('target', target);
            formData.append('filename', filename);
            
            fetch('photo-admin.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('写真を削除しました！');
                    location.reload();
                } else {
                    alert('エラー: ' + data.error);
                }
            });
        }

        // 写真リスト更新
        function refreshPhotoList() {
            const formData = new FormData();
            formData.append('action', 'refresh');
            
            fetch('photo-admin.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('写真リストを更新しました！');
                    location.reload();
                } else {
                    alert('エラー: ' + (data.error || 'Unknown error'));
                }
            });
        }
    </script>
</body>
</html>