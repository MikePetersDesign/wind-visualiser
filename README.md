# Wind-Visualiser-05

A real-time wind visualization application for New Zealand using the Open-Meteo API. This application displays current wind conditions across 25 major locations throughout New Zealand with beautiful, interactive wind direction arrows, speed indicators, and immersive modal overlays.

## 🌤️ Features

- **Real-time Wind Data**: Live wind speed, direction, and temperature from Open-Meteo API
- **Nationwide Coverage**: 25 locations across New Zealand (North and South Islands)
- **Interactive Visualization**: Rotating wind arrows showing wind direction with color-coded speed indicators
- **Modal Overlays**: Click any location to view detailed wind data in an immersive modal
- **Wave Displacement Effects**: Dynamic text animation in modals that responds to wind speed and direction
- **Historical Playback**: Interactive timeline slider to explore historical wind patterns
- **Auto-updating**: Refreshes every 5 minutes with live data
- **Responsive Design**: Works on desktop and mobile devices
- **No API Keys Required**: Completely free to use
- **Interactive Map**: Pan, zoom, and explore the wind patterns across New Zealand

## 📍 Locations Covered

### North Island
- **Whangārei**: -35.7251, 174.3237
- **Auckland**: -36.8485, 174.7633
- **Hamilton**: -37.7870, 175.2793
- **Tauranga**: -37.6878, 176.1651
- **Rotorua**: -38.1368, 176.2497
- **Taupo**: -38.7873, 175.2793
- **Gisborne**: -38.6623, 178.0176
- **New Plymouth**: -39.0556, 174.0752
- **Napier**: -39.4928, 176.9120
- **Palmerston North**: -40.3523, 175.6082
- **Whanganui**: -39.9301, 175.0502
- **Wellington**: -41.2866, 174.7756

### South Island
- **Nelson**: -41.2706, 173.2840
- **Blenheim**: -41.5134, 173.9612
- **Westport**: -41.7545, 171.6017
- **Kaikoura**: -42.4000, 173.6833
- **Christchurch**: -43.5321, 172.6362
- **Dunedin**: -45.8788, 170.5028
- **Invercargill**: -46.4132, 168.3538
- **Queenstown**: -45.0312, 168.6626
- **Wanaka**: -44.7032, 169.1321
- **Timaru**: -44.3960, 171.2549
- **Oamaru**: -45.0970, 170.9707
- **Greymouth**: -42.4507, 171.2108
- **Mt Cook**: -43.7350, 170.0967

## 🚀 Quick Start

1. **Clone or download** this repository
2. **Open `index.html`** in your web browser
3. **Explore wind patterns** across New Zealand!
4. **Click any location** to view detailed wind data in a modal overlay
5. **Use the play button** to explore historical wind patterns

No installation or setup required - just open the HTML file and it will start fetching live wind data immediately.

## 🎮 Interactive Features

### Modal Overlays
- **Click any location** to open a detailed modal
- **Real-time updates** during play mode
- **Wave displacement effects** that respond to wind conditions
- **Temperature-linked colors** for visual feedback
- **Close button** to return to the main view

### Play Mode
- **Historical timeline** with interactive slider
- **Play/pause controls** for wind pattern exploration
- **Real-time modal updates** during playback
- **Smooth transitions** between time periods

### Map Interaction
- **Pan and zoom** to explore different regions
- **Persistent hotspots** for reliable location clicking
- **Responsive design** that works on all screen sizes

## 📁 Project Structure

```
Wind-Visualiser-05/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # All styling including modal and effects
├── js/
│   ├── config.js           # Configuration and location settings
│   └── app.js              # Main application logic
├── Visual REfs/            # Reference images and assets
├── README.md               # This file
├── package.json            # Project metadata
├── API_SETUP_GUIDE.md      # API setup documentation
└── .gitignore             # Git ignore file
```

## 🔧 Configuration

All settings are in `js/config.js`:

- **Locations**: Add or modify New Zealand locations
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

Edit `css/styles.css` to customize colors, layout, modal appearance, and wave effects.

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

### Modal Not Opening
1. Ensure you're clicking on the location circles
2. Check browser console for JavaScript errors
3. Verify the modal overlay is properly positioned

### Performance Issues
- Reduce update frequency in `js/config.js`
- Check browser console for excessive API calls
- Consider caching data locally

## 📈 Future Enhancements

- [ ] Historical wind data visualization
- [ ] Wind gust information
- [ ] Weather alerts and warnings
- [ ] More detailed weather parameters
- [ ] Interactive map interface with terrain
- [ ] Data export functionality
- [ ] Mobile app version
- [ ] Additional wave effects and animations
- [ ] Sound effects based on wind conditions

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
- **New Zealand** for being such a beautiful and windy country
- **Open source community** for inspiration and tools

## 📞 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Review the documentation in the `docs/` folder
3. Open an issue on GitHub
4. Check browser console for error messages

---

**Made with ❤️ for New Zealand's wind enthusiasts** 