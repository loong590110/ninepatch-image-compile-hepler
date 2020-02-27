// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
const { ipcRenderer } = require('electron')
const { exec } = require('child_process')

const txtInput = document.getElementById('dir_in')
const txtOutput = document.getElementById('dir_out')
const btnSelect = document.getElementById('select')
const btnOpen = document.getElementById('open')
const file = document.getElementById('file')
const txtState = document.getElementById('result')

// 任何你期望执行的cmd命令，ls都可以
const aapt = 'aapt-linux'
const cmdStr = './' + aapt + ' c -v -S $input -C $output'

// 子进程名称
let workerProcess

// runExec();
txtInput.value = '...'
txtOutput.value = '...'

ipcRenderer.on('open-directory', function (path) {
    txtInput.value = path
    runExec()
})

btnSelect.addEventListener('click', function () {
    ipcRenderer.send('open-directory', 'openDirectory')
})

btnOpen.addEventListener('click', function () {

})

function runExec() {
    let input = txtInput.value
    let output = input + '/output'
    if (input == '' || input == '...') {
        return
    }
    // 执行命令行，如果命令不需要路径，或就是项目根目录，则不需要cwd参数：
    workerProcess = exec(cmdStr.replace('$input', input).replace('$output', output))
    // 不受child_process默认的缓冲区大小的使用方法，没参数也要写上{}：workerProcess = exec(cmdStr, {})

    // 打印正常的后台可执行程序输出
    workerProcess.stdout.on('data', function (data) {
        console.log('stdout: ' + data);
        txtState.append('\n' + data);
    });

    // 打印错误的后台可执行程序输出
    workerProcess.stderr.on('data', function (data) {
        console.log('stderr: ' + data);
        txtState.append('\n' + data);
    });

    // 退出之后的输出
    workerProcess.on('close', function (code) {
        console.log('out code：' + code);
    })
}
