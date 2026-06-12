const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    messages: [
      {
        role: {
          type: String,
          enum: ['user', 'model'],
          required: true,
        },
        parts: [
          {
            text: {
              type: String,
              required: true,
            },
          },
        ],
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Limiting history to last 20 messages to keep context window clean
chatSchema.pre('save', function () {
  if (this.messages.length > 20) {
    this.messages = this.messages.slice(-20);
  }
});

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
