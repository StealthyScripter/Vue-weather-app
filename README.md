# WeatherRoute AI

Smart Weather Predictions for Route Planning - A full-stack application with React Native frontend and Node.js backend.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm 8+
- Docker (for PostgreSQL database)
- Expo CLI: `npm install -g @expo/cli`
- Git

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd weatherroute-ai
npm run setup
```

### 2. Configure Environment Variables

Create `.env` files in the server directory:

**server/.env**
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp
DB_USER=postgres
DB_PASSWORD=mypassword

# JWT Secrets (generate your own!)
JWT_SECRET=your-super-secret-jwt-key-here
REFRESH_SECRET=your-super-secret-refresh-key-here

# API Keys (get from respective services)
WEATHER_API_KEY=your-openweathermap-api-key
MAPS_API_KEY=your-google-maps-api-key

# App Configuration
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:8081
LOG_LEVEL=INFO
```

### 3. Start Development
```bash
npm run dev
```

This will start:
- 🗄️ PostgreSQL database (Docker)
- 🌐 Backend server at http://localhost:3000
- 📱 React Native/Expo client at http://localhost:8081

## 📱 Testing the App

### Mobile Testing
- **iOS**: Use iOS Simulator or scan QR code with Camera app
- **Android**: Use Android Emulator or scan QR code with Expo Go app
- **Web**: Open http://localhost:8081 in browser

### API Testing
```bash
# Health check
curl http://localhost:3000/health

# Test weather endpoint
curl "http://localhost:3000/api/weather/current?lat=35.3021&lng=-81.3400"
```

## 🛠️ Available Scripts

### Main Commands
| Command | Description |
|---------|-------------|
| `npm run dev` | Start both client and server in development mode |
| `npm run setup` | Full setup: install dependencies + start database |
| `npm run start` | Start both client and server in production mode |
| `npm run health` | Check if services are running |

### Installation & Setup
| Command | Description |
|---------|-------------|
| `npm run install:all` | Install dependencies for client and server |
| `npm run setup:full` | Complete setup with database |
| `npm run setup:quick` | Install dependencies only |
| `npm run fresh-install` | Clean everything and reinstall |

### Database Management
| Command | Description |
|---------|-------------|
| `npm run db:start` | Start PostgreSQL database |
| `npm run db:stop` | Stop PostgreSQL database |
| `npm run db:reset` | Reset database (⚠️ destroys data) |
| `npm run db:logs` | View database logs |
| `npm run db:shell` | Access database shell |

### Client-Specific
| Command | Description |
|---------|-------------|
| `npm run client:android` | Run on Android |
| `npm run client:ios` | Run on iOS |
| `npm run client:web` | Run in browser |
| `npm run client:lint` | Lint client code |

### Maintenance
| Command | Description |
|---------|-------------|
| `npm run clean:all` | Clean all node_modules |
| `npm run logs` | View server logs |

## 🏗️ Project Structure

```
weatherroute-ai/
├── client/                 # React Native (Expo) frontend
│   ├── app/               # App screens and navigation
│   ├── components/        # Reusable UI components
│   ├── services/          # API service layer
│   ├── contexts/          # React contexts
│   └── package.json
├── server/                # Node.js (Express) backend
│   ├── routes/           # API route handlers
│   ├── services/         # Business logic services
│   ├── middleware/       # Express middleware
│   ├── utils/            # Utility functions
│   └── package.json
├── package.json          # Root package.json (this file)
└── README.md
```

## 🔧 Configuration

### API Keys Required

1. **OpenWeatherMap API**
   - Sign up at: https://openweathermap.org/api
   - Add key to `WEATHER_API_KEY` in server/.env

2. **Google Maps API**
   - Enable at: https://console.cloud.google.com/
   - Enable: Directions API, Geocoding API, Places API
   - Add key to `MAPS_API_KEY` in server/.env

### Database Setup

The app uses PostgreSQL running in Docker:

```bash
# Start database
npm run db:start

# View logs
npm run db:logs

# Access database shell
npm run db:shell
```

## 🔒 Environment Variables

### Server Environment Variables
- `JWT_SECRET` - Secret for signing access tokens
- `REFRESH_SECRET` - Secret for signing refresh tokens
- `WEATHER_API_KEY` - OpenWeatherMap API key
- `MAPS_API_KEY` - Google Maps API key
- `DB_*` - Database connection settings

### Security Notes
- Never commit `.env` files to version control
- Use strong, unique secrets for JWT tokens
- Rotate API keys regularly in production

## 🐛 Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
npm run db:start
# Wait 10 seconds, then try again
npm run dev
```

**Port Already in Use**
```bash
# Kill processes on ports
killall -9 node
npx kill-port 3000 8081
```

**Metro Bundle Error (Client)**
```bash
cd client
npx expo start --clear
```

**Dependencies Issues**
```bash
npm run fresh-install
```

### Debug Mode

Enable detailed logging:
```bash
# In server/.env
LOG_LEVEL=DEBUG
NODE_ENV=development
```

### Reset Everything
```bash
npm run clean:all
npm run db:reset
npm run fresh-install
npm run setup
```

## 📚 API Documentation

Once the server is running, visit:
- **API Docs**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/health

### Key Endpoints
- `POST /api/auth/login` - User authentication
- `GET /api/weather/current` - Current weather
- `POST /api/route-weather/predict` - Route weather prediction
- `GET /api/location/search` - Location search

## 🚀 Deployment

### Production Setup
1. Set `NODE_ENV=production` in server/.env
2. Use proper database (not Docker for production)
3. Set up proper secret management
4. Configure reverse proxy (Nginx)
5. Set up SSL certificates

### Build Commands
```bash
# Build client (if applicable)
npm run prod:build

# Start production server
npm run prod:start
```

## 🤝 Development

### Adding New Features
1. Backend: Add routes in `server/routes/`
2. Frontend: Add screens in `client/app/`
3. Update services in respective `services/` folders

### Code Style
- Use ESLint for both client and server
- Follow existing patterns for consistency
- Add proper error handling

### Testing
```bash
# Run linting
npm run client:lint
npm run server:lint

# Test API endpoints
curl http://localhost:3000/api/health
```

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

If you encounter issues:
1. Check this README for troubleshooting steps
2. Ensure all environment variables are set
3. Verify API keys are valid
4. Check database is running
5. Review logs: `npm run logs`

---

**Made with ❤️ using React Native, Node.js, and lots of ☕**