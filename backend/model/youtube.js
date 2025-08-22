import mongoose from 'mongoose';

const youtubeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  videoId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  channel: {
    type: String,
    default: 'Unknown Channel'
  },
  duration: {
    type: String,
    default: 'Unknown'
  },
  url: {
    type: String,
    required: true
  },
  transcript: {
    type: String,
    default: ''
  },
  briefSummary: {
    type: String,
    required: true
  },
  detailedSummary: {
    type: String,
    default: ''
  },
  bulletPointsSummary: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for efficient queries
youtubeSchema.index({ userId: 1, createdAt: -1 });
youtubeSchema.index({ videoId: 1 });
youtubeSchema.index({ userId: 1, videoId: 1 }, { unique: true });

export default mongoose.model('Youtube', youtubeSchema);
