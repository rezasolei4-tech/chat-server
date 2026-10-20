const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');

// 🔐 رمز عبور را اینجا تنظیم کن (کاربر این را نمی‌بیند)
const SECRET_PASSWORD = "1234"; 

const server = http.createServer((req, res) => {
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(__dirname, 'public', filePath);

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('File not found');
            return;
        }
        const ext = path.extname(filePath);
        const contentType = ext === '.html' ? 'text/html' : 'text/plain';
        res.writeHead(200, { 'Content-Type': contentType + '; charset=utf-8' });
        res.end(data);
    });
});

const io = new Server(server, {
    cors: { origin: '*' }
});

io.on('connection', (socket) => {
    console.log('یک کاربر وصل شد:', socket.id);

    // بررسی رمز عبور در سمت سرور
    socket.on('checkPassword', (password, callback) => {
        if (password === SECRET_PASSWORD) {
            callback({ success: true });
        } else {
            callback({ success: false });
        }
    });

    socket.on('sendMessage', (data) => {
        console.log('پیام دریافت شد:', data);
        io.emit('newMessage', data);
    });

    socket.on('disconnect', () => {
        console.log('کاربر قطع شد:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('سرور چت روی پورت ' + PORT + ' اجرا شد');
});
