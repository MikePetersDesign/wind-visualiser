// Real wind sensor locations in Wellington region
const sensors = [
  {
    name: 'Wellington Airport',
    lat: -41.3272,
    lon: 174.8053,
    id: 'NZWN', // MetService station ID
    source: 'metservice'
  },
  {
    name: 'Paraparaumu Airport',
    lat: -40.9047,
    lon: 174.9892,
    id: 'NZPP',
    source: 'metservice'
  },
  {
    name: 'Hawkes Bay Airport',
    lat: -39.4658,
    lon: 176.8700,
    id: 'NZNR',
    source: 'metservice'
  },
  {
    name: 'Palmerston North Airport',
    lat: -40.3206,
    lon: 175.6169,
    id: 'NZPM',
    source: 'metservice'
  },
  {
    name: 'Blenheim Airport',
    lat: -41.5183,
    lon: 173.8700,
    id: 'NZWB',
    source: 'metservice'
  },
  {
    name: 'Castlepoint',
    lat: -40.9000,
    lon: 176.2167,
    id: 'NZCT',
    source: 'metservice'
  },
  {
    name: 'Kapiti Island',
    lat: -40.8667,
    lon: 174.9167,
    id: 'NZKI',
    source: 'metservice'
  },
  {
    name: 'Levin',
    lat: -40.6167,
    lon: 175.2833,
    id: 'NZLV',
    source: 'metservice'
  }
];

// Map bounds for interpolation
const MAP_BOUNDS = {
  north: -40.5, // top
  south: -41.6, // bottom
  west: 173.5, // left
  east: 177.0  // right
};

const canvas = document.getElementById('wind-canvas');
const ctx = canvas.getContext('2d');

// Cache for wind data
let windDataCache = {};
let lastUpdateTime = 0;
const CACHE_DURATION = CONFIG.cacheDuration || 5 * 60 * 1000; // 5 minutes

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Helper: convert canvas x/y to lat/lon
function xyToLatLon(x, y, width, height) {
  const lon = MAP_BOUNDS.west + (x / width) * (MAP_BOUNDS.east - MAP_BOUNDS.west);
  const lat = MAP_BOUNDS.north - (y / height) * (MAP_BOUNDS.north - MAP_BOUNDS.south);
  return { lat, lon };
}

// Helper: distance between two lat/lon points (approx, not for navigation)
function latLonDist(a, b) {
  const dx = (a.lon - b.lon) * Math.cos((a.lat + b.lat) * Math.PI / 360);
  const dy = a.lat - b.lat;
  return Math.sqrt(dx * dx + dy * dy);
}

// Generate realistic Wellington wind data based on time and location
function generateRealisticWindData() {
  const now = new Date();
  const hour = now.getHours();
  const month = now.getMonth(); // 0-11
  
  // Wellington wind patterns:
  // - Strongest winds typically from S/SE (180-135 degrees)
  // - Windier in spring/summer (Sep-Mar)
  // - Often stronger in afternoon/evening
  // - Typical speeds: 15-35 knots, gusts up to 50+
  
  const windData = {};
  
  sensors.forEach(sensor => {
    // Base wind direction (Wellington typically has southerly winds)
    let baseDir = 180; // South
    
    // Add some variation based on location
    const latVariation = (sensor.lat + 41) * 30; // -30 to +30 degrees
    const lonVariation = (sensor.lon - 174.5) * 20; // -20 to +20 degrees
    baseDir += latVariation + lonVariation;
    
    // Add time-based variation (diurnal pattern)
    const timeVariation = Math.sin((hour - 6) * Math.PI / 12) * 15; // ±15 degrees
    baseDir += timeVariation;
    
    // Add seasonal variation
    const seasonalVariation = Math.sin((month - 6) * Math.PI / 6) * 20; // ±20 degrees
    baseDir += seasonalVariation;
    
    // Normalize to 0-360
    baseDir = (baseDir + 360) % 360;
    
    // Base wind speed (Wellington is windy!)
    let baseSpeed = 20; // knots
    
    // Add location-based variation
    if (sensor.name.includes('Airport')) {
      baseSpeed += 5; // Airports often have higher wind speeds
    }
    if (sensor.name.includes('Kapiti') || sensor.name.includes('Castlepoint')) {
      baseSpeed += 8; // Coastal locations are windier
    }
    
    // Add time-based variation (stronger in afternoon)
    const timeSpeedVariation = Math.sin((hour - 12) * Math.PI / 12) * 8; // ±8 knots
    baseSpeed += timeSpeedVariation;
    
    // Add seasonal variation (windier in spring/summer)
    const seasonalSpeedVariation = Math.sin((month - 9) * Math.PI / 6) * 5; // ±5 knots
    baseSpeed += seasonalSpeedVariation;
    
    // Add some randomness (±30%)
    const randomFactor = 0.7 + Math.random() * 0.6;
    baseSpeed *= randomFactor;
    
    // Ensure reasonable bounds
    baseSpeed = Math.max(5, Math.min(45, baseSpeed));
    
    windData[sensor.id] = {
      windDir: Math.round(baseDir),
      windSpeed: Math.round(baseSpeed * 10) / 10,
      timestamp: now.getTime()
    };
  });
  
  return windData;
}

// Try to fetch real data from public sources
async function fetchPublicWindData() {
  const now = Date.now();
  if (now - lastUpdateTime < CACHE_DURATION && Object.keys(windDataCache).length > 0) {
    return windDataCache;
  }

  const windData = {};

  try {
    // Try multiple weather APIs for live data
    
    // 1. Try Open-Meteo API (free, no API key required)
    if (CONFIG.dataSources.openMeteo) {
      for (const sensor of sensors) {
        try {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${sensor.lat}&longitude=${sensor.lon}&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=kn&timezone=auto`;
          
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            if (data.current && data.current.wind_speed_10m !== undefined) {
              windData[sensor.id] = {
                windDir: data.current.wind_direction_10m,
                windSpeed: data.current.wind_speed_10m,
                timestamp: now,
                source: 'open-meteo'
              };
              console.log(`Live data for ${sensor.name}: ${data.current.wind_speed_10m}kts at ${data.current.wind_direction_10m}°`);
              continue; // Skip to next sensor if we got data
            }
          }
        } catch (error) {
          console.log(`Open-Meteo failed for ${sensor.name}:`, error.message);
        }
      }
    }

    // 2. Try OpenWeatherMap API (free tier with API key)
    if (CONFIG.dataSources.openWeatherMap && CONFIG.openWeatherApiKey !== 'YOUR_OPENWEATHERMAP_KEY_HERE') {
      for (const sensor of sensors) {
        if (windData[sensor.id]) continue; // Skip if we already have data
        
        try {
          const url = `https://api.openweathermap.org/data/2.5/weather?lat=${sensor.lat}&lon=${sensor.lon}&appid=${CONFIG.openWeatherApiKey}&units=metric`;
          
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            if (data.wind && data.wind.speed !== undefined) {
              windData[sensor.id] = {
                windDir: data.wind.deg,
                windSpeed: data.wind.speed * 1.94384, // Convert m/s to knots
                timestamp: now,
                source: 'openweathermap'
              };
              console.log(`Live data for ${sensor.name}: ${windData[sensor.id].windSpeed}kts at ${windData[sensor.id].windDir}°`);
            }
          }
        } catch (error) {
          console.log(`OpenWeatherMap failed for ${sensor.name}:`, error.message);
        }
      }
    }

    // 3. Try WeatherAPI.com (free tier with API key)
    if (CONFIG.dataSources.weatherApi && CONFIG.weatherApiKey !== 'YOUR_WEATHERAPI_KEY_HERE') {
      for (const sensor of sensors) {
        if (windData[sensor.id]) continue; // Skip if we already have data
        
        try {
          const url = `https://api.weatherapi.com/v1/current.json?key=${CONFIG.weatherApiKey}&q=${sensor.lat},${sensor.lon}&aqi=no`;
          
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            if (data.current && data.current.wind_kph !== undefined) {
              windData[sensor.id] = {
                windDir: data.current.wind_degree,
                windSpeed: data.current.wind_kph * 0.539957, // Convert km/h to knots
                timestamp: now,
                source: 'weatherapi'
              };
              console.log(`Live data for ${sensor.name}: ${windData[sensor.id].windSpeed}kts at ${windData[sensor.id].windDir}°`);
            }
          }
        } catch (error) {
          console.log(`WeatherAPI failed for ${sensor.name}:`, error.message);
        }
      }
    }

    // If we got any live data, use it
    if (Object.keys(windData).length > 0) {
      console.log(`Successfully fetched live data for ${Object.keys(windData).length} sensors`);
      windDataCache = windData;
      lastUpdateTime = now;
      return windData;
    }

  } catch (error) {
    console.error('Error fetching live weather data:', error);
  }

  // Fallback to realistic generated data if no live data available
  console.log('No live data available, using realistic generated data');
  const generatedData = generateRealisticWindData();
  // Mark generated data with source
  Object.keys(generatedData).forEach(key => {
    generatedData[key].source = 'generated';
  });
  windDataCache = generatedData;
  lastUpdateTime = now;
  return generatedData;
}

// Get current wind data for a sensor
function getSensorWindData(sensorId) {
  return windDataCache[sensorId] || { windDir: 0, windSpeed: 0, timestamp: 0 };
}

// Interpolate wind direction and speed at a point using inverse distance weighting
function interpolateWind(lat, lon) {
  let sumW = 0, sumDirX = 0, sumDirY = 0, sumSpeed = 0;
  let validSensors = 0;
  
  sensors.forEach(s => {
    const windData = getSensorWindData(s.id);
    if (windData.windSpeed > 0) {
      const d = latLonDist({lat, lon}, s);
      const w = 1 / (d + 0.0001); // avoid div by zero
      sumW += w;
      // Convert direction to vector for proper interpolation
      const rad = windData.windDir * Math.PI / 180;
      sumDirX += Math.cos(rad) * w;
      sumDirY += Math.sin(rad) * w;
      sumSpeed += windData.windSpeed * w;
      validSensors++;
    }
  });
  
  if (validSensors === 0) {
    return { dir: 0, speed: 0 };
  }
  
  const angle = Math.atan2(sumDirY, sumDirX) * 180 / Math.PI;
  const dir = (angle + 360) % 360;
  const speed = sumSpeed / sumW;
  return { dir, speed };
}

function drawGradient() {
  // Draw a heatmap-style wind speed gradient
  const imgData = ctx.createImageData(canvas.width, canvas.height);
  
  for (let y = 0; y < canvas.height; y += 2) {
    for (let x = 0; x < canvas.width; x += 2) {
      const { lat, lon } = xyToLatLon(x, y, canvas.width, canvas.height);
      const wind = interpolateWind(lat, lon);
      
      // Exaggerate wind speeds for more dramatic visualization
      const exaggeratedSpeed = wind.speed * 2.5; // Multiply by 2.5 for more dramatic effect
      
      // Vibrant purple to orange heatmap
      const t = Math.min(exaggeratedSpeed / 50, 1); // normalize to 50 knots max
      let r, g, b;
      
      if (t < 0.2) {
        // Rich purple to blue-purple (0-10 knots)
        r = Math.round(128 + t * 5 * 25); // 128 to 253
        g = Math.round(0);
        b = Math.round(255);
      } else if (t < 0.4) {
        // Blue-purple to blue (10-20 knots)
        r = Math.round(253 - (t - 0.2) * 5 * 253); // 253 to 0
        g = Math.round(0);
        b = Math.round(255);
      } else if (t < 0.6) {
        // Blue to green (20-30 knots)
        r = Math.round(0);
        g = Math.round((t - 0.4) * 5 * 255); // 0 to 255
        b = Math.round(255 - (t - 0.4) * 5 * 255); // 255 to 0
      } else if (t < 0.8) {
        // Green to yellow (30-40 knots)
        r = Math.round((t - 0.6) * 5 * 255); // 0 to 255
        g = Math.round(255);
        b = Math.round(0);
      } else {
        // Yellow to vibrant orange (40-50+ knots)
        r = Math.round(255);
        g = Math.round(255 - (t - 0.8) * 5 * 100); // 255 to 155 (orange)
        b = Math.round(0);
      }
      
      const alpha = 180; // Very visible
      const idx = 4 * (y * canvas.width + x);
      imgData.data[idx] = r;
      imgData.data[idx + 1] = g;
      imgData.data[idx + 2] = b;
      imgData.data[idx + 3] = alpha;
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

function drawArrow(x, y, angle, len) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = '#111';
  ctx.fillStyle = '#111';
  ctx.lineWidth = 1.2;
  // Main shaft
  ctx.beginPath();
  ctx.moveTo(-len/2, 0);
  ctx.lineTo(len/2, 0);
  ctx.stroke();
  // Arrowhead (smaller)
  ctx.beginPath();
  ctx.moveTo(len/2, 0);
  ctx.lineTo(len/2 - 3, 2);
  ctx.lineTo(len/2 - 3, -2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawSensorLabels() {
  sensors.forEach(sensor => {
    // Convert lat/lon to canvas x/y
    const x = ((sensor.lon - MAP_BOUNDS.west) / (MAP_BOUNDS.east - MAP_BOUNDS.west)) * canvas.width;
    const y = ((MAP_BOUNDS.north - sensor.lat) / (MAP_BOUNDS.north - MAP_BOUNDS.south)) * canvas.height;
    
    const windData = getSensorWindData(sensor.id);
    const isOnline = windData.windSpeed > 0;
    const isLiveData = windData.source && windData.source !== 'generated';
    
    // Draw dot with different colors for live vs generated data
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    if (isLiveData) {
      ctx.fillStyle = '#00ff00'; // Green for live data
    } else if (isOnline) {
      ctx.fillStyle = '#1e90ff'; // Blue for generated data
    } else {
      ctx.fillStyle = '#ccc'; // Gray for offline
    }
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    
    // Draw label with wind info and data source
    const windSpeedText = isOnline ? `${Math.round(windData.windSpeed)}kt` : 'Offline';
    const dataSourceText = isLiveData ? ' (LIVE)' : ' (GEN)';
    const label = `${sensor.name} (${windSpeedText})${dataSourceText}`;
    
    ctx.save();
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    // Measure text
    const paddingX = 6, paddingY = 3;
    const textWidth = ctx.measureText(label).width;
    const boxWidth = textWidth + paddingX * 2;
    const boxHeight = 16;
    const boxX = x + 10;
    const boxY = y - boxHeight / 2;
    // Draw white rounded rect
    ctx.beginPath();
    const radius = 6;
    ctx.moveTo(boxX + radius, boxY);
    ctx.lineTo(boxX + boxWidth - radius, boxY);
    ctx.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + radius);
    ctx.lineTo(boxX + boxWidth, boxY + boxHeight - radius);
    ctx.quadraticCurveTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth - radius, boxY + boxHeight);
    ctx.lineTo(boxX + radius, boxY + boxHeight);
    ctx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - radius);
    ctx.lineTo(boxX, boxY + radius);
    ctx.quadraticCurveTo(boxX, boxY, boxX + radius, boxY);
    ctx.closePath();
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.92;
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 2;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    // Draw text with different colors
    if (isLiveData) {
      ctx.fillStyle = '#008000'; // Green text for live data
    } else if (isOnline) {
      ctx.fillStyle = '#222'; // Dark text for generated data
    } else {
      ctx.fillStyle = '#999'; // Gray text for offline
    }
    ctx.fillText(label, boxX + paddingX, y);
    ctx.restore();
  });
}

function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGradient(); // heatmap behind arrows
  const spacing = 16; // denser grid
  for (let y = spacing/2; y < canvas.height; y += spacing) {
    for (let x = spacing/2; x < canvas.width; x += spacing) {
      const { lat, lon } = xyToLatLon(x, y, canvas.width, canvas.height);
      const wind = interpolateWind(lat, lon);
      // Arrow points in wind direction (where wind is going)
      const angle = ((wind.dir + 180) % 360) * Math.PI / 180;
      const len = 8 + wind.speed * 1.8; // exaggerated length
      drawArrow(x, y, angle, len);
    }
  }
  drawSensorLabels();
}

// Main function to update the display
async function updateWindMap() {
  const statusBar = document.getElementById('status-bar');
  const statusText = document.getElementById('status-text');
  const lastUpdate = document.getElementById('last-update');
  
  try {
    statusBar.className = 'api-loading';
    statusText.textContent = 'Fetching live wind data...';
    
    // Try to fetch real wind data
    const windData = await fetchPublicWindData();
    
    // Check if we got live data
    const liveDataCount = Object.values(windData).filter(data => data.source && data.source !== 'generated').length;
    const totalSensors = sensors.length;
    
    if (liveDataCount > 0) {
      statusBar.className = '';
      statusText.textContent = `Live data: ${liveDataCount}/${totalSensors} sensors`;
      lastUpdate.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
    } else {
      statusBar.className = 'error';
      statusText.textContent = 'Using generated data';
      lastUpdate.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
    }
    
  } catch (error) {
    console.error('Failed to fetch wind data:', error);
    statusBar.className = 'error';
    statusText.textContent = 'Using generated data';
    lastUpdate.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
  }
  
  drawGrid();
}

// Initialize and start updating
updateWindMap();

// Update based on config interval
setInterval(updateWindMap, CONFIG.updateInterval || 5 * 60 * 1000);

// Also update on window resize
window.addEventListener('resize', () => {
  resizeCanvas();
  drawGrid();
}); 