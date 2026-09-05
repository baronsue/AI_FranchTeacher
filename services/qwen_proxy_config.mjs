export const DEPLOYED_QWEN_PROXY_URL =
    'https://franch-teacher-proxy.onrender.com/qwen';

export function isLocalHostname(hostname = '') {
    return hostname === '' ||
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1';
}

export function resolveDefaultQwenProxyUrl(locationLike) {
    const location = locationLike ??
        (typeof window !== 'undefined' ? window.location : undefined);

    if (!location || !isLocalHostname(location.hostname)) {
        return DEPLOYED_QWEN_PROXY_URL;
    }

    const protocol = location.protocol === 'https:' ? 'https:' : 'http:';
    const hostname = location.hostname === '::1'
        ? '[::1]'
        : (location.hostname || 'localhost');

    return `${protocol}//${hostname}:3001/qwen`;
}

export function buildQwenHealthUrl(proxyUrl, baseUrl) {
    const browserBase = typeof window !== 'undefined' ? window.location.href : undefined;

    try {
        const url = new URL(proxyUrl, baseUrl || browserBase);
        url.pathname = '/health';
        url.search = '';
        url.hash = '';
        return url.toString();
    } catch (_) {
        const base = String(proxyUrl || '').replace(/\/qwen\/?$/, '');
        return `${base}/health`;
    }
}
