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

export default mongoose.model('StudyBoardYT', studyBoardSchema);
