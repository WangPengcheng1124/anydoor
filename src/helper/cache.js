const { cache } = require('../config/defaultConfig')
function refreshRes(stats, res) {
    const { maxAge, expires, cacheControl, lastModified, etag } = cache
    if (expires) {
        res.setHeader('Expires', new Date(Date.now() + maxAge).toUTCString())
    }
    if (cacheControl) {
        res.setHeader('Catch-Control', `public max-age=${maxAge}`)
    }
    if (lastModified) {
        res.setHeader('Last-Modified', stats.mtime.toUTCString())
    }
    if (etag) {
        res.setHeader('Etag', `${stats.size}-${stats.mtime.toUTCString()}`)
    }
}
module.exports = function isFresh(stats, req, res) {
    refreshRes(stats, res)
    const lastModified = req.headers['if-modified-since']
    const etag = req.headers['if-none-match']
    //第一次请求
    if (!lastModified && !etag) {
        return false
    }
    if (lastModified && lastModified !== res.getHeader('Last-Modified')) {
        return false
    }
    if (etag && etag !== res.getHeader('ETag')) {
        return false
    }
    return true
}