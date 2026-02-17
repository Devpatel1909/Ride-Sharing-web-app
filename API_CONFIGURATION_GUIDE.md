# API Configuration Guide - Vehicle Number Plate & License Verification

## ✅ CONFIGURED: Vehicle RC Information API is Ready!

Your app is now using **Vehicle RC Information V2** API from RapidAPI with your API key configured.

---

## 🚗 Current Vehicle Number Plate API Configuration

### Active API: Vehicle RC Information V2

**Status:** ✅ Configured and ready to use  
**API Provider:** RapidAPI  
**API Link:** https://rapidapi.com/suneetk92/api/vehicle-rc-information-v2  
**Integration:** Complete in `frontend/src/pages/Rider/Signup.jsx` (line ~200)

### Your Request Format:

```bash
curl --request POST \
  --url https://vehicle-rc-information-v2.p.rapidapi.com/ \
  --header 'Content-Type: application/json' \
  --header 'x-rapidapi-host: vehicle-rc-information-v2.p.rapidapi.com' \
  --header 'x-rapidapi-key: fa6e4a4600msh5b363896fc69bd9p18ffc5jsn584834129323' \
  --data '{"vehicle_number":"PB65AM0008"}'
```

### How It Works:

The code in `Signup.jsx` automatically:
1. Takes the vehicle number from input (e.g., DL01AB1234)
2. Formats it (removes spaces, converts to uppercase)
3. Calls the RapidAPI endpoint
4. Maps the response to form fields:
   - `maker_model` → Vehicle Model
   - `color` → Vehicle Color
   - `seating_capacity` → Vehicle Capacity
   - `vehicle_class_desc` → Vehicle Type (car/moto/auto/suv)

### Expected API Response:

```json
{
  "result": {
    "vehicle_number": "DL01AB1234",
    "maker_model": "HONDA CITY",
    "color": "WHITE",
    "seating_capacity": "5",
    "vehicle_class_desc": "MOTOR CAR(LMV)",
    "vehicle_category": "LMV",
    "vehicle_manufacturer_name": "HONDA",
    "registration_date": "2020-05-15",
    "fuel_type": "PETROL"
  },
  "status": "success"
}
```

---

## 🧪 Testing the Integration

### Quick Test:

1. **Start your frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Navigate to Rider Signup:**
   - Open http://localhost:5174
   - Go to `/rider-login` → Click "Sign up"

3. **Test vehicle auto-fetch:**
   - Enter vehicle number: **PB65AM0008** (or DL01AB1234, MH02CD5678)
   - Click the 🔍 **Search** button next to vehicle plate field
   - Watch the fields auto-fill!

4. **Check browser console (F12):**
   - Look for "API Response:" to see raw data
   - Any errors will appear here

### What to Expect:

✅ **Success Response:**
- Loading spinner appears briefly
- Green message: "Vehicle details fetched successfully!"
- All fields fill automatically:
  - Vehicle Model: e.g., "HONDA CITY"
  - Vehicle Color: e.g., "WHITE"
  - Vehicle Type: e.g., "car"
  - Vehicle Capacity: e.g., "5"

❌ **Error Response:**
- Red message: "Vehicle not found. Please check the number..."
- Fields remain editable for manual entry
- You can still complete signup manually

---

## 📊 API Usage & Limits

### Your RapidAPI Account:

- **Application:** default-application_11575684
- **API Key:** fa6e4a4600msh5b363896fc69bd9p18ffc5jsn584834129323
- **Check Usage:** [RapidAPI Dashboard](https://rapidapi.com/developer/dashboard)

### Monitoring:

1. Go to [RapidAPI Dashboard](https://rapidapi.com/developer/dashboard)
2. Click "Analytics" to see usage stats
3. Monitor your requests/month limit
4. Most free tiers offer 100-500 requests/month

### Upgrading if Needed:

- If you exceed free tier limits, you'll see errors
- Upgrade options usually start at $5-20/month
- Check the API pricing page for plans

---

## 🔒 Security Best Practices

### ⚠️ Current Setup: API Key in Frontend Code

**Current status:** Your API key is directly in the code (`Signup.jsx`)  
**Risk:** Anyone can see it in browser DevTools  
**For development:** This is OK for testing  
**For production:** Follow security steps below

### 🛡️ Production Security: Move to Backend

**Create backend endpoint to hide API key:**

#### Step 1: Backend Route (Express.js)

Create: `backend/routes/vehicle.routes.js`

```javascript
const express = require('express');
const router = express.Router();

router.post('/verify-vehicle', async (req, res) => {
  try {
    const { vehicleNumber } = req.body;
    
    // Validate input
    if (!vehicleNumber) {
      return res.status(400).json({ error: 'Vehicle number required' });
    }

    // Call RapidAPI from backend (API key hidden from frontend)
    const response = await fetch('https://vehicle-rc-information-v2.p.rapidapi.com/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': 'vehicle-rc-information-v2.p.rapidapi.com',
        'x-rapidapi-key': process.env.RAPIDAPI_KEY // From environment variable
      },
      body: JSON.stringify({ vehicle_number: vehicleNumber })
    });

    if (!response.ok) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Vehicle verification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
```

#### Step 2: Add to Express App

In `backend/app.js` or `backend/server.js`:

```javascript
const vehicleRoutes = require('./routes/vehicle.routes');
app.use('/api', vehicleRoutes);
```

#### Step 3: Environment Variable

Create `.env` in backend folder:

```env
RAPIDAPI_KEY=fa6e4a4600msh5b363896fc69bd9p18ffc5jsn584834129323
```

Add to `.gitignore`:
```
.env
.env.local
```

#### Step 4: Update Frontend Code

In `frontend/src/pages/Rider/Signup.jsx`, update `fetchVehicleDetails`:

```javascript
const response = await fetch('http://localhost:3000/api/verify-vehicle', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ vehicleNumber: formattedNumber })
});
```

**Benefits:**
- ✅ API key completely hidden from frontend
- ✅ Can add rate limiting (e.g., max 10 requests per minute per user)
- ✅ Can add caching (store verified vehicles temporarily)
- ✅ Can add logging and analytics
- ✅ Better error handling and security

---

## 🐛 Troubleshooting

### Issue: "Vehicle details not found"

**Possible causes:**

1. **Invalid vehicle number format**
   - ✅ Valid: DL01AB1234, MH02CD5678, PB65AM0008
   - ❌ Invalid: DL-01-AB-1234 (but code handles this by removing spaces)
   - Make sure it's a real, registered Indian vehicle

2. **Not subscribed to API**
   - Go to [Vehicle RC Information V2 API](https://rapidapi.com/suneetk92/api/vehicle-rc-information-v2)
   - Make sure you clicked "Subscribe to Test"
   - Choose free plan if available

3. **Free tier exhausted**
   - Check your usage in RapidAPI dashboard
   - Wait for monthly reset or upgrade plan

4. **Vehicle not in database**
   - Very new vehicles may not be in the database yet
   - Some states update slower than others
   - Solution: Allow manual entry

### Issue: CORS Error in Browser Console

**Error message:** "has been blocked by CORS policy"

**Solutions:**

1. **Quick fix (development):**
   - This API should support CORS, but if you see errors
   - Use browser extension to disable CORS temporarily (dev only!)

2. **Proper fix (production):**
   - Move API call to backend (see Security section above)
   - Backend can make request without CORS issues

### Issue: "Invalid API key" or 401 Unauthorized

**Solutions:**

1. **Check API key exactly:**
   - Should be: `fa6e4a4600msh5b363896fc69bd9p18ffc5jsn584834129323`
   - No extra spaces or quotes
   - Copy directly from RapidAPI dashboard if uncertain

2. **Verify subscription:**
   - Make sure you're subscribed to the specific API
   - [Check subscriptions](https://rapidapi.com/developer/billing/subscriptions)

3. **API key regenerated:**
   - If you regenerated key in RapidAPI, update the code

### Issue: Request takes too long / times out

**Solutions:**

1. **Network issue:**
   - Check your internet connection
   - Try again after a moment

2. **API overloaded:**
   - Some APIs are slower during peak hours
   - Consider adding a timeout (e.g., 10 seconds)

3. **Add timeout to fetch:**
   ```javascript
   const controller = new AbortController();
   const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
   
   const response = await fetch(url, {
     signal: controller.signal,
     // ... other options
   });
   ```

### Issue: Response format doesn't match expected

**Solution:**

1. **Check API response in console:**
   - Look for `console.log('API Response:', data);` in Signup.jsx
   - Compare actual structure with expected

2. **Response might be:**
   ```json
   { "data": { ... } }  // instead of "result"
   { "vehicle": { ... } }
   { "rc": { ... } }
   ```

3. **Update mapping code:**
   ```javascript
   const vehicleData = data.result || data.data || data.vehicle || data.rc;
   ```

---

## 📋 Valid Indian Vehicle Number Formats

### Format: XX##XX#### or XX-##-XX-####

**Examples:**
- DL01AB1234 (Delhi)
- MH02CD5678 (Maharashtra)
- KA03EF9012 (Karnataka)
- PB65AM0008 (Punjab)
- TN01BH3456 (Tamil Nadu)

**Components:**
- **XX** = State code (2 letters)
- **##** = District code (1-2 digits)
- **XX** = Series code (1-3 letters)
- **####** = Unique number (1-4 digits)

The code automatically handles spaces and hyphens.

---

## 📄 License Verification (Optional)

### Status: Format Validation Only

Currently, the app validates Indian driving license format but doesn't verify with a live API.

**License format:** XX##YYYY####### (e.g., DL0120220012345)

### To Add Live Verification:

1. **Option: RapidAPI**
   - Search for "Indian Driving License Verification"
   - Similar setup to vehicle API

2. **Option: Parivahan Sarathi API**
   - Visit [sarathi.parivahan.gov.in](https://sarathi.parivahan.gov.in/)
   - Register as developer
   - Free but slower setup

3. **Update code in** `Signup.jsx` → `verifyLicenseDetails` function

---

## 🎯 Quick Reference

### Files Modified:
- `frontend/src/pages/Rider/Signup.jsx` (line ~200-330)

### Key Functions:
- `fetchVehicleDetails(registrationNumber)` - Calls RapidAPI
- `handleFetchVehicleDetails()` - Button click handler
- `isValidIndianVehicleNumber(number)` - Format validation

### Test Vehicle Numbers:
- PB65AM0008 (your test number)
- DL01AB1234
- MH02CD5678

### Support Links:
- [RapidAPI Dashboard](https://rapidapi.com/developer/dashboard)
- [Vehicle RC API Docs](https://rapidapi.com/suneetk92/api/vehicle-rc-information-v2)
- [RapidAPI Support](https://rapidapi.com/support)

---

## ✅ Next Steps

1. **Test the integration:**
   - Start frontend: `cd frontend && npm run dev`
   - Go to Rider Signup page
   - Try fetching details for PB65AM0008

2. **Monitor usage:**
   - Check RapidAPI dashboard regularly
   - Set up alerts for quota limits

3. **For production:**
   - Move API key to backend (see Security section)
   - Add caching for repeated requests
   - Implement rate limiting
   - Consider upgrading to paid plan if needed

4. **Optional enhancements:**
   - Add license verification API
   - Store verified vehicles in database
   - Add admin panel to view verification stats

---

**Your API is configured and ready! Test it now by entering a vehicle number in the Rider Signup form.**
   - Implement request throttling
   - Monitor API usage through dashboard

---

## 📞 Support

If you need help:
1. Check RapidAPI documentation for your specific API
2. Test API calls in Postman first
3. Check browser console for detailed error messages
4. Verify API key is correct and has active subscription

---

## 🎯 Quick Start (3 Minutes)

**Want to test immediately? Here's the fastest way:**

1. Go to [RapidAPI.com](https://rapidapi.com)
2. Search "RTO Vehicle Information"
3. Subscribe (free tier)
4. Copy API key
5. Paste in `Signup.jsx` line ~215 where it says `'X-RapidAPI-Key': 'YOUR_RAPIDAPI_KEY_HERE'`
6. Uncomment that code block (remove the `/*` and `*/`)
7. Comment out or remove the demo code below it
8. Save and test!

That's it! Your vehicle number plate auto-fill should now work with real data! 🚀
