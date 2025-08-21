import axios from "axios";

const API_URL = "http://localhost:5000/api"; // change to your backend URL

// Save session time for a user
export const sendSessionData = async (userId, timeSpent) => {
  try {
    await axios.post(`${API_URL}/user/${userId}/session`, { timeSpent });
  } catch (err) {
    console.error("Error sending session data:", err.response?.data || err.message);
  }
};

// Track login streaks
export const trackLogin = async (userId) => {
  try {
    const res = await axios.post(`${API_URL}/user/${userId}/login`);
    return res.data;
  } catch (err) {
    console.error("Error tracking login:", err.response?.data || err.message);
  }
};
