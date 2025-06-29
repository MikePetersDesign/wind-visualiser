// Configuration file for Wellington Wind Map
// Add your API keys here to get live weather data

const CONFIG = {
  // WeatherAPI.com - Get a free API key at https://www.weatherapi.com/
  // Free tier includes 1 million calls per month
  weatherApiKey: 'YOUR_WEATHERAPI_KEY_HERE',
  
  // OpenWeatherMap - Get a free API key at https://openweathermap.org/api
  // Free tier includes 60 calls per minute
  openWeatherApiKey: 'YOUR_OPENWEATHERMAP_KEY_HERE',
  
  // Update frequency in milliseconds (5 minutes = 300000ms)
  updateInterval: 5 * 60 * 1000,
  
  // Cache duration in milliseconds (5 minutes = 300000ms)
  cacheDuration: 5 * 60 * 1000,
  
  // Enable/disable different data sources
  dataSources: {
    gwrc: true,           // Greater Wellington Regional Council - BEST for Wellington
    openMeteo: true,      // Free, no API key required - Good global coverage
    weatherApi: false,    // Requires API key - 1M calls/month free
    openWeatherMap: false, // Requires API key - 60 calls/minute free
    metService: true,     // Limited availability
    noaa: false          // US-focused, limited global data
  }
};

// Export for use in main.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
} 