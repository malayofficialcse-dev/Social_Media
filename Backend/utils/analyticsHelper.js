import Analytics from "../Models/Analytics.js";
import axios from "axios";

// Helper to get location from IP
export const getLocation = async (ip) => {
  try {
    // For local development, mock some locations if IP is local/private
    if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.')) {
      const mocks = [
        { city: 'New York', country: 'United States', countryCode: 'US', lat: 40.7128, lng: -74.0060 },
        { city: 'London', country: 'United Kingdom', countryCode: 'GB', lat: 51.5074, lng: -0.1278 },
        { city: 'Mumbai', country: 'India', countryCode: 'IN', lat: 19.0760, lng: 72.8777 },
        { city: 'Tokyo', country: 'Japan', countryCode: 'JP', lat: 35.6762, lng: 139.6503 },
        { city: 'Paris', country: 'France', countryCode: 'FR', lat: 48.8566, lng: 2.3522 }
      ];
      return mocks[Math.floor(Math.random() * mocks.length)];
    }

    const { data } = await axios.get(`https://ipapi.co/${ip}/json/`);
    return {
      city: data.city,
      country: data.country_name,
      countryCode: data.country_code,
      lat: data.latitude,
      lng: data.longitude
    };
  } catch (error) {
    console.error("Geo-location lookup failed:", error.message);
    return null;
  }
};

export const logAnalytics = async (type, userId, targetUserId, postId, ip) => {
  try {
    const location = await getLocation(ip);
    await Analytics.create({
      type,
      userId,
      targetUserId,
      postId,
      location
    });
  } catch (error) {
    console.error("Analytics logging failed:", error.message);
  }
};
