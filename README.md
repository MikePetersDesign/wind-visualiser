# Wind-Visualiser-05

A real-time wind visualization application for the Wellington region using the Open-Meteo API. This application displays current wind conditions across multiple locations in the Wellington region with beautiful, interactive wind direction arrows and speed indicators.

## 🌤️ Features

- **Real-time Wind Data**: Live wind speed and direction from Open-Meteo API
- **Multiple Locations**: 8 locations across the Wellington region
- **Interactive Visualization**: Rotating wind arrows showing wind direction
- **Speed Indicators**: Color-coded wind speed bars
- **Auto-updating**: Refreshes every 5 minutes
- **Responsive Design**: Works on desktop and mobile devices
- **No API Keys Required**: Completely free to use

## 📍 Locations Covered

- **Wellington CBD**: -41.2866, 174.7756
- **Wellington Airport**: -41.3272, 174.8053
- **Lower Hutt**: -41.2167, 174.9333
- **Upper Hutt**: -41.1333, 175.0667
- **Porirua**: -41.1333, 174.8500
- **Kapiti Coast**: -40.8667, 174.9167
- **Wairarapa**: -41.0000, 175.5000
- **Castlepoint**: -40.9000, 176.2167

## 🚀 Quick Start

1. **Clone or download** this repository
2. **Open `index.html`** in your web browser
3. **Enjoy real-time wind data** from across the Wellington region!

No installation or setup required - just open the HTML file and it will start fetching live wind data immediately.

## 📁 Project Structure

```
Wind-Visualiser-05/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # All styling
├── js/
│   ├── config.js           # Configuration and settings
│   └── app.js              # Main application logic
├── docs/
│   ├── API_SETUP.md        # API setup guide
│   └── OPEN_METEO_GUIDE.md # Open-Meteo documentation
├── assets/                 # Images and other assets
├── README.md               # This file
├── package.json            # Project metadata
└── .gitignore             # Git ignore file
```

## 🔧 Configuration

All settings are in `js/config.js`:

- **Locations**: Add or modify Wellington region locations
- **Update Interval**: Change how often data refreshes (default: 5 minutes)
- **Wind Speed Limits**: Adjust visualization ranges
- **API Settings**: Open-Meteo API configuration

## 🌍 API Information

This application uses the **Open-Meteo API**, which provides:

- **Free Service**: No API key required
- **Global Coverage**: Works anywhere on Earth
- **High Resolution**: 11km grid system
- **Real-time Data**: Updates every 10-15 minutes
- **Rate Limits**: 10,000 calls per day (more than sufficient)

## 🎨 Customization

### Adding New Locations

Edit `js/config.js` and add new locations to the `SITES` array:

```javascript
{ name: "Your Location", lat: -41.1234, lon: 174.5678 }
```

### Changing Update Frequency

Modify `UPDATE_INTERVAL` in `js/config.js`:

```javascript
UPDATE_INTERVAL: 2 * 60 * 1000, // 2 minutes
```

### Styling Changes

Edit `css/styles.css` to customize colors, layout, and appearance.

## 🛠️ Development

### Local Development

1. **Clone the repository**
2. **Open `index.html`** in your browser
3. **Open browser console** (F12) to see API calls and debugging info
4. **Edit files** and refresh to see changes

### Browser Compatibility

- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers

## 📊 Data Sources

- **Primary**: Open-Meteo API (free, no key required)
- **Coverage**: Global grid-based weather data
- **Accuracy**: 11km resolution, suitable for regional weather
- **Update Frequency**: Every 10-15 minutes from source

## 🔍 Troubleshooting

### No Data Showing
1. Check internet connection
2. Open browser console (F12) for error messages
3. Verify Open-Meteo API is accessible
4. Check if locations are too close together (should be >11km apart)

### Same Data for All Locations
- Locations may be in the same Open-Meteo grid cell
- Ensure locations are spread across different grid cells
- Check coordinates in `js/config.js`

### Performance Issues
- Reduce update frequency in `js/config.js`
- Check browser console for excessive API calls
- Consider caching data locally

## 📈 Future Enhancements

- [ ] Historical wind data visualization
- [ ] Wind gust information
- [ ] Weather alerts and warnings
- [ ] More detailed weather parameters
- [ ] Interactive map interface
- [ ] Data export functionality
- [ ] Mobile app version

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- **Open-Meteo** for providing free weather data
- **Wellington region** for being such a windy place
- **Open source community** for inspiration and tools

## 📞 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Review the documentation in the `docs/` folder
3. Open an issue on GitHub
4. Check browser console for error messages

---

**Made with ❤️ for Wellington's wind enthusiasts** 