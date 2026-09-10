const mongoose = require('mongoose');

// Controlled list of valid service categories
const VALID_CATEGORIES = [
  'Cleaning',
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Painting',
  'Appliance Repair',
  'Beauty & Wellness',
  'Home Maintenance',
  'Other'
];

const serviceLocationSchema = new mongoose.Schema({
  address: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  pincode: { type: String, trim: true }
}, { _id: false });

const profilePhotoSchema = new mongoose.Schema({
  url: { type: String },
  publicId: { type: String }
}, { _id: false });

const documentSchema = new mongoose.Schema({
  type: { type: String },
  url: { type: String },
  publicId: { type: String },
  originalName: { type: String }
});

const providerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    phone: {
      type: String,
      trim: true
    },
    profilePhoto: profilePhotoSchema,
    categories: [{
      type: String,
      enum: VALID_CATEGORIES
    }],
    skills: [{
      type: String,
      trim: true
    }],
    experience: {
      type: Number,
      min: [0, 'Experience cannot be negative']
    },
    serviceLocation: serviceLocationSchema,
    documents: [documentSchema],
    rejectionRemark: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

const ProviderProfile = mongoose.model('ProviderProfile', providerProfileSchema);

module.exports = { ProviderProfile, VALID_CATEGORIES };
