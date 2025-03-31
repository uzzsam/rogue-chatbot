# Rogue Chatbot

A simple chatbot that uses the Grok API, deployed on Vercel, with a Wix frontend.

## Features

- Integrates with the Grok API for natural language processing
- Backend deployed on Vercel as serverless functions
- Frontend implemented using Wix SDK

## Setup

### Backend (Vercel)

1. Clone this repository
2. Install dependencies: `npm install`
3. Set up environment variables in Vercel:
   - `GROK_API_KEY`: Your Grok API key
4. Deploy to Vercel

### Frontend (Wix)

1. Import the provided JavaScript code into your Wix site
2. Update the API endpoint URL to point to your Vercel deployment
3. Connect the code to your Wix UI elements

## Development

- `npm run dev`: Run the development server locally
- `npm run build`: Build the project for production
