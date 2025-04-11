document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const toggleTheme = document.getElementById('theme-toggle');
    const body = document.body;

    // API configuration
    const AI_CONFIG = {
        apiKey: 'AIzaSyC0f8QhzNJI24aiU0RvjAsjm0lGGqf1ML0',
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyC0f8QhzNJI24aiU0RvjAsjm0lGGqf1ML0',
        model: 'gemini-2.0-flash'
    };

    let conversationHistory = [];

    // Initialize the conversation
    function initializeConversation() {
        conversationHistory = [
            {
                role: "user",
                parts: [{
                    text: `You're MyMusicBuddi, a chill AI buddy who only talks music. Help me explore tracks, learn about artists, and vibe with genres. 
If I ask for lyrics, reply cleanly — like with headers, and space out verses or wrap them in code blocks. 
Keep it Gen Z-ish (but not too much), call me "Friend", and don’t use many emojis. 
If someone talks about non-music stuff, kindly say you're here only for music. 
Feel free to add reasoning, list sources, and throw in some song facts or backstory.`
                }]
            }
        ];

        addStaticMessage("Yo Friend! I'm your Music Buddi 🤖. Ready to dive into some tracks or spill facts about your favs?", 'ai');
    }

    // Event Listeners
    sendButton.addEventListener('click', handleUserMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleUserMessage();
    });

    // Theme Toggle Functionality
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        body.classList.add(savedTheme);
    } else {
        body.classList.add('light-theme');
    }

    toggleTheme.addEventListener('click', () => {
        body.classList.toggle('dark-theme');
        // Change icon based on theme
        if (body.classList.contains('dark-theme')) {
            toggleTheme.innerHTML = '<i class="fas fa-sun"></i>';
            localStorage.setItem('theme', 'dark-theme');
        } else {
            toggleTheme.innerHTML = '<i class="fas fa-moon"></i>';
            localStorage.setItem('theme', 'light-theme');
        }
    });

    // Handle User Message
    function handleUserMessage() {
        const message = userInput.value.trim();
        if (message === '') return;

        addStaticMessage(message, 'user'); // Show user message
        userInput.value = '';
        disableInput(true);

        const typingIndicator = addTypingIndicator();

        getAIResponse(message)
            .then(response => {
                chatMessages.removeChild(typingIndicator);
                if (response) {
                    typeMessageWithFormat(response, 'ai');
                } else {
                    addStaticMessage('Oops! Something went wrong. Could you try rephrasing?', 'ai');
                }
            })
            .catch(error => {
                chatMessages.removeChild(typingIndicator);
                addStaticMessage('Oops! MyMusicBuddi hit a snag. Wanna try that again?', 'ai');
                console.error('Error getting AI response:', error);
            });
    }

    // Add Static User or AI Message
    function addStaticMessage(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`, 'fade-in');
        const paragraph = document.createElement('p');
        paragraph.innerHTML = message;
        messageElement.appendChild(paragraph);
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Add Typing Indicator
    function addTypingIndicator() {
        const typingElement = document.createElement('div');
        typingElement.classList.add('message', 'ai-message', 'typing-indicator');
        typingElement.innerHTML = '<p>MyMusicBuddi is thinking<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span></p>';
        chatMessages.appendChild(typingElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return typingElement;
    }

    // Get AI response from API
    async function getAIResponse(message) {
        try {
            const requestBody = {
                contents: [],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 800
                }
            };

            if (conversationHistory.length > 0) {
                requestBody.contents = [...conversationHistory];
                if (message !== "Initialize as MyMusicBuddi.") {
                    requestBody.contents.push({ role: "user", parts: [{ text: message }] });
                }
            } else {
                requestBody.contents = [{ role: "user", parts: [{ text: message }] }];
            }

            const response = await fetch(AI_CONFIG.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            const responseText = await response.text();
            const data = JSON.parse(responseText);

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} - ${data.error?.message || 'Unknown error'}`);
            }

            const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

            if (conversationHistory.length === 0) {
                conversationHistory = [
                    { role: "user", parts: [{ text: message }] },
                    { role: "model", parts: [{ text: aiResponse }] }
                ];
            } else {
                if (message !== "Initialize as MyMusicBuddi.") {
                    conversationHistory.push({ role: "user", parts: [{ text: message }] });
                }
                conversationHistory.push({ role: "model", parts: [{ text: aiResponse }] });

                if (conversationHistory.length > 12) {
                    const systemMessage = conversationHistory[0];
                    conversationHistory = [systemMessage, ...conversationHistory.slice(-10)];
                }
            }

            return aiResponse;
        } catch (error) {
            console.error('Error in AI API call:', error);
            return '';
        }
    }

    // Type the AI Message with Delay
    function typeMessageWithFormat(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`, 'fade-in');

        const paragraph = document.createElement('p');
        messageElement.appendChild(paragraph);
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        let currentIndex = 0;
        const formattedMessage = message;

        function typeNextChar() {
            if (currentIndex < formattedMessage.length) {
                paragraph.innerHTML = formattedMessage.slice(0, currentIndex + 1);
                currentIndex++;
                chatMessages.scrollTop = chatMessages.scrollHeight;
                setTimeout(typeNextChar, 10); // Speed per character
            } else {
                disableInput(false);
            }
        }

        typeNextChar();
    }

    // Disable/Enable Input
    function disableInput(disabled) {
        userInput.disabled = disabled;
        sendButton.disabled = disabled;
    }

    initializeConversation();
});
