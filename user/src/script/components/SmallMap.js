// Small map component for add/edit item forms
import { GeocodingUtils } from "../utils/geocodingUtils.js"
import L from 'leaflet';

export class SmallMap {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = {
      height: '300px',
      defaultZoom: 10,
      ...options
    };
    this.map = null;
    this.marker = null;
    this.onLocationSelect = options.onLocationSelect || (() => {});
    this.isInitialized = false;
    this.initializationPromise = null;
  }

  async waitForContainer(maxAttempts = 50) {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const container = document.getElementById(this.containerId);
      if (container && container.offsetParent !== null) {
        // Container exists and is visible
        return container;
      }
      
      // Wait 100ms before next attempt
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    throw new Error(`Container ${this.containerId} not found after ${maxAttempts} attempts`);
  }

  async initializeMap(provinceName = null, cityName = null) {
    // If already initializing, wait for it to complete
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._doInitializeMap(provinceName, cityName);
    return this.initializationPromise;
  }

  async _doInitializeMap(provinceName = null, cityName = null) {
    try {
      // Check if Leaflet is loaded
      if (typeof L === 'undefined') {
        throw new Error('Leaflet is not loaded. Please include Leaflet CSS and JS files.');
      }

      // Wait for container to be ready
      const container = await this.waitForContainer();
      
      // Destroy existing map if any
      await this.destroy();

      // Set container height
      container.style.height = this.options.height;
      container.style.width = '100%';
      
      // Clear any existing Leaflet data
      container._leaflet_id = null;
      
      // Default center (Indonesia)
      let center = [-2.5489, 118.0149];
      let zoom = 5;

      // Try to geocode the provided location
      if (provinceName) {
        try {
          const coords = await GeocodingUtils.geocodeLocation(provinceName, cityName);
          if (coords) {
            center = [coords.lat, coords.lng];
            zoom = cityName ? this.options.defaultZoom : 8;
          }
        } catch (error) {
          console.error('Error geocoding location:', error);
        }
      }

      // Initialize map with a small delay to ensure container is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      this.map = L.map(this.containerId, {
        attributionControl: false,
        zoomControl: true
      }).setView(center, zoom);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(this.map);

      // Add click handler for location selection
      this.map.on('click', (e) => {
        this.setMarker(e.latlng.lat, e.latlng.lng);
      });
      
      this.isInitialized = true;
      console.log(`SmallMap initialized successfully for ${this.containerId}`);
      
      // Force a resize after initialization
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 200);
      
      return true;
    } catch (error) {
      console.error('Error initializing SmallMap:', error);
      this.isInitialized = false;
      this.map = null;
      throw error;
    } finally {
      this.initializationPromise = null;
    }
  }

  setMarker(lat, lng) {
    if (!this.isMapReady()) {
      console.error('Cannot set marker: map is not ready');
      return;
    }
    
    // Remove existing marker
    if (this.marker) {
      this.map.removeLayer(this.marker);
    }

    // Add new marker
    this.marker = L.marker([lat, lng]).addTo(this.map);
    
    // Trigger callback
    this.onLocationSelect(lat, lng);
  }

  async getCurrentLocation() {
    if (!this.isMapReady()) {
      throw new Error('Map is not ready. Please wait for initialization to complete.');
    }
    
    try {
      const position = await GeocodingUtils.getCurrentLocation();
      this.map.setView([position.lat, position.lng], this.options.defaultZoom);
      this.setMarker(position.lat, position.lng);
      
      // Try to get address info
      const address = await GeocodingUtils.reverseGeocode(position.lat, position.lng);
      return { ...position, address };
    } catch (error) {
      console.error('Error getting current location:', error);
      throw error;
    }
  }

  async updateLocation(provinceName, cityName) {
    if (!this.isMapReady()) {
      console.error('Cannot update location: map is not ready');
      return;
    }
    
    if (!provinceName) return;

    try {
      const coords = await GeocodingUtils.geocodeLocation(provinceName, cityName);
      if (coords) {
        const zoom = cityName ? this.options.defaultZoom : 8;
        this.map.setView([coords.lat, coords.lng], zoom);
        this.setMarker(coords.lat, coords.lng);
      }
    } catch (error) {
      console.error('Error updating map location:', error);
    }
  }

  async destroy() {
    if (this.map) {
      try {
        // Remove marker first
        if (this.marker) {
          this.map.removeLayer(this.marker);
          this.marker = null;
        }
        
        // Remove map
        this.map.remove();
        console.log(`SmallMap destroyed for ${this.containerId}`);
      } catch (error) {
        console.error('Error destroying SmallMap:', error);
      }
    }
    
    // Clear container
    const container = document.getElementById(this.containerId);
    if (container) {
      container.innerHTML = '';
      container._leaflet_id = null;
      delete container._leaflet_id;
    }
    
    this.map = null;
    this.marker = null;
    this.isInitialized = false;
    this.initializationPromise = null;
  }
  
  isMapReady() {
    return this.isInitialized && this.map !== null && !this.initializationPromise;
  }
}