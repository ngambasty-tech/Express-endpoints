import fetch from 'node-fetch';

const AUTH_URL = 'http://localhost:3000';
const CHAT_URL = 'http://localhost:3001';

const TEST_USER = {
    email: 'basty@example.com', // Assuming this user exists from previous steps
    password: 'securepassword123'
};

async function testChatFlow() {
    try {
        // 1. Login to get token
        console.log('Logging in...');
        const loginRes = await fetch(`${AUTH_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(TEST_USER)
        });

        if (loginRes.status !== 200) {
            throw new Error(`Login failed: ${loginRes.status}`);
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Login successful, token received.');

        // 2. Start a new chat
        console.log('\nStarting new chat...');
        const chatRes = await fetch(`${CHAT_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ message: 'Hello, who are you?' })
        });

        const chatData = await chatRes.json();
        console.log('Chat Response:', chatData);
        const chatId = chatData.chat_id;

        // 3. Continue chat
        console.log(`\nContinuing chat (ID: ${chatId})...`);
        const chatRes2 = await fetch(`${CHAT_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                message: 'Tell me a fun fact about space.',
                chat_id: chatId
            })
        });
        const chatData2 = await chatRes2.json();
        console.log('Chat Response 2:', chatData2);

        // 4. Retrieve History
        console.log('\nRetrieving chat history...');
        const historyRes = await fetch(`${CHAT_URL}/chats/${chatId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const historyData = await historyRes.json();
        console.log(`History length: ${historyData.length} messages`);
        console.log('History:', historyData);

    } catch (error) {
        console.error('Test Failed:', error);
    }
}

testChatFlow();
