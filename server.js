<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ورود به پیام‌رسان</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Tahoma, sans-serif; height: 100vh; display: flex; justify-content: center; align-items: center; background: #0f172a; }
        .login-box { width: 90%; max-width: 400px; background: rgba(30, 41, 59, 0.85); backdrop-filter: blur(10px); padding: 30px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.6); text-align: center; color: white; border: 1px solid rgba(255,255,255,0.1); }
        .login-box h2 { margin-bottom: 20px; font-size: 22px; }
        .login-box input { width: 100%; padding: 12px; margin-bottom: 15px; border: none; border-radius: 8px; background: rgba(15, 23, 42, 0.8); color: white; font-size: 14px; outline: none; border: 1px solid rgba(255,255,255,0.1); }
        .login-box button { width: 100%; padding: 12px; border: none; border-radius: 8px; background: #2563eb; color: white; font-size: 16px; cursor: pointer; font-weight: bold; margin-top: 10px; }
        .login-box button:hover { background: #1d4ed8; }
        .error-msg { color: #ef4444; font-size: 13px; margin-top: 10px; display: none; }
        .chat-wrapper { display: none; width: 100%; height: 100vh; justify-content: center; align-items: center; }
        .chat-container { width: 100%; max-width: 450px; height: 90vh; background-image: url('https://images.pexels.com/photos/30596223/pexels-photo-30596223.jpeg?auto=compress&cs=tinysrgb&w=1920'); background-size: cover; background-position: center; border-radius: 16px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.6); position: relative; }
        .chat-container::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.55); z-index: 0; }
        .chat-header { background: rgba(37, 99, 235, 0.9); color: white; padding: 16px; font-size: 18px; font-weight: bold; text-align: center; position: relative; z-index: 1; }
        .chat-messages { flex: 1; padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; position: relative; z-index: 1; }
        .message { max-width: 75%; padding: 10px 14px; border-radius: 12px; font-size: 14px; line-height: 1.5; word-wrap: break-word; }
        .message.me { background: #2563eb; color: white; align-self: flex-start; border-bottom-right-radius: 4px; }
        .message.other { background: rgba(51, 65, 85, 0.9); color: #e2e8f0; align-self: flex-end; border-bottom-left-radius: 4px; }
        .message .sender-name { font-size: 11px; opacity: 0.8; margin-bottom: 4px; display: block; }
        .message audio { width: 100%; margin-top: 5px; }
        .chat-input { display: flex; padding: 12px; background: rgba(15, 23, 42, 0.8); gap: 8px; position: relative; z-index: 1; }
        .chat-input input { flex: 1; padding: 12px; border: none; border-radius: 24px; background: rgba(30, 41, 59, 0.9); color: white; font-size: 14px; outline: none; }
        .chat-input button { padding: 12px 20px; border: none; border-radius: 24px; background: #2563eb; color: white; font-size: 14px; cursor: pointer; font-weight: bold; }
        .chat-input button:hover { background: #1d4ed8; }
        .mic-btn { background: #10b981; font-size: 16px; }
        .mic-btn.recording { background: #ef4444; animation: pulse 1s infinite; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
    </style>
</head>
<body>

    <div class="login-box" id="loginBox">
        <h2>🔐 ورود به پیام‌رسان</h2>
        <input type="text" id="username" placeholder="نام کاربری شما" />
        <input type="password" id="password" placeholder="رمز عبور" />
        <button onclick="login()">ورود</button>
        <div class="error-msg" id="errorMsg">رمز عبور اشتباه است!</div>
    </div>

    <div class="chat-wrapper" id="chatWrapper">
        <div class="chat-container">
            <div class="chat-header" id="chatHeader">💬 پیام‌رسان من</div>
            <div class="chat-messages" id="messages"></div>
            <div class="chat-input">
                <input type="text" id="messageInput" placeholder="پیام خود را بنویسید..." />
                <button onclick="sendMessage()">ارسال</button>
                <button class="mic-btn" id="micBtn" onclick="toggleRecording()">🎤</button>
            </div>
        </div>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        let socket;
        let currentUser = '';
        let mediaRecorder;
        let audioChunks = [];
        let isRecording = false;
        
        const messagesDiv = document.getElementById('messages');
        const input = document.getElementById('messageInput');
        const chatHeader = document.getElementById('chatHeader');
        const micBtn = document.getElementById('micBtn');

        function login() {
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            const errorMsg = document.getElementById('errorMsg');

            if (!username) {
                errorMsg.textContent = "لطفاً نام کاربری را وارد کنید.";
                errorMsg.style.display = 'block';
                return;
            }

            socket = io();
            
            socket.emit('checkPassword', password, (response) => {
                if (response.success) {
                    currentUser = username;
                    document.getElementById('loginBox').style.display = 'none';
                    document.getElementById('chatWrapper').style.display = 'flex';
                    chatHeader.textContent = '💬 ' + username;
                    startChat();
                } else {
                    errorMsg.textContent = "رمز عبور اشتباه است!";
                    errorMsg.style.display = 'block';
                    socket.disconnect();
                    socket = null;
                }
            });
        }

        function startChat() {
            socket.emit('getMessages');

            socket.on('previousMessages', (msgs) => {
                msgs.forEach(msg => {
                    const type = msg.sender === currentUser ? 'me' : 'other';
                    if (msg.type === 'audio') {
                        addAudioMessage(msg.content, type, msg.sender);
                    } else {
                        addMessage(msg.content, type, msg.sender);
                    }
                });
            });

            socket.on('newMessage', (msg) => {
                const type = msg.sender === currentUser ? 'me' : 'other';
                if (msg.type === 'audio') {
                    addAudioMessage(msg.content, type, msg.sender);
                } else {
                    addMessage(msg.content, type, msg.sender);
                }
            });
        }

        function addMessage(text, type, sender) {
            const div = document.createElement('div');
            div.className = 'message ' + type;
            const nameSpan = document.createElement('span');
            nameSpan.className = 'sender-name';
            nameSpan.textContent = sender || 'ناشناس';
            const textNode = document.createTextNode(text);
            div.appendChild(nameSpan);
            div.appendChild(textNode);
            messagesDiv.appendChild(div);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        function addAudioMessage(base64Audio, type, sender) {
            const div = document.createElement('div');
            div.className = 'message ' + type;
            const nameSpan = document.createElement('span');
            nameSpan.className = 'sender-name';
            nameSpan.textContent = sender || 'ناشناس';
            const audio = document.createElement('audio');
            audio.controls = true;
            audio.src = base64Audio;
            div.appendChild(nameSpan);
            div.appendChild(audio);
            messagesDiv.appendChild(div);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        function sendMessage() {
            const text = input.value.trim();
            if (!text) return;
            socket.emit('sendMessage', { text: text, sender: currentUser, type: 'text' });
            input.value = '';
        }

        async function toggleRecording() {
            if (isRecording) {
                stopRecording();
                return;
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];

                mediaRecorder.ondataavailable = (event) => {
                    audioChunks.push(event.data);
                };

                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64Audio = reader.result;
                        socket.emit('sendMessage', { text: base64Audio, sender: currentUser, type: 'audio' });
                    };
                    reader.readAsDataURL(audioBlob);
                    stream.getTracks().forEach(track => track.stop());
                };

                mediaRecorder.start();
                isRecording = true;
                micBtn.classList.add('recording');
                micBtn.textContent = '⏹️';

            } catch (err) {
                alert('دسترسی به میکروفون داده نشد!');
            }
        }

        function stopRecording() {
            if (mediaRecorder && isRecording) {
                mediaRecorder.stop();
                isRecording = false;
                micBtn.classList.remove('recording');
                micBtn.textContent = '🎤';
            }
        }

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    </script>
</body>
</html>
