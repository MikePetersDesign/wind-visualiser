# Weather API Setup Guide

This guide will help you connect to reliable and free weather APIs for your Wellington Wind Visualizer.

## 🚀 Quick Start (Recommended)

### 1. Open-Meteo (No API Key Required!)
**This is already working in your app!** Open-Meteo is completely free and doesn't require any setup.

- ✅ No API key needed
- ✅ 10,000 calls per day
- ✅ Global coverage
- ✅ Current weather, forecasts, historical data

Your app is already configured to use this API. Just run your application and it will fetch live wind data automatically!

## 🔑 Optional: Get API Keys for Enhanced Data

### 2. WeatherAPI.com (1 Million Calls/Month Free)

1. **Sign up**: Go to https://www.weatherapi.com/
2. **Create account**: Free registration
3. **Get API key**: Copy your free API key
4. **Update config.js**:
   ```javascript
   weatherApiKey: 'YOUR_ACTUAL_API_KEY_HERE',
   dataSources: {
     weatherApi: true,  // Enable this source
   }
   ```

### 3. OpenWeatherMap (60 Calls/Minute Free)

1. **Sign up**: Go to https://openweathermap.org/api
2. **Create account**: Free registration
3. **Get API key**: Copy your free API key
4. **Update config.js**:
   ```javascript
   openWeatherApiKey: 'YOUR_ACTUAL_API_KEY_HERE',
   dataSources: {
     openWeatherMap: true,  // Enable this source
   }
   ```

## 📊 API Comparison

| API | Cost | Rate Limit | Setup | Data Quality |
|-----|------|------------|-------|--------------|
| **Open-Meteo** | Free | 10K/day | None | Excellent |
| WeatherAPI.com | Free | 1M/month | API Key | Very Good |
| OpenWeatherMap | Free | 60/min | API Key | Good |

## 🔧 Configuration Options

### Enable Multiple Sources
Your app can use multiple APIs simultaneously for better reliability:

```javascript
dataSources: {
  openMeteo: true,      // Primary source (no key needed)
  weatherApi: true,     // Backup source (requires key)
  openWeatherMap: true, // Additional backup (requires key)
}
```

### Adjust Update Frequency
```javascript
// Update every 2 minutes (120,000ms)
updateInterval: 2 * 60 * 1000,

// Update every 10 minutes (600,000ms)
updateInterval: 10 * 60 * 1000,
```

### Cache Settings
```javascript
// Cache data for 10 minutes
cacheDuration: 10 * 60 * 1000,
```

## 🌍 Data Coverage

### Open-Meteo Coverage
- **Global**: All countries and regions
- **Wellington**: Excellent coverage
- **Update Frequency**: Every 10-15 minutes
- **Data Types**: Current weather, forecasts, historical

### WeatherAPI.com Coverage
- **Global**: 200+ countries
- **Wellington**: Excellent coverage
- **Update Frequency**: Every 10 minutes
- **Data Types**: Current weather, forecasts, astronomy

### OpenWeatherMap Coverage
- **Global**: Worldwide coverage
- **Wellington**: Good coverage
- **Update Frequency**: Every 10 minutes
- **Data Types**: Current weather, forecasts, air quality

## 🚨 Rate Limits & Best Practices

### Open-Meteo
- **Limit**: 10,000 calls per day
- **Best Practice**: Update every 5-10 minutes
- **Your Usage**: ~288 calls/day (5-min updates) ✅ Safe

### WeatherAPI.com
- **Limit**: 1,000,000 calls per month
- **Best Practice**: Update every 5-10 minutes
- **Your Usage**: ~8,640 calls/month (5-min updates) ✅ Safe

### OpenWeatherMap
- **Limit**: 60 calls per minute
- **Best Practice**: Update every 5-10 minutes
- **Your Usage**: ~12 calls/hour (5-min updates) ✅ Safe

## 🔍 Testing Your Setup

1. **Open your app**: Load `index.html` in a browser
2. **Check status bar**: Should show "Live data: X/Y sensors"
3. **Look for green dots**: Live data sensors appear in green
4. **Check console**: Open browser dev tools to see API responses

## 🛠️ Troubleshooting

### No Live Data Showing
1. Check browser console for errors
2. Verify API keys are correct
3. Check rate limits haven't been exceeded
4. Try refreshing the page

### API Key Issues
1. Ensure keys are copied correctly (no extra spaces)
2. Wait 2 hours for new OpenWeatherMap keys to activate
3. Check account status on API provider website

### Network Issues
1. Check internet connection
2. Try disabling browser extensions
3. Check if your network blocks API calls

## 📈 Performance Tips

1. **Use Open-Meteo as primary**: No setup required, reliable
2. **Add WeatherAPI.com as backup**: Better rate limits
3. **Cache data appropriately**: 5-10 minute cache duration
4. **Monitor usage**: Check API provider dashboards

## 🎯 Recommended Setup

For the best experience with minimal setup:

```javascript
const CONFIG = {
  weatherApiKey: 'YOUR_WEATHERAPI_KEY_HERE',  // Optional
  openWeatherApiKey: 'YOUR_OPENWEATHERMAP_KEY_HERE',  // Optional
  updateInterval: 5 * 60 * 1000,  // 5 minutes
  cacheDuration: 5 * 60 * 1000,   // 5 minutes
  dataSources: {
    openMeteo: true,      // Primary (no key needed)
    weatherApi: true,     // Backup (if you have key)
    openWeatherMap: false, // Disabled unless needed
    metService: true,     // Local data
  }
};
```

This setup will give you reliable live wind data with Open-Meteo as the primary source, and WeatherAPI.com as a backup if you get an API key. 