// 自动打开地址
const { exec } = require('child_process')

module.exports = url => {
    switch (process.platform) {
        case 'darwin': //mac
            exec(`open ${url}`)
            break
        case 'win32': //windows
            exec(`start ${url}`)
            break
    }
}