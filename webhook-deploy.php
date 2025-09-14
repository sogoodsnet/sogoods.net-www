<?php
/**
 * SoGoods.net GitHub Webhook デプロイスクリプト
 * 
 * GitHubのWebhookからのリクエストを受け取り、
 * 自動的にサーバーのファイルを更新します
 * 
 * 設定方法:
 * 1. このファイルをサーバーの適切な場所に配置
 * 2. GitHub Settings → Webhooks で URL を設定
 * 3. Secret を設定して下記の WEBHOOK_SECRET を更新
 */

// 設定
define('WEBHOOK_SECRET', 'your-webhook-secret-here'); // GitHubで設定したSecret
define('TARGET_DIR', '/var/www/html/sogoods');
define('REPO_URL', 'https://github.com/sogoodsnet/sogoods.net-www.git');
define('LOG_FILE', '/tmp/sogoods-deploy.log');

// ログ関数
function writeLog($message) {
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents(LOG_FILE, "[$timestamp] $message\n", FILE_APPEND);
}

// Webhook署名の検証
function verifySignature($payload, $signature) {
    if (empty(WEBHOOK_SECRET)) {
        return true; // Secret未設定の場合はスキップ
    }
    
    $expectedSignature = 'sha256=' . hash_hmac('sha256', $payload, WEBHOOK_SECRET);
    return hash_equals($expectedSignature, $signature);
}

// デプロイ実行
function deploy() {
    $commands = [
        "cd " . TARGET_DIR,
        "git fetch origin 2>&1",
        "git reset --hard origin/main 2>&1",
        "rm -rf .git .github deploy-server.sh webhook-deploy.php AGENT.md 2>/dev/null || true",
        "find . -type f -name '*.html' -exec chmod 644 {} \\;",
        "find . -type f -name '*.css' -exec chmod 644 {} \\;",
        "find . -type f -name '*.js' -exec chmod 644 {} \\;",
        "find . -type d -exec chmod 755 {} \\;"
    ];
    
    $output = [];
    foreach ($commands as $command) {
        exec($command, $output, $returnCode);
        if ($returnCode !== 0) {
            throw new Exception("Command failed: $command");
        }
    }
    
    return implode("\n", $output);
}

// メイン処理
try {
    // HTTPヘッダーの取得
    $headers = getallheaders();
    $signature = $headers['X-Hub-Signature-256'] ?? '';
    $event = $headers['X-GitHub-Event'] ?? '';
    
    // リクエストボディの取得
    $payload = file_get_contents('php://input');
    
    writeLog("Webhook received - Event: $event");
    
    // 署名検証
    if (!verifySignature($payload, $signature)) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid signature']);
        writeLog("Invalid signature");
        exit;
    }
    
    // pushイベントのみ処理
    if ($event !== 'push') {
        http_response_code(200);
        echo json_encode(['message' => 'Event ignored']);
        writeLog("Event ignored: $event");
        exit;
    }
    
    // ペイロードの解析
    $data = json_decode($payload, true);
    if (!$data || $data['ref'] !== 'refs/heads/main') {
        http_response_code(200);
        echo json_encode(['message' => 'Not main branch']);
        writeLog("Not main branch: " . ($data['ref'] ?? 'unknown'));
        exit;
    }
    
    // デプロイ実行
    writeLog("Starting deployment...");
    $output = deploy();
    writeLog("Deployment completed successfully");
    
    // レスポンス
    http_response_code(200);
    echo json_encode([
        'status' => 'success',
        'message' => 'Deployment completed',
        'output' => $output
    ]);
    
} catch (Exception $e) {
    writeLog("Deployment failed: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>