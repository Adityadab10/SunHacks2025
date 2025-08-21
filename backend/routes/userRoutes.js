import express from "express";
import UserStats from "../models/UserStats.js";

const router = express.Router();

// Save session time
router.post("/user/:uid/session", async (req, res) => {
  try {
    const { uid } = req.params;
    const { timeSpent } = req.body;

    const today = new Date().toISOString().split("T")[0];

    await UserStats.updateOne(
      { userId: uid, date: today },
      { $inc: { totalTime: timeSpent } },
      { upsert: true }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Track login streak
router.post("/user/:uid/login", async (req, res) => {
  try {
    const { uid } = req.params;
    const today = new Date().toISOString().split("T")[0];

    let user = await UserStats.findOne({ userId: uid });

    if (!user) {
      // first login
      user = new UserStats({
        userId: uid,
        date: today,
        lastLoginDate: today,
        currentStreak: 1,
        maxStreak: 1,
      });
    } else {
      const lastLogin = new Date(user.lastLoginDate);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastLogin.toISOString().split("T")[0] === yesterday.toISOString().split("T")[0]) {
        user.currentStreak += 1;
      } else if (lastLogin.toISOString().split("T")[0] !== today) {
        user.currentStreak = 1;
      }

      user.lastLoginDate = today;
      if (user.currentStreak > user.maxStreak) {
        user.maxStreak = user.currentStreak;
      }
    }

    await user.save();
    res.json({ streak: user.currentStreak, maxStreak: user.maxStreak });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get session time for a user on a specific date
router.get("/user/:uid/session", async (req, res) => {
  try {
    const { uid } = req.params;
    const { date } = req.query;
    const today = date || new Date().toISOString().split("T")[0];
    const stats = await UserStats.findOne({ userId: uid, date: today });
    res.json({ totalTime: stats ? stats.totalTime : 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
