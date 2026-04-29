const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Geocode an address using OpenStreetMap Nominatim API
exports.geocode = async (req, res) => {
  try {
    const { address, limit = 1 } = req.query;

    if (!address) {
      return res.status(400).json({ 
        success: false, 
        message: 'Address is required' 
      });
    }

    console.log(`🌍 Geocoding address: ${address}`);

    const safeLimit = Math.min(parseInt(limit) || 1, 8);

    // Call Nominatim API with proper headers
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=${safeLimit}`,
      {
        headers: {
          'User-Agent': 'RideShareApp/1.0',
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Nominatim API returned status ${response.status}`);
    }

    const data = await response.json();

    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    // If multiple results requested, return full array
    if (safeLimit > 1) {
      return res.json({
        success: true,
        results: data.map(item => ({
          name: item.display_name,
          shortName: item.display_name.split(',').slice(0, 2).join(',').trim(),
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          type: item.type,
          class: item.class,
        })),
        location: { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), display_name: data[0].display_name }
      });
    }

    // Single result (backward-compatible)
    res.json({
      success: true,
      location: {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        display_name: data[0].display_name
      }
    });

  } catch (error) {
    console.error('❌ Geocoding error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to geocode address',
      error: error.message
    });
  }
};

// Get route between two points using OSRM
exports.getRoute = async (req, res) => {
  try {
    const { fromLat, fromLon, toLat, toLon } = req.query;

    if (!fromLat || !fromLon || !toLat || !toLon) {
      return res.status(400).json({
        success: false,
        message: 'All coordinates are required (fromLat, fromLon, toLat, toLon)'
      });
    }

    console.log(`🗺️ Getting route from [${fromLat}, ${fromLon}] to [${toLat}, ${toLon}]`);

    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}?overview=full&geometries=geojson`
    );

    if (!response.ok) {
      throw new Error(`OSRM API returned status ${response.status}`);
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    res.json({
      success: true,
      route: {
        coordinates: data.routes[0].geometry.coordinates,
        distance: data.routes[0].distance,
        duration: data.routes[0].duration
      }
    });

  } catch (error) {
    console.error('❌ Route error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get route',
      error: error.message
    });
  }
};

// Reverse geocode: Get address/place name from coordinates
exports.reverseGeocode = async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    console.log(`🔍 Reverse geocoding: [${lat}, ${lon}]`);

    // Call Nominatim reverse geocoding API
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'RideShareApp/1.0',
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Nominatim API returned status ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.error) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    res.json({
      success: true,
      place: {
        name: data.name || data.display_name,
        display_name: data.display_name,
        address: data.address || {},
        lat: parseFloat(data.lat),
        lon: parseFloat(data.lon)
      }
    });

  } catch (error) {
    console.error('❌ Reverse geocoding error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reverse geocode',
      error: error.message
    });
  }
};
