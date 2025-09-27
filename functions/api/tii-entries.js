/**
 * Cloudflare Pages Function: TII Database API  
 * Manages TII (Today I Interpreted) entries using KV storage
 */

export async function onRequest(context) {
    const { request, env } = context;

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        if (request.method === 'GET') {
            // TIIエントリーの取得
            const entriesJson = await env.TII_KV?.get('tii-entries') || '[]';
            const entries = JSON.parse(entriesJson);
            
            // 新しい順にソート
            entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            return new Response(JSON.stringify({
                success: true,
                entries: entries.slice(0, 50) // 最新50件
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
            
        } else if (request.method === 'POST') {
            // TIIエントリーの追加
            const { content, author } = await request.json();
            
            if (!content || content.trim().length === 0) {
                return new Response(JSON.stringify({
                    success: false,
                    error: '内容を入力してください'
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            
            // 既存のエントリーを取得
            const entriesJson = await env.TII_KV?.get('tii-entries') || '[]';
            const entries = JSON.parse(entriesJson);
            
            // 新しいエントリーを追加
            const newEntry = {
                id: Date.now().toString(),
                content: content.trim().substring(0, 500), // 500文字制限
                author: (author || '匿名').trim().substring(0, 20), // 20文字制限
                timestamp: new Date().toISOString()
            };
            
            entries.unshift(newEntry);
            
            // 最新100件のみ保持
            const trimmedEntries = entries.slice(0, 100);
            
            // KVに保存
            if (env.TII_KV) {
                await env.TII_KV.put('tii-entries', JSON.stringify(trimmedEntries));
            }
            
            console.log(`📝 New TII entry added by ${newEntry.author}: "${content.substring(0, 50)}..."`);
            
            return new Response(JSON.stringify({
                success: true,
                entry: newEntry,
                totalEntries: trimmedEntries.length
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
            
        } else {
            return new Response(JSON.stringify({
                success: false,
                error: 'Method not allowed'
            }), {
                status: 405,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
        
    } catch (error) {
        console.error('❌ TII API error:', error);
        
        return new Response(JSON.stringify({
            success: false,
            error: 'Internal server error',
            entries: []
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}