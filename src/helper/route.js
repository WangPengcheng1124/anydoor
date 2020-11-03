const fs = require('fs')
const path = require('path');
const Handlebars = require('handlebars')
const promisify = require('util').promisify //异步处理
const mime = require('../helper/mime')
const compress = require('./compress');
const isFresh = require('./cache');
const range = require('./range');
const stat = promisify(fs.stat)
const readdir = promisify(fs.readdir)

const tplPath = path.join(__dirname, '../template/dir.tpl')
const source = fs.readFileSync(tplPath)
const template = Handlebars.compile(source.toString())


module.exports = async function (req, res, filePath, conf) {
    try {
        const stats = await stat(filePath)
        if (stats.isFile()) {
            const contentType = mime(filePath)
            res.setHeader('Content-Type', contentType)
            if (isFresh(stats, req, res)) {
                res.statusCode = 304
                res.end()
                return
            }
            let rs;
            // range请求
            const { code, start, end } = range(stats.size, req, res)
            if (code === 200) {
                res.statusCode = 200
                rs = fs.createReadStream(filePath)
            } else {
                res.statusCode = 206
                rs = fs.createReadStream(filePath, { start, end })
            }
            //压缩
            if (filePath.match(conf.compress)) {
                rs = compress(rs, req, res)
            }
            rs.pipe(res)
        } else if (stats.isDirectory()) {
            const files = await readdir(filePath)
            res.statusCode = 200
            res.setHeader('Content-Type', 'text/html;charset=utf-8')
            const dir = path.relative(conf.root, filePath)
            const data = {
                title: path.basename(filePath),
                dir: dir ? `/${dir}` : '',
                files: files.map(file => {
                    return {
                        file,
                        icon: mime(file)
                    }
                })
            }
            res.end(template(data))
        }
    } catch (e) {
        console.error(e)
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain;charset=utf-8')
        res.end(`${filePath} is not found`)
    }
}