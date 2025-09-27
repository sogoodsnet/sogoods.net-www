/**
 * Cloudflare Pages Function: Tanka Voting API
 * Manages tanka like/dislike votes using KV storage
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
            // 投票データの取得
            const votesJson = await env.TANKA_KV?.get('tanka-votes') || '{}';
            const votes = JSON.parse(votesJson);
            
            return new Response(JSON.stringify({
                success: true,
                votes: votes
            }), {
                headers: { 
                    ...corsHeaders, 
                    'Content-Type': 'application/json',
                    'Cache-Control': 'public, max-age=60' // 1 minute cache
                }
            });
            
        } else if (request.method === 'POST') {
            // 投票の追加/更新
            const { tankaId, voteType } = await request.json();
            
            if (!tankaId || !voteType || !['like', 'dislike'].includes(voteType)) {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Invalid vote data'
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            
            // 既存の投票データを取得
            const votesJson = await env.TANKA_KV?.get('tanka-votes') || '{}';
            const votes = JSON.parse(votesJson);
            
            // 短歌IDの投票データを初期化（存在しない場合）
            if (!votes[tankaId]) {
                votes[tankaId] = { likes: 0, dislikes: 0 };
            }
            
            // 投票を記録
            if (voteType === 'like') {
                votes[tankaId].likes++;
            } else {
                votes[tankaId].dislikes++;
            }
            
            // KVに保存
            if (env.TANKA_KV) {
                await env.TANKA_KV.put('tanka-votes', JSON.stringify(votes));
            }
            
            console.log(`📊 Tanka ${tankaId} voted: ${voteType} (likes: ${votes[tankaId].likes}, dislikes: ${votes[tankaId].dislikes})`);
            
            return new Response(JSON.stringify({
                success: true,
                tankaId: tankaId,
                voteType: voteType,
                currentVotes: votes[tankaId]
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
        console.error('❌ Tanka vote API error:', error);
        
        return new Response(JSON.stringify({
            success: false,
            error: 'Internal server error'
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}