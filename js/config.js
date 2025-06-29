// Wellington Wind Visualizer Configuration

const CONFIG = {
  // Major North and South Island cities
  SITES: [
    // North Island
    { name: "Whangārei", lat: -35.7251, lon: 174.3237 },
    { name: "Auckland", lat: -36.8485, lon: 174.7633 },
    { name: "Hamilton", lat: -37.7870, lon: 175.2793 },
    { name: "Tauranga", lat: -37.6878, lon: 176.1651 },
    { name: "Rotorua", lat: -38.1368, lon: 176.2497 },
    { name: "Taupo", lat: -38.7873, lon: 175.2793 },
    { name: "Gisborne", lat: -38.6623, lon: 178.0176 },
    { name: "New Plymouth", lat: -39.0556, lon: 174.0752 },
    { name: "Napier", lat: -39.4928, lon: 176.9120 },
    { name: "Palmerston North", lat: -40.3523, lon: 175.6082 },
    { name: "Whanganui", lat: -39.9301, lon: 175.0502 },
    { name: "Wellington", lat: -41.2866, lon: 174.7756 },
    // South Island
    { name: "Nelson", lat: -41.2706, lon: 173.2840 },
    { name: "Blenheim", lat: -41.5134, lon: 173.9612 },
    { name: "Westport", lat: -41.7545, lon: 171.6017 },
    { name: "Kaikoura", lat: -42.4000, lon: 173.6833 },
    { name: "Christchurch", lat: -43.5321, lon: 172.6362 },
    { name: "Dunedin", lat: -45.8788, lon: 170.5028 },
    { name: "Invercargill", lat: -46.4132, lon: 168.3538 },
    { name: "Queenstown", lat: -45.0312, lon: 168.6626 },
    { name: "Wanaka", lat: -44.7032, lon: 169.1321 },
    { name: "Timaru", lat: -44.3960, lon: 171.2549 },
    { name: "Oamaru", lat: -45.0970, lon: 170.9707 },
    { name: "Greymouth", lat: -42.4507, lon: 171.2108 },
    { name: "Mt Cook", lat: -43.7350, lon: 170.0967 }
  ],
  
  // Wind speed limits for visualization
  MIN_WIND: 0,
  MAX_WIND: 100, // km/h
  
  // Update frequency in milliseconds (5 minutes = 300000ms)
  UPDATE_INTERVAL: 5 * 60 * 1000,
  
  // Open-Meteo API settings
  API_BASE_URL: 'https://api.open-meteo.com/v1/forecast',
  API_PARAMS: {
    current: 'wind_speed_10m,wind_direction_10m,temperature_2m',
    wind_speed_unit: 'kmh',
    timezone: 'auto'
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
} 