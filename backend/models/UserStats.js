import mongoose from "mongoose";

const userStatsSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  date: { type: String, required: true }, // format: YYYY-MM-DD
  totalTime: { type: Number, default: 0 }, // in seconds
  lastLoginDate: { type: String, default: null },
  currentStreak: { type: Number, default: 0 },
  maxStreak: { type: Number, default: 0 }
});

userStatsSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model("UserStats", userStatsSchema);
