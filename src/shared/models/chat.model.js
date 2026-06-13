const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    user: { type: mongoose.SchemaTypes.ObjectId, ref: 'User', required: true },
    appContext: { type: String, enum: ['user', 'admin'], default: 'user' },
    messages: [
      {
        role: { type: String, enum: ['user', 'model', 'assistant'], required: true },
        parts: [{ text: { type: String, required: true } }],
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

chatSchema.pre('save', function () {
  if (this.messages.length > 20) this.messages = this.messages.slice(-20);
});

const Chat = mongoose.model('Chat', chatSchema);
module.exports = Chat;
