// Wix Frontend Code for Rogue Chatbot

// Replace this URL with your actual Vercel deployment URL
const VERCEL_API_URL = 'https://rogue-chatbot.vercel.app/api/chat';

import wixAnimations from 'wix-animations';
import wixWindow from 'wix-window';
import wixFetch from 'wix-fetch';

$w.onReady(function () {
   // Enter key listener for input
   $w('#userInput').onKeyPress((event) => {
       if (event.key === 'Enter') {
           handleMessage();
       }
   });

   // Initially hide streaming video
   $w('#streamingVideo').hide();
});

// Function to send message to Vercel API
async function sendMessage(message) {
    try {
        const response = await wixFetch.fetch(VERCEL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error communicating with chatbot');
        }

        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('Error sending message to Vercel API:', error);
        throw error;
    }
}

async function handleMessage() {
   const userInput = $w('#userInput');
   const userText = $w('#userText');
   const botText = $w('#botText');
   const streamingVideo = $w('#streamingVideo');

   const message = userInput.value.trim();
   if (!message) return;

   // Display user message
   userText.text = message;
   userInput.value = '';

   // Show streaming video and "Thinking..." message
   botText.text = 'Thinking...';
   streamingVideo.show();

   try {
       const botResponse = await sendMessage(message);

       // Hide streaming video and show response
       streamingVideo.hide();
       botText.text = botResponse;

       // Animate response
       wixAnimations.timeline()
           .add(botText, { opacity: 0, duration: 100 })
           .add(botText, { opacity: 1, duration: 300 })
           .play();

       // Scroll to the scroll2 element with animation
       wixWindow.scrollTo($w('#scroll2'), { scrollAnimation: true });

   } catch (error) {
       console.error('Error in frontend:', error);
       streamingVideo.hide();
       botText.text = 'Sorry, something went wrong. Please try again.';
   }
}

// Button click handler
export function sendButton_click(event) {
   handleMessage();
}
