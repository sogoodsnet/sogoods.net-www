/**
 * Cloudflare Pages Function: Flickr Photos API
 * Retrieves sogoods Flickr photos via oEmbed API
 */

export async function onRequest(context) {
    const { request, env } = context;

    // CORS headers for all responses
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle OPTIONS requests for CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    // Only allow GET requests
    if (request.method !== 'GET') {
        return new Response(JSON.stringify({ 
            success: false, 
            error: 'Method not allowed' 
        }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    try {
        console.log('📸 Cloudflare Function: Flickr photo fetch requested');
        
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
                
                // Cloudflare Runtime has built-in fetch
                const response = await fetch(oembedUrl, {
                    headers: {
                        'User-Agent': 'sogoods.net/1.0 (Cloudflare Pages Function)'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                if (data.url) {
                    let imageUrl = data.url;
                    
                    // より高解像度に変換
                    const sizeUpgrades = [
                        ['_m.jpg', '_b.jpg'],    // Medium -> Large
                        ['_n.jpg', '_b.jpg'],    // Small -> Large  
                        ['_q.jpg', '_c.jpg'],    // Square -> Medium 800
                        ['_s.jpg', '_c.jpg'],    // Small square -> Medium 800
                        ['_t.jpg', '_c.jpg'],    // Thumbnail -> Medium 800
                        ['_z.jpg', '_b.jpg']     // Medium 640 -> Large
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
        
        console.log(`📸 Cloudflare Flickr fetch complete: ${validPhotos.length}/${photoIds.length} photos`);
        
        return new Response(JSON.stringify({
            success: true,
            photos: validPhotos,
            totalCount: validPhotos.length,
            sourcePhotoIds: photoIds.length
        }), {
            headers: { 
                ...corsHeaders, 
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=3600' // 1 hour cache
            }
        });
        
    } catch (error) {
        console.error('❌ Cloudflare Flickr API error:', error);
        
        return new Response(JSON.stringify({
            success: false,
            error: error.message,
            photos: []
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}