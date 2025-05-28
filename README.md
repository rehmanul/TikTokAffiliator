# TikTok Affiliate Bot

An automated tool for managing TikTok Shop affiliate invitations with human-like behavior.

## Features

- Automated login and session management
- Creator filtering by followers count and categories
- Automated affiliate invitation sending
- Rate limiting and human-like delays
- Activity logging and monitoring
- Web dashboard for configuration and monitoring

## Prerequisites

- Node.js 16+ 
- npm or yarn
- Chrome/Chromium browser

## Installation

1. Clone the repository:
```bash
git clone https://github.com/rehmanul/TikTok-Affiliate-Bot.git
cd TikTok-Affiliate-Bot
```

2. Install dependencies:
```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

3. Copy `.env.example` to `.env` and update values:
```env
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173
TIKTOK_EMAIL=your-email
TIKTOK_PASSWORD=your-password
GOOGLE_API_KEY=your-google-api-key
```

`GOOGLE_API_KEY` is required for AI content generation features.

## Usage

1. Start the development servers:

```bash
# Start backend server from the project root
npm run dev

# In another terminal, start the frontend
cd client
npm run dev
```

2. Open http://localhost:5173 in your browser

3. Log in with your TikTok Shop credentials

4. Configure the bot settings in the dashboard

5. Start the bot and monitor its progress

## Configuration

The bot can be configured through the web dashboard or by editing the config file:

- `minFollowers`: Minimum follower count for creators
- `maxFollowers`: Maximum follower count for creators
- `categories`: Array of creator categories to target
- `invitationLimit`: Maximum number of invitations per session
- `actionDelay`: Delay between actions (ms)
- `maxDailyInvites`: Maximum invitations per day

## Running Tests

1. Install dependencies:
```bash
npm install
```

2. Run the test suite:
```bash
npm test
```


## Production

Use the compiled server in production:

```bash
npm run build
npm install -g pm2
pm2 start dist/index.js --name tiktok-affiliator
```

See [PRODUCTION.md](PRODUCTION.md) for the full deployment guide.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This tool is for educational purposes only. Use at your own risk and ensure compliance with TikTok's terms of service.
