import mongoose from 'mongoose';

const youtubeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  videoId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  channel: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  briefSummary: {
    type: String,
    required: true
  },
  detailedSummary: {
    type: String,
    required: false
  },
  bulletPointsSummary: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
youtubeSchema.index({ userId: 1, createdAt: -1 });
youtubeSchema.index({ videoId: 1 });
youtubeSchema.index({ userId: 1, videoId: 1 }, { unique: true });

export default mongoose.model('Youtube', youtubeSchema);
