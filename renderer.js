// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

const { ipcRenderer, shell } = require('electron')
const { exec } = require('child_process')
const fs = require('fs')

const txtInput = document.getElementById('txt_dir_in')
const txtOutput = document.getElementById('txt_dir_out')
const btnInput = document.getElementById('btn_sel_in')
const btnOutput = document.getElementById('btn_sel_out')
const btnOpen = document.getElementById('btn_open')
const btnStart = document.getElementById('btn_start')
const txtState = document.getElementById('result')

// 任何你期望执行的cmd命令，ls都可以
const platform = process.platform
const aapt = 'linux' == platform ? 'aapt-linux' : 'darwin' == platform ? 'aapt-mac' : 'aapt'
const path = 'win32' == platform ? 'aapt\\' : './aapt/';
const cmdStr = path + aapt + ' c -v -S $input -C $output'
const outDir = 'win32' == platform ? '\\output' : '/ouput'
const childDir = 'win32' == platform ? '\\' : '/.'

// 子进程名称
let workerProcess

let timer
// runExec();

ipcRenderer.on('open-directory-result', function (event, data) {
    if (data) {
        if (data.arg == 'input') {
            txtInput.value = data.filePath
            if (txtOutput.value == '') {
                txtOutput.value = txtInput.value + outDir
            }
        } else if ('output' == data.arg) {
            txtOutput.value = data.filePath
        }
    }
})

btnInput.addEventListener('click', function () {
    ipcRenderer.send('open-directory', 'input')
})

btnOutput.addEventListener('click', function () {
    ipcRenderer.send('open-directory', 'output')
})

btnOpen.addEventListener('click', function () {
    let path = txtOutput.value + childDir;
    if (fs.existsSync(path)) {
        if ('win32' == process.platform) {
            const files = fs.readdirSync(path);
            if (files && files.length > 0) {
                path = path + files[0];
            }
        }
        shell.showItemInFolder(path);
    } else {
        println('目录不存在');
    }
})

btnStart.addEventListener('click', function () {
    runExec(txtInput.value, txtOutput.value)
})

function runExec(input, output) {
    if (input == '') {
        alert('请选择要编译的图片目录');
        return;
    }
    if (input + outDir == output) {
        shell.moveItemToTrash(output);
    }
    // 执行命令行，如果命令不需要路径，或就是项目根目录，则不需要cwd参数：
    workerProcess = exec(cmdStr.replace('$input', input).replace('$output', output))
    // 不受child_process默认的缓冲区大小的使用方法，没参数也要写上{}：workerProcess = exec(cmdStr, {})

    // 打印正常的后台可执行程序输出
    workerProcess.stdout.on('data', function (data) {
        console.log('stdout: ' + data);
        println(data);
    });

    // 打印错误的后台可执行程序输出
    workerProcess.stderr.on('data', function (data) {
        console.log('stderr: ' + data);
        println(data);
    });

    // 退出之后的输出
    workerProcess.on('close', function (code) {
        console.log('out code：' + code);
    })
}

function println(text) {
    //print
    if (txtState.value != '') {
        txtState.append('\n');
    }
    txtState.append(new Date().toLocaleString() + ':   ' + text);
    //scroll to bottom
    const scrollableHeight = txtState.scrollHeight - txtState.offsetHeight;
    if (scrollableHeight > 0) {
        if (timer) {
            clearInterval(timer);
        }
        const duration = 350;
        const interval = 25;
        const scrollHeightPerTime = scrollableHeight / (duration / interval)
        timer = setInterval(function () {
            txtState.scrollTop = txtState.scrollTop + scrollHeightPerTime;
            console.log(txtState.scrollTop + '~' + scrollableHeight);
            if (txtState.scrollTop >= scrollableHeight) {
                txtState.scrollTop = scrollableHeight;
                clearInterval(timer);
            }
        }, interval);
    }
}
