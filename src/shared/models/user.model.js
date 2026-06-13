const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) throw new Error('Invalid email');
      },
    },
    phone: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, trim: true, minlength: 8, select: false },
    avatarUrl: { type: String, default: '' },
    role: { type: String, enum: ['user', 'admin', 'host'], default: 'user' },
    kycStatus: { type: String, enum: ['Pending', 'Verified', 'Rejected'], default: 'Pending' },
    kycDetail: { type: String, default: '' },
    location: {
      city: { type: String, default: '' },
      country: { type: String, default: '' },
      label: { type: String, default: '' },
      coordinates: { type: [Number], default: undefined },
    },
    tier: { type: String, default: 'Standard' },
    favorites: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Car' }],
    hostMetrics: {
      totalListings: { type: Number, default: 0 },
      totalEarnings: { type: Number, default: 0 },
    },
    referralCode: { type: String, unique: true, sparse: true },
    totalInvites: { type: Number, default: 0 },
    rewardsEarned: { type: Number, default: 0 },
    notificationCount: { type: Number, default: 0 },
    recentNote: { type: String, default: '' },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    joinedDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

userSchema.statics.isPhoneTaken = async function (phone, excludeUserId) {
  const user = await this.findOne({ phone, _id: { $ne: excludeUserId } });
  return !!user;
};

userSchema.methods.isPasswordMatch = async function (password) {
  return bcrypt.compare(password, this.password);
};

userSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  if (!this.referralCode) {
    this.referralCode = `HIT${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }
});

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
