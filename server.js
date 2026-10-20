const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const SECRET_PASSWORD = "1234";

async function main() {
    const db = await open({
        filename: 'chat.db',
        driver: sqlite3.Database
    });

    // ساخت جدول با ستون type (برای متن یا صدا)
    await db.exec(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT,
            sender TEXT,
            type TEXT DEFAULT 'text'
        )
    `);

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

        socket.on('getMessages', async () => {
            const messages = await db.all('SELECT * FROM messages ORDER BY id ASC');
            socket.emit('previousMessages', messages);
        });

        socket.on('checkPassword', (password, callback) => {
            if (password === SECRET_PASSWORD) {
                callback({ success: true });
            } else {
                callback({ success: false });
            }
        });

        socket.on('sendMessage', async (data) => {
            const result = await db.run(
                'INSERT INTO messages (content, sender, type) VALUES (?, ?, ?)',
                data.text,
                data.sender,
                data.type || 'text'
            );
            
            io.emit('newMessage', {
                id: result.lastID,
                content: data.text,
                sender: data.sender,
                type: data.type || 'text'
            });
        });

        socket.on('disconnect', () => {
            console.log('کاربر قطع شد:', socket.id);
        });
    });

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log('سرور چت روی پورت ' + PORT + ' اجرا شد');
    });
}

main().catch(console.error);
