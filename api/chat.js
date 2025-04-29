// Vercel serverless function for Grok API integration v1
const axios = require('axios');

// Default Grok API URL
const GROK_API_URL = process.env.GROK_API_URL || 'https://api.grok.ai/v1';
const GROK_API_KEY = process.env.GROK_API_KEY;

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if API key is configured
    if (!GROK_API_KEY) {
      return res.status(500).json({ error: 'Grok API key not configured' });
    }

    const { message } = req.body;

    // Validate request
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Call Grok API
    const response = await axios.post(
      `${GROK_API_URL}/chat/completions`,
      {
        model: 'grok-1',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROK_API_KEY}`
        }
      }
    );

    // Extract the assistant's response
    const assistantResponse = response.data.choices[0].message.content;

    // Return the response
    return res.status(200).json({ response: assistantResponse });
  } catch (error) {
    console.error('Error calling Grok API:', error.response?.data || error.message);
    
    // Return appropriate error response
    return res.status(500).json({
      error: 'Error processing your request',
      details: error.response?.data?.error?.message || error.message
    });
  }
};
