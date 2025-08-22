import mongoose from 'mongoose';

const studyBoardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  youtubeVideoId: {
    type: String,
    required: true
  },
  videoTitle: {
    type: String,
    required: true
  },
  videoChannel: {
    type: String,
    required: true
  },
  videoDuration: {
    type: String,
    required: true
  },
  videoUrl: {
    type: String,
    required: true
  },
  studyBoardName: {
    type: String,
    required: true
  },
  visibility: {
    type: String,
    enum: ['private', 'public', 'studygroup'],
    default: 'private',
    required: true
  },
  studyGroupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyGroup',
    required: function() {
      return this.visibility === 'studygroup';
    }
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  dislikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likeCount: {
    type: Number,
    default: 0
  },
  dislikeCount: {
    type: Number,
    default: 0
  },
  content: {
    tldr: {
      type: String,
      required: true
    },
    detailedSummary: {
      type: String,
      required: true
    },
    summary: {
      type: [String],
      required: true
    },
    flashcards: [{
      question: {
        type: String,
        required: true
      },
      answer: {
        type: String,
        required: true
      }
    }],
    quiz: [{
      question: {
        type: String,
        required: true
      },
      options: [{
        label: {
          type: String,
          required: true
        },
        text: {
          type: String,
          required: true
        },
        isCorrect: {
          type: Boolean,
          required: true
        }
      }],
      correctAnswer: {
        type: String,
        required: true
      },
      explanation: {
        type: String,
        required: true
      }
    }]
  }
}, {
  timestamps: true
});

// Index for efficient queries
studyBoardSchema.index({ userId: 1, createdAt: -1 });
studyBoardSchema.index({ youtubeVideoId: 1 });
studyBoardSchema.index({ userId: 1, youtubeVideoId: 1 });
studyBoardSchema.index({ visibility: 1, createdAt: -1 });
studyBoardSchema.index({ studyGroupId: 1, createdAt: -1 });
studyBoardSchema.index({ likeCount: -1, createdAt: -1 });

export default mongoose.model('StudyBoardYT', studyBoardSchema);
