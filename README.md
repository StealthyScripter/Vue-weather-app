# Vue Weather App

A modern, feature-rich weather application built with Vue 3, TypeScript, and Pinia that provides detailed weather information, forecasts, and interactive map features.

![Vue Weather App Logo](src/assets/logo.svg)

## Features

### Current Weather Display
- Real-time weather conditions
- Temperature, feels-like, and other meteorological data
- Visual weather indicators with appropriate icons
- Wind speed and direction information

### Forecast Features
- 24-hour hourly forecast
- 7-day weather forecast
- Detailed daily temperature charts
- Precipitation probability visualization

### Interactive Weather Map
- Weather visualization on interactive maps
- Location-based weather information
- Navigation planning with weather forecasts
- Time-based forecasts along travel routes

### User Experience
- Responsive design for all devices
- Light/dark mode support
- Temperature unit switching (°C/°F)
- Search functionality for global locations
- Recent and favorite locations

## Tech Stack

- **Vue 3**: Frontend framework with Composition API
- **TypeScript**: Type-safe JavaScript
- **Pinia**: State management
- **Vue Router**: Navigation and routing
- **Mapbox GL JS**: Interactive mapping
- **Chart.js**: Data visualization
- **Open-Meteo API**: Weather data source
- **Vite**: Build tool and development server
- **Vitest**: Testing framework

## Project Structure

```
vue-weather-app/
├── public/                 # Static files
├── src/
│   ├── assets/             # Images, fonts, and global CSS
│   │   ├── icons/          # UI and weather icons
│   │   ├── mapStyles.css   # Map-specific styling
│   ├── components/
│   │   ├── layout/         # App layout components
│   │   ├── ui/             # Reusable UI components
│   │   ├── weather/        # Weather-specific components
│   ├── router/             # Vue Router configuration
│   ├── services/           # API services
│   │   ├── weatherApi.ts   # Weather API client
│   │   ├── geocodingService.ts # Geocoding utilities
│   ├── stores/             # Pinia state stores
│   │   ├── weather.ts      # Weather data store
│   │   ├── settings.ts     # User preferences store
│   │   ├── config.ts       # App configuration store
│   ├── utils/              # Utility functions
│   ├── views/              # Page components
│   ├── App.vue             # Root component
│   ├── main.ts             # Application entry point
├── tests/                  # Test files
├── .env.example            # Example environment variables
├── .gitignore              # Git ignore file
├── index.html              # HTML entry point
├── package.json            # Project dependencies
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite configuration
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/StealthyScripter/Open-Mateo-Weather-app.git
cd vue-weather-app
```

2. Install dependencies:
```bash
npm install
# OR
yarn install
```

3. Set up environment variables:
   - Save your mapbox token in a new file called `.env`
   - Add your API keys (Mapbox)

```
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

4. Start the development server:
```bash
npm run dev
# OR
yarn dev
```

5. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
# OR
yarn build
```

The built files will be in the `dist` directory.

## Environment Setup

This project uses environment variables to store API keys and other sensitive information. Follow these steps to set up your environment:

1. Save your mapboxToken a new file called `.env`
2. Fill in your Mapbox API token in `.env`
3. Never commit your `.env` file to the repository

Example:
```
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

## API Configuration

### Weather API

The application uses Open-Meteo API for weather data. This API is free to use and does not require authentication.

### Mapbox API

For mapping features, the app uses Mapbox. You need to:
1. Create a Mapbox account at https://www.mapbox.com/
2. Generate an access token
3. Add the token to your `.env` file

## State Management with Pinia

The app uses Pinia for state management with the following stores:

- **Weather Store**: Manages weather data and requests
- **Settings Store**: Handles user preferences
- **Config Store**: Stores API configurations and tokens

Example of accessing the config store:

```typescript
import { useConfigStore } from '@/stores/config'

const configStore = useConfigStore()
const mapboxToken = configStore.mapboxToken
```

## Weather Map Feature

The Weather Map feature integrates geographic map visualization with weather data:

### Features
- Current weather display on an interactive map
- Route planning between locations
- Time-based weather forecasting along routes
- Detailed weather popups

### Components
- `WeatherMap.vue`: Main mapping component
- `WeatherPopup.vue`: Detailed weather information display
- `RouteWeather.vue`: Time-based forecasting controls

### Usage
1. Navigate to the "Map View" tab
2. Click "Start Navigation" to enter route planning mode
3. Enter starting and destination locations
4. Use the time slider to see forecasted weather along your journey

## Testing

The project uses Vitest for unit testing.

Run tests with:
```bash
npm run test
# OR
yarn test
```

## Deployment

This app can be deployed to any static hosting service:

1. Build the project:
```bash
npm run build
```

2. Deploy the contents of the `dist` directory to your hosting provider.

Popular hosting options:
- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront

## Contributing

1. Fork the repository
2. Create a feature branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Commit your changes:
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. Push to the branch:
   ```bash
   git push origin feature/amazing-feature
   ```
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Weather data provided by [Open-Meteo](https://open-meteo.com/)
- Mapping functionality powered by [Mapbox](https://www.mapbox.com/)
- Icons from [Font Awesome](https://fontawesome.com/)

## Contact

Brian Koringo - koringo.w.brian@gmail.com

Project Link: [https://github.com/StealthyScripter/Open-Mateo-Weather-app](https://github.com/StealthyScripter/Open-Mateo-Weather-app)