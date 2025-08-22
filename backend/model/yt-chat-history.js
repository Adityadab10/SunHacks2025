import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const ytChatHistorySchema = new mongoose.Schema({
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
  videoTitle: {
    type: String,
    required: true
  },
  videoChannel: {
    type: String,
    default: 'Unknown Channel'
  },
  videoUrl: {
    type: String,
    required: true
  },
  sessionName: {
    type: String,
    default: function() {
      return `Chat about ${this.videoTitle.substring(0, 30)}...`;
    }
  },
  messages: [messageSchema],
  lastActiveAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
ytChatHistorySchema.index({ userId: 1, videoId: 1 });
ytChatHistorySchema.index({ userId: 1, lastActiveAt: -1 });

export default mongoose.model('YTChatHistory', ytChatHistorySchema);
