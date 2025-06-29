// Wellington Wind Visualizer - Redesigned

class WindVisualizer {
  constructor() {
    console.log('WindVisualizer constructor starting...');
    this.canvas = document.getElementById('wind-canvas');
    this.statusDot = document.getElementById('status-dot');
    this.sliderDate = document.getElementById('slider-date');
    this.sliderTime = document.getElementById('slider-time');
    this.historicalSlider = document.getElementById('historical-slider');
    this.playBtn = document.getElementById('play-historical');
    this.playInterval = null;
    this.isPlaying = false;
    this.currentSiteData = new Map();
    this.historicalData = new Map();
    this.connectionStatus = 'unknown';
    this.isHistoricalMode = false;
    this.currentHistoricalIndex = 0;
    this.historicalTimePoints = [];
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.isPanning = false;
    this.lastPan = { x: 0, y: 0 };
    
    // Modal elements
    this.modal = document.getElementById('location-modal');
    this.modalWindDirection = document.getElementById('modal-wind-direction');
    this.modalWindSpeed = document.getElementById('modal-wind-speed');
    this.modalTemperature = document.getElementById('modal-temperature');
    this.modalClose = document.getElementById('modal-close');
    this.appTitle = document.getElementById('app-title');
    this.apiStatus = document.getElementById('api-status');
    
    if (this.sliderDate) this.sliderDate.textContent = 'LOADING';
    const bgDate = document.getElementById('background-date');
    if (bgDate) bgDate.textContent = 'LOADING';
    if (this.playBtn) this.playBtn.disabled = true;
    console.log('WindVisualizer constructor completed, calling init...');
    this.fitAllLocationsInView();
    this.init();
    window.addEventListener('resize', () => this.updateModalHotspots());
  }

  init() {
    console.log('WindVisualizer init starting...');
    this.renderLocationNames();
    this.setupHistoricalSlider();
    this.setupZoomAndPan();
    this.setupPlayButton();
    this.setupModal();
    this.hideInstructionsOnInteraction();
    // Show map container immediately
    const mapContainer = document.getElementById('map-zoom-container');
    if (mapContainer) mapContainer.style.display = '';
    console.log('WindVisualizer init completed');
    // Start historical data fetch immediately
    console.log('Starting historical data fetch...');
    this.startHistoricalDataFetch();
  }

  renderLocationNamesAndUpdate() {
    this.renderLocationNames();
    // Re-apply wind data to all locations
    CONFIG.SITES.forEach(site => {
      const data = this.currentSiteData.get(site.name);
      if (data) {
        this.updateLocationDisplay(site, data.windSpeed, data.windDir, data.timestamp, data.isHistorical, data.temperature);
      }
    });
    // Update modal hotspots overlay
    this.updateModalHotspots();
  }

  setupZoomAndPan() {
    const mapContainer = document.getElementById('map-zoom-container');
    if (!mapContainer) return;
    // Scroll to zoom
    mapContainer.addEventListener('wheel', (e) => {
      e.preventDefault();
      this._setBlendMode('none');
      const rect = mapContainer.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - rect.width / 2 - this.panX;
      const mouseY = e.clientY - rect.top - rect.height / 2 - this.panY;
      // Make zoom less sensitive
      const zoomAmount = e.deltaY < 0 ? 1.03 : 0.97;
      const newZoom = Math.max(0.2, Math.min(8.0, this.zoom * zoomAmount));
      this.panX = (this.panX - mouseX) * (newZoom / this.zoom) + mouseX;
      this.panY = (this.panY - mouseY) * (newZoom / this.zoom) + mouseY;
      this.zoom = newZoom;
      this.renderLocationNamesAndUpdate();
      setTimeout(() => this._setBlendMode('difference'), 50);
    }, { passive: false });
    // Mouse drag to pan
    mapContainer.addEventListener('mousedown', (e) => {
      this.isPanning = true;
      this.lastPan = { x: e.clientX, y: e.clientY };
      document.body.style.cursor = 'grabbing';
      this._setBlendMode('none');
    });
    window.addEventListener('mousemove', (e) => {
      if (this.isPanning) {
        this.panX += e.clientX - this.lastPan.x;
        this.panY += e.clientY - this.lastPan.y;
        this.lastPan = { x: e.clientX, y: e.clientY };
        this.renderLocationNamesAndUpdate();
      }
    });
    window.addEventListener('mouseup', () => {
      if (this.isPanning) {
        this.isPanning = false;
        document.body.style.cursor = '';
        setTimeout(() => this._setBlendMode('difference'), 50);
      }
    });
    // Touch drag to pan
    mapContainer.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isPanning = true;
        this.lastPan = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        this._setBlendMode('none');
      }
    });
    mapContainer.addEventListener('touchmove', (e) => {
      if (this.isPanning && e.touches.length === 1) {
        this.panX += e.touches[0].clientX - this.lastPan.x;
        this.panY += e.touches[0].clientY - this.lastPan.y;
        this.lastPan = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        this.renderLocationNamesAndUpdate();
      }
    });
    mapContainer.addEventListener('touchend', () => {
      if (this.isPanning) {
        this.isPanning = false;
        setTimeout(() => this._setBlendMode('difference'), 50);
      }
    });
  }

  _setBlendMode(mode) {
    document.querySelectorAll('.circle-cell').forEach(cell => {
      // Always use 'difference' for color effect, never 'initial'
      cell.style.mixBlendMode = 'difference';
    });
  }

  getGeographicPosition(lat, lon) {
    // Dynamically calculate bounds around cities with a small margin for slightly tighter layout
    const lats = CONFIG.SITES.map(s => s.lat);
    const lons = CONFIG.SITES.map(s => s.lon);
    const marginLat = 0.5;
    const marginLon = 0.5;
    const bounds = {
      north: Math.max(...lats) + marginLat,
      south: Math.min(...lats) - marginLat,
      west: Math.min(...lons) - marginLon,
      east: Math.max(...lons) + marginLon
    };
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    // Calculate aspect ratios
    const islandWidth = bounds.east - bounds.west;
    const islandHeight = bounds.north - bounds.south;
    const islandAspect = Math.abs(islandWidth / islandHeight);
    const viewportAspect = screenWidth / screenHeight;
    // Determine scale and margins to preserve aspect ratio
    let drawWidth, drawHeight, offsetX, offsetY;
    if (viewportAspect > islandAspect) {
      // Viewport is wider than island: fit height
      drawHeight = screenHeight * 0.9;
      drawWidth = drawHeight * islandAspect;
      offsetY = (screenHeight - drawHeight) / 2;
      offsetX = (screenWidth - drawWidth) / 2;
    } else {
      // Viewport is taller than island: fit width
      drawWidth = screenWidth * 0.9;
      drawHeight = drawWidth / islandAspect;
      offsetX = (screenWidth - drawWidth) / 2;
      offsetY = (screenHeight - drawHeight) / 2;
    }
    const latPercent = (lat - bounds.south) / (bounds.north - bounds.south);
    const lonPercent = (lon - bounds.west) / (bounds.east - bounds.west);
    let x = offsetX + lonPercent * drawWidth;
    let y = offsetY + (1 - latPercent) * drawHeight;
    // Double the distance from the center
    const spreadFactor = 2.4;
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;
    x = centerX + (x - centerX) * spreadFactor;
    y = centerY + (y - centerY) * spreadFactor;
    return { x, y };
  }

  setupPlayButton() {
    if (!this.playBtn) return;
    this.playBtn.addEventListener('click', () => {
      if (this.isPlaying) {
        this.stopHistoricalPlay();
      } else {
        this.startHistoricalPlay();
      }
    });
  }

  startHistoricalPlay() {
    if (!this.isHistoricalMode || this.historicalTimePoints.length === 0) return;
    this.isPlaying = true;
    this.playBtn.innerHTML = '&#10073;&#10073;'; // Pause icon
    // Don't reset to 0, continue from current position
    this.playInterval = setInterval(() => {
      if (this.currentHistoricalIndex < this.historicalTimePoints.length - 1) {
        this.currentHistoricalIndex++;
        const sliderValue = (this.currentHistoricalIndex / (this.historicalTimePoints.length - 1)) * 100;
        this.historicalSlider.value = sliderValue;
        this.updateHistoricalDisplay(sliderValue);
      } else {
        this.stopHistoricalPlay();
      }
    }, 200);
  }

  stopHistoricalPlay() {
    this.isPlaying = false;
    this.playBtn.innerHTML = '&#9654;'; // Play icon
    if (this.playInterval) clearInterval(this.playInterval);
    this.playInterval = null;
  }

  setupHistoricalSlider() {
    this.historicalSlider.addEventListener('input', (e) => {
      if (this.isPlaying) this.stopHistoricalPlay();
      const sliderValue = e.target.value;
      const index = Math.round((sliderValue / 100) * (this.historicalTimePoints.length - 1));
      this.currentHistoricalIndex = index;
      this.updateHistoricalDisplay(sliderValue);
    });
  }

  setBackgroundDate(text) {
    const bgDate = document.getElementById('background-date');
    const datePill = document.getElementById('slider-date');
    if (!bgDate) return;
    // Format for both background and date pill
    let formatted = text;
    if (this.isHistoricalMode && text !== 'LOADING' && text !== 'LIVE') {
      let match = text.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        // YYYY-MM-DD
        const year = match[1].slice(-2);
        const month = match[2];
        const day = match[3];
        formatted = `${day}.${month}.${year}`;
      } else if ((match = text.match(/(\d{2})\/(\d{2})\/(\d{4})/))) {
        // DD/MM/YYYY
        const day = match[1];
        const month = match[2];
        const year = match[3].slice(-2);
        formatted = `${day}.${month}.${year}`;
      } else {
        formatted = text;
      }
    } else if (text === 'LOADING' || (!this.isHistoricalMode && text === 'LIVE')) {
      formatted = 'LOADING';
    } else if (text === 'LIVE') {
      formatted = 'LIVE';
    }
    bgDate.textContent = formatted;
    if (datePill) datePill.textContent = formatted;
  }

  updateHistoricalDisplay(sliderValue) {
    const mapContainer = document.getElementById('map-zoom-container');
    const exploreTip = document.getElementById('explore-tip');
    if (!this.isHistoricalMode || this.historicalTimePoints.length === 0) {
      console.warn('No historical mode or no time points:', this.isHistoricalMode, this.historicalTimePoints.length);
      if (this.sliderDate) this.sliderDate.textContent = 'LOADING';
      const bgDate = document.getElementById('background-date');
      if (bgDate) bgDate.textContent = 'LOADING';
      if (mapContainer) mapContainer.style.display = 'none';
      if (this.playBtn) this.playBtn.disabled = true;
      if (exploreTip && !this.instructionsHidden) exploreTip.style.display = 'none';
      const sliderTime = document.getElementById('slider-time');
      if (sliderTime) sliderTime.textContent = '';
      this.updateModalHotspots();
      return;
    }
    if (mapContainer) mapContainer.style.display = '';
    if (this.playBtn) this.playBtn.disabled = false;
    if (exploreTip && !this.instructionsHidden) exploreTip.style.display = '';
    // Autoplay once data is loaded
    if (!this.isPlaying && this.currentHistoricalIndex === 0) {
      this.startHistoricalPlay();
    }
    const index = Math.round((sliderValue / 100) * (this.historicalTimePoints.length - 1));
    this.currentHistoricalIndex = index;
    const timePoint = this.historicalTimePoints[index];
    console.log('Displaying time point:', timePoint, 'at index', index);
    this.sliderDate.textContent = timePoint.date;
    this.setBackgroundDate(timePoint.date);
    // Set the time under the date
    let sliderTime = document.getElementById('slider-time');
    if (!sliderTime) {
      sliderTime = document.createElement('div');
      sliderTime.id = 'slider-time';
      sliderTime.className = 'slider-time-pill';
      this.sliderDate.parentNode.insertBefore(sliderTime, this.sliderDate.nextSibling);
    }
    sliderTime.textContent = timePoint.time;
    this.renderLocationNames();
    CONFIG.SITES.forEach(site => {
      const siteHistoricalData = this.historicalData.get(site.name);
      if (siteHistoricalData && siteHistoricalData[index]) {
        const data = siteHistoricalData[index];
        this.updateLocationDisplay(site, data.windSpeed, data.windDir, data.timestamp, true, data.temperature);
      } else {
        console.warn(`No data for ${site.name} at index ${index}`);
      }
    });
    this.updateModalHotspots();
  }

  async fetchHistoricalData() {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      let limitExceeded = false;
      const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
      console.log('Fetching historical data for all sites:', CONFIG.SITES.map(s => s.name));
      for (const site of CONFIG.SITES) {
        try {
          const cacheKey = `historical_${site.name}`;
          const cached = localStorage.getItem(cacheKey);
          let data;
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Date.now() - parsed.timestamp < CACHE_EXPIRY) {
              data = parsed.data;
              console.log(`Loaded historical data for ${site.name} from cache.`);
            }
          }
          if (!data) {
      const params = new URLSearchParams({
        latitude: site.lat,
        longitude: site.lon,
              hourly: 'wind_speed_10m,wind_direction_10m,temperature_2m',
              start_date: startDateStr,
              end_date: endDateStr,
              wind_speed_unit: 'kmh',
              timezone: 'auto'
            });
      const url = `${CONFIG.API_BASE_URL}?${params}`;
            console.log(`Fetching historical for ${site.name}: ${url}`);
      const response = await fetch(url);
            data = await response.json();
            localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
            console.log(`Fetched and cached historical data for ${site.name}.`);
          }
          if (data.reason && data.reason.toLowerCase().includes('limit')) {
            limitExceeded = true;
            console.error('API limit exceeded:', data.reason);
            break;
          }
          if (data.hourly && data.hourly.time) {
            const historicalData = [];
            const timePoints = [];
            for (let i = 0; i < data.hourly.time.length; i++) {
              const timestamp = data.hourly.time[i];
              const windSpeed = data.hourly.wind_speed_10m[i];
              const windDir = data.hourly.wind_direction_10m[i];
              const temperature = data.hourly.temperature_2m ? data.hourly.temperature_2m[i] : null;
              if (windSpeed !== null && windDir !== null) {
                historicalData.push({ windSpeed, windDir, temperature, timestamp });
                const date = new Date(timestamp);
                timePoints.push({
                  date: date.toLocaleDateString(),
                  time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                });
              }
            }
            this.historicalData.set(site.name, historicalData);
            if (timePoints.length > this.historicalTimePoints.length) {
              this.historicalTimePoints = timePoints;
            }
            console.log(`Loaded ${historicalData.length} points for ${site.name}`);
      } else {
            console.warn(`No hourly data for ${site.name}`);
          }
        } catch (error) {
          console.error(`Error fetching historical for ${site.name}:`, error);
        }
        // Throttle requests: wait 1200ms before next (only if not cached)
        if (!localStorage.getItem(`historical_${site.name}`)) {
          await new Promise(resolve => setTimeout(resolve, 1200));
        }
      }
      if (limitExceeded) {
        this.updateConnectionStatus('limit');
        return;
      }
      this.isHistoricalMode = true;
      console.log('All historical data loaded. Time points:', this.historicalTimePoints.length);
      this.updateHistoricalDisplay(0);
      this.updateConnectionStatus('connected');
      this.updateModalHotspots();
    } catch (error) {
      console.error('Error in fetchHistoricalData:', error);
      this.updateConnectionStatus('error');
      this.updateModalHotspots();
    }
  }

  updateConnectionStatus(status) {
    this.connectionStatus = status;
    this.statusDot.className = 'status-dot';
    const statusText = document.getElementById('status-text');
    if (status === 'connected') {
      this.statusDot.classList.add('connected');
      if (statusText) statusText.textContent = 'API CONNECTED';
    } else if (status === 'limit') {
      this.statusDot.classList.add('error');
      if (statusText) statusText.textContent = 'API LIMIT EXCEEDED';
    } else if (status === 'error') {
      this.statusDot.classList.add('error');
      if (statusText) statusText.textContent = 'API ERROR';
    } else {
      // 'unknown' or connecting
      if (statusText) statusText.textContent = 'API LOADING';
    }
  }

  createLocationElement(site) {
    const cell = document.createElement('div');
    cell.className = 'circle-cell';
    // Location name and triangle (rotated)
    const locationDiv = document.createElement('div');
    locationDiv.className = 'location-name';
    locationDiv.id = `location-${site.name.replace(/\s+/g, '-')}`;
    locationDiv.style.fontSize = '0.88em'; // 10% larger than previous
    // Title and triangle row
    const contentDiv = document.createElement('div');
    contentDiv.className = 'location-content';
    contentDiv.textContent = site.name.toUpperCase();
    contentDiv.style.fontSize = '1em';
    // Wind triangle (SVG)
    const windTriangle = document.createElement('span');
    windTriangle.className = 'wind-triangle';
    windTriangle.innerHTML = '<svg viewBox="0 0 20 20" style="width:0.96em;height:0.96em;"><polygon points="0,0 20,10 0,20"/></svg>';
    windTriangle.style.width = '0.96em';
    windTriangle.style.height = '0.96em';
    windTriangle.style.marginLeft = '0.56vw';
    contentDiv.appendChild(windTriangle);
    locationDiv.appendChild(contentDiv);
    cell.appendChild(locationDiv);
    // Wind info block (stacked, left-aligned)
    const windInfo = document.createElement('div');
    windInfo.className = 'wind-info';
    windInfo.innerHTML = '<div class="wind-compass">--</div><div class="wind-speed">-- km/h</div><div class="wind-temp">--°C</div>';
    cell.appendChild(windInfo);
    return cell;
  }

  getTempColor(temp) {
    // Smooth color gradient from cold to hot with more intermediate hues
    if (temp === null || temp === undefined) return '#bbb';
    
    // Cold to cool range (below 0°C to 8°C)
    if (temp <= 0) return '#0066cc'; // deep blue
    if (temp <= 2) return '#0088dd'; // medium blue
    if (temp <= 4) return '#00aaff'; // light blue
    if (temp <= 6) return '#00ccff'; // sky blue
    if (temp <= 8) return '#00ddff'; // bright blue
    
    // Cool to mild range (8°C to 16°C)
    if (temp <= 10) return '#00e6cc'; // blue-green
    if (temp <= 12) return '#00ffaa'; // green-blue
    if (temp <= 14) return '#00ff88'; // bright green
    if (temp <= 16) return '#44ff66'; // light green
    
    // Mild to warm range (16°C to 24°C)
    if (temp <= 18) return '#88ff44'; // yellow-green
    if (temp <= 20) return '#ccff00'; // lime
    if (temp <= 22) return '#ffff00'; // yellow
    if (temp <= 24) return '#ffcc00'; // golden yellow
    
    // Warm to hot range (24°C to 32°C)
    if (temp <= 26) return '#ffaa00'; // orange-yellow
    if (temp <= 28) return '#ff8800'; // orange
    if (temp <= 30) return '#ff6600'; // dark orange
    if (temp <= 32) return '#ff4400'; // red-orange
    
    // Hot range (above 32°C)
    if (temp <= 35) return '#ff2200'; // bright red
    if (temp <= 38) return '#ff0000'; // red
    if (temp <= 40) return '#dd0000'; // dark red
    return '#bb0000'; // very dark red
  }

  updateLocationDisplay(site, windSpeed, windDir, timestamp, isHistorical = false, temperature = null) {
    const cell = document.getElementById(`location-${site.name.replace(/\s+/g, '-')}`)?.closest('.circle-cell');
    const locationElement = cell?.querySelector('.location-name');
    if (!locationElement || !cell) return;
    
    // Store current data for modal access
    this.currentSiteData.set(site.name, {
      windSpeed,
      windDir,
      temperature,
      timestamp,
      isHistorical
    });
    
    // Update modal content if modal is active for this site
    if (this.currentModalSite && this.currentModalSite.name === site.name) {
      this.updateModalContent();
    }
    
    // Set text color to black
    locationElement.style.color = '#111';
    // Set parent circle color based on temperature
    cell.style.background = this.getTempColor(temperature);
    // Dramatic circle size based on wind speed
    const minWind = 0, maxWind = 120;
    const minSize = 8, maxSize = 48; // vw
    const clampedWind = Math.max(minWind, Math.min(maxWind, windSpeed));
    const size = minSize + (maxSize - minSize) * ((clampedWind - minWind) / (maxWind - minWind));
    cell.style.width = `${size}vw`;
    cell.style.height = `${size}vw`;
    // Rotate only the .location-content (name + triangle) by windDir + 270
    const contentDiv = locationElement.querySelector('.location-content');
    if (windDir !== null && contentDiv) {
      contentDiv.style.transform = `rotate(${windDir + 270}deg)`;
    }
    // Wind info (stacked, left-aligned, compass direction, temperature)
    const windInfo = cell.querySelector('.wind-info');
    if (windInfo) {
      const speedSpan = windInfo.querySelector('.wind-speed');
      const compassSpan = windInfo.querySelector('.wind-compass');
      const tempSpan = windInfo.querySelector('.wind-temp');
      if (speedSpan) speedSpan.textContent = `${windSpeed.toFixed(0)} km/h`;
      if (compassSpan) compassSpan.textContent = this.degToCompass(windDir);
      if (tempSpan && temperature !== null && temperature !== undefined) tempSpan.textContent = `${Math.round(temperature)}°C`;
    }
    // Tooltip
    const compassDirection = this.degToCompass(windDir);
    const timeLabel = isHistorical ? 'Historical' : 'Live';
    locationElement.title = `${site.name.toUpperCase()}\nWind: ${windSpeed.toFixed(1)} km/h\nDirection: ${windDir}° (${compassDirection})\n${timeLabel}: ${new Date(timestamp).toLocaleString()}\nClick for details`;
  }

  handleError(site, errorMessage) {
    const locationElement = document.getElementById(`location-${site.name.replace(/\s+/g, '-')}`);
    if (locationElement) {
      const windArrow = locationElement.querySelector('.wind-arrow');
      windArrow.style.transform = 'rotate(0deg)';
      locationElement.title = `${site.name.toUpperCase()}\nError: ${errorMessage}`;
    }
  }

  degToCompass(num) {
    if (num === null) return '--';
    const val = Math.floor((num / 22.5) + 0.5);
    const arr = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
    return arr[(val % 16)];
  }

  renderLocationNames() {
    console.log('renderLocationNames starting...');
    const mapContainer = document.getElementById('map-zoom-container');
    if (!mapContainer) {
      console.error('map-zoom-container not found!');
      return;
    }
    console.log(`Creating ${CONFIG.SITES.length} location elements...`);
    mapContainer.innerHTML = '';
    // Remove transform from container
    mapContainer.style.transform = '';
    mapContainer.style.transformOrigin = 'center center';
    mapContainer.style.position = 'absolute';
    mapContainer.style.left = '0';
    mapContainer.style.top = '0';
    mapContainer.style.width = '100%';
    mapContainer.style.height = '100%';
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    CONFIG.SITES.forEach(site => {
      const cell = this.createLocationElement(site);
      // Position geographically
      const position = this.getGeographicPosition(site.lat, site.lon);
      // Apply zoom and pan to each circle
      const x = centerX + (position.x - centerX) * this.zoom + this.panX;
      const y = centerY + (position.y - centerY) * this.zoom + this.panY;
      cell.style.position = 'absolute';
      cell.style.left = `${x}px`;
      cell.style.top = `${y}px`;
      cell.style.transform = `translate(-50%, -50%) scale(${this.zoom})`;
      mapContainer.appendChild(cell);
      // Force repaint by toggling a dummy class
      cell.classList.add('force-repaint');
      setTimeout(() => cell.classList.remove('force-repaint'), 0);
    });
    console.log('renderLocationNames completed');
  }

  startHistoricalDataFetch() {
    this.fetchHistoricalData();
  }

  setupModal() {
    if (!this.modalClose) return;
    // Close button click
    this.modalClose.addEventListener('click', () => {
      this.closeModal();
    });
    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('active')) {
        this.closeModal();
      }
    });
  }

  startModalWaveEffect() {
    if (this.waveRaf) return;
    // Internal state for smooth interpolation
    this._waveAmplitude = this._waveAmplitude || 8;
    this._waveRotation = this._waveRotation || 0;
    this._waveWindSpeed = this.currentModalWindSpeed || 0;
    this._waveWindDir = this.currentModalWindDir || 0;
    const getTargetAmplitude = () => {
      const minAmp = 4;
      const maxAmp = 32;
      const wind = this._waveWindSpeed;
      return Math.max(minAmp, Math.min(maxAmp, minAmp + wind * 1.2));
    };
    const getTargetRotation = () => {
      const maxAngle = 18; // increased for more drama
      const dir = this._waveWindDir;
      return ((dir / 360) * 2 - 1) * maxAngle;
    };
    const getTargetOffset = () => {
      // Offset up to 30vw horizontally, 14vw vertically at max wind
      const maxOffsetX = 30; // vw
      const maxOffsetY = 14; // vw
      const wind = this._waveWindSpeed;
      const dir = this._waveWindDir;
      const maxWind = 40; // cap wind for offset
      const r = Math.min(1, wind / maxWind);
      const angleRad = ((dir - 90) * Math.PI) / 180;
      // Invert the offset direction
      let x = -Math.cos(angleRad) * maxOffsetX * r;
      let y = -Math.sin(angleRad) * maxOffsetY * r;
      const margin = 2; // vw, allow more outside
      x = Math.max(-window.innerWidth * (maxOffsetX / 100) + margin, Math.min(window.innerWidth * (maxOffsetX / 100) - margin, x));
      y = Math.max(-window.innerHeight * (maxOffsetY / 100) + margin, Math.min(window.innerHeight * (maxOffsetY / 100) - margin, y));
      return { x, y };
    };
    const animate = () => {
      const now = Date.now() / 900;
      const lerp = (a, b, t) => a + (b - a) * t;
      const smooth = 0.04;
      if (typeof this.currentModalWindSpeed === 'number') {
        this._waveWindSpeed = lerp(this._waveWindSpeed, this.currentModalWindSpeed, smooth);
      }
      if (typeof this.currentModalWindDir === 'number') {
        let delta = this.currentModalWindDir - this._waveWindDir;
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;
        this._waveWindDir = lerp(this._waveWindDir, this._waveWindDir + delta, smooth);
      }
      const targetAmp = getTargetAmplitude();
      const targetRot = getTargetRotation();
      this._waveAmplitude = lerp(this._waveAmplitude, targetAmp, smooth);
      this._waveRotation = lerp(this._waveRotation, targetRot, smooth);
      const amplitude = this._waveAmplitude;
      const rotation = this._waveRotation;
      const offset = getTargetOffset();
      ['modal-wind-direction', 'modal-wind-speed', 'modal-temperature'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.transform = `translate(${offset.x}vw, ${offset.y}vw) rotate(${rotation}deg)`;
        const chars = Array.from(el.querySelectorAll('.wave-char'));
        chars.forEach((span, i) => {
          const period = 14;
          const phase = now + i / period;
          span.style.transform = `translateY(${Math.sin(phase) * amplitude}px)`;
        });
      });
      this.waveRaf = requestAnimationFrame(animate);
    };
    this.waveRaf = requestAnimationFrame(animate);
  }

  stopModalWaveEffect() {
    if (this.waveRaf) {
      cancelAnimationFrame(this.waveRaf);
      this.waveRaf = null;
    }
    // Reset transforms
    ['modal-wind-direction', 'modal-wind-speed', 'modal-temperature'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.transform = '';
      const chars = Array.from(el.querySelectorAll('.wave-char'));
      chars.forEach(span => {
        span.style.transform = '';
      });
    });
    this._waveAmplitude = 8;
    this._waveRotation = 0;
    this._waveWindSpeed = 0;
    this._waveWindDir = 0;
  }

  wrapModalTextWithWave(id, text) {
    const el = document.getElementById(id);
    if (!el) return;
    // Only update if the text is different
    if (el.getAttribute('data-wave-text') === text) return;
    el.setAttribute('data-wave-text', text);
    el.innerHTML = '';
    for (const char of text) {
      const span = document.createElement('span');
      span.className = 'wave-char';
      span.textContent = char;
      el.appendChild(span);
    }
  }

  openModal(site, windSpeed, windDir, temperature) {
    if (!this.modal) return;
    this.currentModalSite = site;
    this.currentModalWindSpeed = windSpeed;
    this.currentModalWindDir = windDir;
    this._waveWindSpeed = windSpeed;
    this._waveWindDir = windDir;
    // Format values for display
    const windDirText = this.degToCompass(windDir);
    const windSpeedText = `${Math.round(windSpeed)} km/h`;
    const tempText = temperature !== null && temperature !== undefined ? `${Math.round(temperature)}°C` : '--°C';
    this.wrapModalTextWithWave('modal-wind-direction', windDirText);
    this.wrapModalTextWithWave('modal-wind-speed', windSpeedText);
    this.wrapModalTextWithWave('modal-temperature', tempText);
    const tempEl = document.getElementById('modal-temperature');
    if (tempEl) tempEl.style.color = this.getTempColor(temperature);
    if (this.appTitle) {
      this.appTitle.textContent = site.name.toUpperCase();
    }
    if (this.apiStatus) {
      this.apiStatus.style.display = 'none';
    }
    const exploreTip = document.getElementById('explore-tip');
    if (exploreTip) {
      exploreTip.style.display = 'none';
    }
    this.modal.classList.add('active');
    this.startModalWaveEffect();
  }

  closeModal() {
    if (!this.modal) return;
    // Hide modal
    this.modal.classList.remove('active');
    // Clear current modal site
    this.currentModalSite = null;
    // Restore app title
    if (this.appTitle) {
      this.appTitle.textContent = 'Aotearoa';
    }
    // Show API status and explore tip
    if (this.apiStatus) {
      this.apiStatus.style.display = 'flex';
    }
    const exploreTip = document.getElementById('explore-tip');
    if (exploreTip && !this.instructionsHidden) {
      exploreTip.style.display = 'block';
    }
    this.currentModalWindSpeed = null;
    this.currentModalWindDir = null;
    this.stopModalWaveEffect();
  }

  updateModalContent() {
    if (!this.modal.classList.contains('active') || !this.currentModalSite) return;
    const site = this.currentModalSite;
    const currentData = this.currentSiteData.get(site.name);
    if (!currentData) return;
    this.currentModalWindSpeed = currentData.windSpeed;
    this.currentModalWindDir = currentData.windDir;
    // Format values for display
    const windDirText = this.degToCompass(currentData.windDir);
    const windSpeedText = `${Math.round(currentData.windSpeed)} km/h`;
    const tempText = currentData.temperature !== null && currentData.temperature !== undefined ? `${Math.round(currentData.temperature)}°C` : '--°C';
    this.wrapModalTextWithWave('modal-wind-direction', windDirText);
    this.wrapModalTextWithWave('modal-wind-speed', windSpeedText);
    this.wrapModalTextWithWave('modal-temperature', tempText);
    const tempEl = document.getElementById('modal-temperature');
    if (tempEl) tempEl.style.color = this.getTempColor(currentData.temperature);
  }

  updateModalHotspots() {
    // Get overlay
    const overlay = document.getElementById('modal-hotspot-overlay');
    if (!overlay) return;
    overlay.innerHTML = '';
    // Get current positions for each site
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const baseSize = 100;
    CONFIG.SITES.forEach(site => {
      const position = this.getGeographicPosition(site.lat, site.lon);
      const x = centerX + (position.x - centerX) * this.zoom + this.panX;
      const y = centerY + (position.y - centerY) * this.zoom + this.panY;
      const hotspot = document.createElement('div');
      hotspot.className = 'modal-hotspot';
      hotspot.title = 'Click for details';
      hotspot.style.width = `${baseSize}px`;
      hotspot.style.height = `${baseSize}px`;
      hotspot.style.left = `${x}px`;
      hotspot.style.top = `${y}px`;
      hotspot.style.transform = `translate(-50%, -50%) scale(${this.zoom})`;
      hotspot.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        const currentData = this.currentSiteData.get(site.name);
        if (currentData) {
          this.openModal(site, currentData.windSpeed, currentData.windDir, currentData.temperature);
        }
      });
      // Forward wheel events to map container
      hotspot.addEventListener('wheel', (e) => {
        const mapContainer = document.getElementById('map-zoom-container');
        if (mapContainer) {
          mapContainer.dispatchEvent(new WheelEvent('wheel', e));
        }
      });
      overlay.appendChild(hotspot);
    });
    console.log('Hotspots rendered:', overlay.childElementCount);
  }

  fitAllLocationsInView() {
    // Calculate bounds
    const lats = CONFIG.SITES.map(s => s.lat);
    const lons = CONFIG.SITES.map(s => s.lon);
    const marginLat = 0.5;
    const marginLon = 0.5;
    const bounds = {
      north: Math.max(...lats) + marginLat,
      south: Math.min(...lats) - marginLat,
      west: Math.min(...lons) - marginLon,
      east: Math.max(...lons) + marginLon
    };
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    // Calculate aspect ratios
    const islandWidth = bounds.east - bounds.west;
    const islandHeight = bounds.north - bounds.south;
    const islandAspect = Math.abs(islandWidth / islandHeight);
    const viewportAspect = screenWidth / screenHeight;
    let drawWidth, drawHeight;
    if (viewportAspect > islandAspect) {
      drawHeight = screenHeight * 0.9;
      drawWidth = drawHeight * islandAspect;
    } else {
      drawWidth = screenWidth * 0.9;
      drawHeight = drawWidth / islandAspect;
    }
    // The spreadFactor is used in getGeographicPosition, so we need to reverse it
    const spreadFactor = 2.4;
    // Calculate the zoom so that the furthest points fit in the viewport
    const fitZoom = Math.min(
      drawWidth / (screenWidth * spreadFactor),
      drawHeight / (screenHeight * spreadFactor)
    ) * spreadFactor;
    this.zoom = fitZoom;
    this.panX = 0;
    this.panY = 0;
  }

  hideInstructionsOnInteraction() {
    const exploreTip = document.getElementById('explore-tip');
    const mapContainer = document.getElementById('map-zoom-container');
    if (!exploreTip || !mapContainer) return;
    const hide = () => {
      exploreTip.style.display = 'none';
      this.instructionsHidden = true;
      mapContainer.removeEventListener('mousedown', hide);
      mapContainer.removeEventListener('wheel', hide);
      mapContainer.removeEventListener('touchstart', hide);
    };
    mapContainer.addEventListener('mousedown', hide);
    mapContainer.addEventListener('wheel', hide);
    mapContainer.addEventListener('touchstart', hide);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const visualizer = new WindVisualizer();
}); 