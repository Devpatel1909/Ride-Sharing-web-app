const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Get Google Maps API Key from environment
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// ─── In-memory cache for geocoding results ───────────────────────────────
const geocodeCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

if (!GOOGLE_MAPS_API_KEY) {
  console.warn('⚠️ WARNING: GOOGLE_MAPS_API_KEY not set in .env - geocoding will fail!');
}
exports.geocode = async (req, res) => {
  try {
    const { address, limit = 1 } = req.query;

    if (!address) {
      return res.status(400).json({ 
        success: false, 
        message: 'Address is required' 
      });
    }

    const cacheKey = `geocode:${address}:${limit}`;
    const cached = geocodeCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`💾 Cache HIT for: "${address}"`);
      return res.json(cached.data);
    }

    console.log(`🌍 Geocoding with Google Maps: "${address}"`);

    let data;
    if (GOOGLE_MAPS_API_KEY) {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
      );

      if (!response.ok) {
        console.warn(`Google Maps geocode returned HTTP ${response.status}`);
      } else {
        data = await response.json();
      }
    }

    // If Google Maps is not available or rejected the key, fallback to Nominatim
    if (!data || data.status === 'REQUEST_DENIED' || data.status === 'OVER_QUERY_LIMIT' || data.status === 'INVALID_REQUEST') {
      console.warn('⚠️ Google Maps geocoding unavailable or rejected key — falling back to Nominatim');
      const nomRes = await nominatimSearch(address, parseInt(limit) || 1);
      if (!nomRes || nomRes.length === 0) {
        return res.status(404).json({ success: false, message: 'Location not found' });
      }

      const safeLimit = Math.min(parseInt(limit) || 1, nomRes.length);
      if (safeLimit > 1) {
        const result = {
          success: true,
          results: nomRes.slice(0, safeLimit).map(item => ({
            name: item.display_name,
            shortName: item.display_name.split(',').slice(0, 2).join(',').trim(),
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            type: item.type,
          })),
          location: { lat: parseFloat(nomRes[0].lat), lon: parseFloat(nomRes[0].lon), display_name: nomRes[0].display_name }
        };
        geocodeCache.set(cacheKey, { data: result, timestamp: Date.now() });
        return res.json(result);
      }

      const result = {
        success: true,
        location: { lat: parseFloat(nomRes[0].lat), lon: parseFloat(nomRes[0].lon), display_name: nomRes[0].display_name }
      };
      geocodeCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return res.json(result);
    }

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    const safeLimit = Math.min(parseInt(limit) || 1, data.results.length);

    if (safeLimit > 1) {
      const result = {
        success: true,
        results: data.results.slice(0, safeLimit).map(item => ({
          name: item.formatted_address,
          shortName: item.formatted_address.split(',').slice(0, 2).join(',').trim(),
          lat: item.geometry.location.lat,
          lon: item.geometry.location.lng,
          type: item.types?.[0] || 'point_of_interest',
        })),
        location: {
          lat: data.results[0].geometry.location.lat,
          lon: data.results[0].geometry.location.lng,
          display_name: data.results[0].formatted_address
        }
      };

      geocodeCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return res.json(result);
    }

    // Single result (backward-compatible)
    const result = {
      success: true,
      location: {
        lat: data.results[0].geometry.location.lat,
        lon: data.results[0].geometry.location.lng,
        display_name: data.results[0].formatted_address
      }
    };

    geocodeCache.set(cacheKey, { data: result, timestamp: Date.now() });
    res.json(result);

  } catch (error) {
    console.error('❌ Geocoding error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to geocode address',
      error: error.message
    });
  }
};

// Simple Nominatim search fallback
async function nominatimSearch(address, limit = 1) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=${limit}`;
    const resp = await fetch(url, { headers: { 'User-Agent': 'RideShareApp/1.0', Accept: 'application/json' } });
    if (!resp.ok) return null;
    return await resp.json();
  } catch (e) {
    console.warn('Nominatim search failed:', e.message);
    return null;
  }
}

async function nominatimReverse(lat, lon) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=18&addressdetails=1`;
    const resp = await fetch(url, { headers: { 'User-Agent': 'RideShareApp/1.0', Accept: 'application/json' } });
    if (!resp.ok) return null;
    return await resp.json();
  } catch (e) {
    console.warn('Nominatim reverse failed:', e.message);
    return null;
  }
}

// Get route between two points using Google Maps Directions API
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

    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('Google Maps API key not configured — falling back to OSRM');
      const osrm = await osrmRoute(fromLat, fromLon, toLat, toLon);
      if (!osrm) return res.status(404).json({ success: false, message: 'Route not found' });
      return res.json({ success: true, route: osrm });
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${fromLat},${fromLon}&destination=${toLat},${toLon}&key=${GOOGLE_MAPS_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Google Maps API returned status ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
      console.warn('Google Directions returned no route — falling back to OSRM');
      const osrm = await osrmRoute(fromLat, fromLon, toLat, toLon);
      if (!osrm) return res.status(404).json({ success: false, message: 'Route not found' });
      return res.json({ success: true, route: osrm });
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    res.json({
      success: true,
      route: {
        distance: leg.distance.value,
        duration: leg.duration.value,
        distanceText: leg.distance.text,
        durationText: leg.duration.text,
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

// OSRM fallback for routing
async function osrmRoute(fromLat, fromLon, toLat, toLon) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}?overview=full&geometries=geojson`;
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!data.routes || data.routes.length === 0) return null;
    const r = data.routes[0];
    const dist = r.distance || (r.legs && r.legs[0] && r.legs[0].distance) || 0;
    const dur = r.duration || (r.legs && r.legs[0] && r.legs[0].duration) || 0;
    return { distance: dist, duration: dur, distanceText: `${(dist/1000).toFixed(2)} km`, durationText: `${Math.round(dur/60)} mins` };
  } catch (e) {
    console.warn('OSRM route failed:', e.message);
    return null;
  }
}

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

    const cacheKey = `reverse:${lat}:${lon}`;
    const cached = geocodeCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`💾 Cache HIT for reverse geocode: [${lat}, ${lon}]`);
      return res.json(cached.data);
    }

    console.log(`🔍 Reverse geocoding with Google Maps: [${lat}, ${lon}]`);

    let data;
    if (GOOGLE_MAPS_API_KEY) {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${GOOGLE_MAPS_API_KEY}`
      );

      if (!response.ok) {
        console.warn(`Google Maps reverse geocode returned HTTP ${response.status}`);
      } else {
        data = await response.json();
      }
    }

    if (!data || data.status === 'REQUEST_DENIED' || data.status === 'OVER_QUERY_LIMIT' || data.status === 'INVALID_REQUEST') {
      console.warn('⚠️ Google reverse geocode unavailable or rejected key — falling back to Nominatim');
      const nom = await nominatimReverse(lat, lon);
      if (!nom) return res.status(404).json({ success: false, message: 'Location not found' });

      const result = {
        success: true,
        place: {
          name: nom.display_name.split(',')[0],
          display_name: nom.display_name,
          address: nom.address || {},
          lat: parseFloat(lat),
          lon: parseFloat(lon)
        }
      };
      geocodeCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return res.json(result);
    }

    // Get the most specific address result
    const bestResult = data.results[0];
    const addressComponents = bestResult.address_components || [];

    // Parse address components for structured data
    const addressMap = {};
    addressComponents.forEach(comp => {
      comp.types.forEach(type => {
        addressMap[type] = comp.long_name;
      });
    });

    const result = {
      success: true,
      place: {
        name: bestResult.formatted_address.split(',')[0],
        display_name: bestResult.formatted_address,
        address: {
          house_number: addressMap['street_number'],
          road: addressMap['route'],
          neighbourhood: addressMap['neighborhood'],
          city: addressMap['locality'] || addressMap['administrative_area_level_2'],
          state: addressMap['administrative_area_level_1'],
          postcode: addressMap['postal_code'],
          country: addressMap['country'],
        },
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        placeId: bestResult.place_id,
      }
    };

    geocodeCache.set(cacheKey, { data: result, timestamp: Date.now() });

    res.json(result);

  } catch (error) {
    console.error('❌ Reverse geocoding error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reverse geocode',
      error: error.message
    });
  }
};
