/* ============================================
   YOUTUBE PLAYER HELPERS
   ============================================ */

(function(window) {
    'use strict';

    const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;
    const YOUTUBE_HOST_PATTERN = /(^|\.)youtube\.com$|(^|\.)youtube-nocookie\.com$|(^|\.)youtu\.be$/i;

    function cleanYoutubeId(value) {
        const match = String(value || '').match(/[a-zA-Z0-9_-]{11}/);
        return match ? match[0] : '';
    }

    function normalizeInput(input) {
        const value = String(input || '').trim().replace(/&amp;/g, '&');
        const srcMatch = value.match(/\bsrc=["']([^"']+)["']/i);
        return srcMatch ? srcMatch[1].trim().replace(/&amp;/g, '&') : value;
    }

    function extractYoutubeId(input) {
        const value = normalizeInput(input);
        if (!value) return '';
        if (YOUTUBE_ID_PATTERN.test(value)) return value;

        try {
            const url = new URL(value, window.location.href);
            const hostname = url.hostname.replace(/^www\./i, '').replace(/^m\./i, '');

            if (hostname === 'youtu.be') {
                return cleanYoutubeId(url.pathname.split('/').filter(Boolean)[0]);
            }

            if (YOUTUBE_HOST_PATTERN.test(hostname)) {
                const idFromQuery = cleanYoutubeId(url.searchParams.get('v') || url.searchParams.get('vi'));
                if (idFromQuery) return idFromQuery;

                const parts = url.pathname.split('/').filter(Boolean);
                const pathKeys = ['embed', 'shorts', 'live', 'v'];
                for (const key of pathKeys) {
                    const index = parts.indexOf(key);
                    if (index !== -1 && parts[index + 1]) {
                        return cleanYoutubeId(parts[index + 1]);
                    }
                }
            }
        } catch (error) {
            // Fall through to regex parsing for partial pasted links.
        }

        if (!/youtu/i.test(value)) return '';

        const patterns = [
            /(?:youtube(?:-nocookie)?\.com\/(?:embed|shorts|live|v)\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/i,
            /[?&](?:v|vi)=([a-zA-Z0-9_-]{11})/i
        ];

        for (const pattern of patterns) {
            const match = value.match(pattern);
            if (match) return match[1];
        }

        return '';
    }

    function buildYoutubeEmbedUrl(input, options = {}) {
        const videoId = extractYoutubeId(input);
        if (!videoId) return '';

        const params = new URLSearchParams({
            rel: '0',
            modestbranding: '1',
            playsinline: '1'
        });

        if (options.autoplay) params.set('autoplay', '1');
        if (options.mute) params.set('mute', '1');
        if (options.enableJsApi) {
            params.set('enablejsapi', '1');
            if (/^https?:\/\//i.test(window.location.origin)) {
                params.set('origin', window.location.origin);
            }
        }
        if (options.loop) {
            params.set('loop', '1');
            params.set('playlist', videoId);
        }
        if (options.controls === false) params.set('controls', '0');

        return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
    }

    function buildYoutubeWatchUrl(input) {
        const videoId = extractYoutubeId(input);
        if (videoId) return `https://www.youtube.com/watch?v=${videoId}`;

        const value = normalizeInput(input);
        return /^https?:\/\//i.test(value) ? value : '';
    }

    function buildYoutubeThumbnailUrl(input, quality = 'hqdefault') {
        const videoId = extractYoutubeId(input);
        return videoId ? `https://img.youtube.com/vi/${videoId}/${quality}.jpg` : '';
    }

    function prepareYoutubeIframe(iframe, input, options = {}) {
        if (!iframe) return false;

        const embedUrl = buildYoutubeEmbedUrl(input, options);
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
        iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');

        if (!embedUrl) {
            iframe.removeAttribute('src');
            return false;
        }

        iframe.src = embedUrl;
        return true;
    }

    window.YoutubeUtils = {
        extractYoutubeId,
        buildYoutubeEmbedUrl,
        buildYoutubeWatchUrl,
        buildYoutubeThumbnailUrl,
        prepareYoutubeIframe
    };
})(window);
