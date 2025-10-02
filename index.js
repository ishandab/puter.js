<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Claude AI Chatbot</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://js.puter.com/v2/"></script>
    <style>
        body { background: linear-gradient(to bottom, #1a202c, #2d3748); }
        .chat-bubble { max-width: 75%; border-radius: 12px; padding: 12px; margin: 8px 0; }
        .user-bubble { background: #4a90e2; color: white; margin-left: auto; }
        .ai-bubble { background: #2d3748; color: white; }
        #chat-container { max-height: 60vh; overflow-y: auto; }
        #loading { display: none; }
        #sign-in-container { display: none; }
    </style>
</head>
<body class="min-h-screen flex items-center justify-center text-gray-100">
    <div class="w-full max-w-2xl p-6">
        <h1 class="text-3xl font-bold text-center mb-6">Claude AI Chatbot</h1>
        <div id="sign-in-container" class="text-center mb-4">
            <p class="text-red-400 mb-2">Please sign in to Puter.com to use AI features.</p>
            <button id="sign-in-btn" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg">Sign In to Puter</button>
        </div>
        <div id="chat-container" class="bg-gray-800 rounded-lg p-4 mb-4">
            <div id="chat-messages"></div>
            <div id="loading" class="text-center text-gray-400">Loading...</div>
        </div>
        <div class="flex gap-2">
            <input id="prompt" type="text" placeholder="Ask Claude anything..." 
                   class="flex-1 p-3 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <button id="send" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">Send</button>
        </div>
        <p class="text-center text-gray-400 mt-4">Powered by <a href="https://puter.com" target="_blank" class="underline">Puter.js</a> & Claude 3.5 Sonnet</p>
    </div>
    <script>
        let chatHistory = [];
        let isSignedIn = false;

        // Check if Puter.js loaded correctly
        if (!window.puter) {
            console.error('Puter.js failed to load. Check network or CDN.');
            document.getElementById('chat-messages').innerHTML = '<p class="text-red-400">Error: Puter.js not loaded. Try refreshing or checking your network.</p>';
        }

        // Check authentication status
        async function checkAuth() {
            try {
                const user = await puter.getUser(); // Updated to correct method
                console.log('User:', user);
                isSignedIn = !!user;
                document.getElementById('sign-in-container').style.display = isSignedIn ? 'none' : 'block';
                document.getElementById('send').disabled = !isSignedIn;
                document.getElementById('prompt').disabled = !isSignedIn;
                if (isSignedIn) {
                    displayMessage('system', `Signed in as ${user.email || 'user'}`);
                    loadHistory();
                } else {
                    displayMessage('system', 'Please sign in to Puter.com to start chatting.');
                }
            } catch (error) {
                console.error('Auth error:', error);
                displayMessage('system', `Auth check failed: ${error.message}. Click "Sign In to Puter".`);
            }
        }

        // Sign in handler
        document.getElementById('sign-in-btn').addEventListener('click', async () => {
            try {
                const user = await puter.auth.signIn();
                console.log('Sign-in response:', user);
                if (user) {
                    isSignedIn = true;
                    document.getElementById('sign-in-container').style.display = 'none';
                    document.getElementById('send').disabled = false;
                    document.getElementById('prompt').disabled = false;
                    displayMessage('system', 'Signed in successfully!');
                    loadHistory();
                }
            } catch (error) {
                console.error('Sign-in error:', error);
                displayMessage('system', `Sign-in error: ${error.message}. Try again.`);
            }
        });

        // Load chat history from Puter cloud
        async function loadHistory() {
            try {
                const saved = await puter.kv.get('chatHistory');
                if (saved) {
                    chatHistory = JSON.parse(saved);
                    chatHistory.forEach(msg => displayMessage(msg.role, msg.content));
                }
            } catch (error) {
                console.error('History load error:', error);
                displayMessage('system', `Error loading history: ${error.message}.`);
            }
        }

        // Display a message in the chat
        function displayMessage(role, content) {
            const chatMessages = document.getElementById('chat-messages');
            const bubbleClass = role === 'user' ? 'user-bubble' : (role === 'assistant' ? 'ai-bubble' : 'bg-red-500 text-white');
            const alignClass = role === 'user' ? 'text-right' : 'text-left';
            const sender = role === 'user' ? 'You' : (role === 'assistant' ? 'Claude' : 'System');
            const div = document.createElement('div');
            div.className = `chat-bubble ${bubbleClass} ${alignClass}`;
            div.innerHTML = `<strong>${sender}:</strong> ${content}`;
            chatMessages.appendChild(div);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        // Handle sending a message
        async function sendMessage() {
            if (!isSignedIn) {
                displayMessage('system', 'Please sign in first.');
                return;
            }
            const input = document.getElementById('prompt');
            const query = input.value.trim();
            if (!query) return;
            input.value = '';
            displayMessage('user', query);
            document.getElementById('loading').style.display = 'block';

            try {
                chatHistory.push({ role: 'user', content: query });
                const response = await puter.ai.chat(query, { 
                    model: 'claude-3-5-sonnet-latest',  // Correct model
                    testMode: false  // Set to true for testing
                });
                console.log('AI response:', response);
                const aiReply = response.message.content[0]?.text || response.message.content || 'No response content';
                chatHistory.push({ role: 'assistant', content: aiReply });
                await puter.kv.set('chatHistory', JSON.stringify(chatHistory));
                displayMessage('assistant', aiReply);
            } catch (error) {
                console.error('Chat error:', error);
                displayMessage('system', `Error: ${error.message || 'API call failed. Check console or try again.'}`);
            } finally {
                document.getElementById('loading').style.display = 'none';
            }
        }

        // Initialize
        document.getElementById('send').addEventListener('click', sendMessage);
        document.getElementById('prompt').addEventListener('keypress', e => {
            if (e.key === 'Enter') sendMessage();
        });
        checkAuth();
    </script>
</body>
</html>
