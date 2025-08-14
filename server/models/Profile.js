const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: [18, 'Age must be at least 18'],
    max: [100, 'Age cannot exceed 100']
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  photos: [{
    url: String,
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    },
    city: {
      type: String,
      trim: true,
      maxlength: [100, 'City name cannot exceed 100 characters']
    },
    state: {
      type: String,
      trim: true,
      maxlength: [100, 'State name cannot exceed 100 characters']
    },
    country: {
      type: String,
      trim: true,
      maxlength: [100, 'Country name cannot exceed 100 characters']
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  interests: [{
    type: String,
    trim: true
  }],
  occupation: {
    type: String,
    maxlength: [100, 'Occupation cannot exceed 100 characters']
  },
  education: {
    type: String,
    maxlength: [100, 'Education cannot exceed 100 characters']
  },
  height: {
    type: Number,
    min: [100, 'Height must be at least 100cm'],
    max: [250, 'Height cannot exceed 250cm']
  },
  bodyType: {
    type: String,
    enum: ['slim', 'athletic', 'average', 'curvy', 'plus-size', 'prefer-not-to-say'],
    default: 'prefer-not-to-say'
  },
  relationshipStatus: {
    type: String,
    enum: ['single', 'divorced', 'widowed', 'separated'],
    default: 'single'
  },
  lookingFor: {
    type: String,
    enum: ['serious-relationship', 'casual-dating', 'friendship', 'marriage'],
    default: 'serious-relationship'
  },
  hasChildren: {
    type: String,
    enum: ['yes', 'no', 'prefer-not-to-say'],
    default: 'prefer-not-to-say'
  },
  wantsChildren: {
    type: String,
    enum: ['yes', 'no', 'maybe', 'prefer-not-to-say'],
    default: 'prefer-not-to-say'
  },
  smoking: {
    type: String,
    enum: ['yes', 'no', 'occasionally', 'prefer-not-to-say'],
    default: 'prefer-not-to-say'
  },
  drinking: {
    type: String,
    enum: ['yes', 'no', 'occasionally', 'prefer-not-to-say'],
    default: 'prefer-not-to-say'
  },
  religion: {
    type: String,
    maxlength: [50, 'Religion cannot exceed 50 characters']
  },
  languages: [{
    type: String,
    trim: true
  }],
  socialLinks: {
    instagram: String,
    facebook: String,
    twitter: String
  },
  isComplete: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for location-based queries
profileSchema.index({ location: '2dsphere' });

// Index for search functionality
profileSchema.index({ 
  name: 'text', 
  bio: 'text', 
  interests: 'text',
  occupation: 'text'
});

// Calculate profile completion percentage
profileSchema.methods.getCompletionPercentage = function() {
  const fields = [
    'name', 'age', 'bio', 'avatar', 'location', 'interests',
    'occupation', 'education', 'height', 'bodyType',
    'relationshipStatus', 'lookingFor', 'hasChildren',
    'wantsChildren', 'smoking', 'drinking', 'religion', 'languages'
  ];
  
  let completedFields = 0;
  fields.forEach(field => {
    if (this[field] && this[field] !== '' && this[field] !== 'prefer-not-to-say') {
      completedFields++;
    }
  });
  
  return Math.round((completedFields / fields.length) * 100);
};

// Get distance from another profile
profileSchema.methods.getDistanceFrom = function(otherProfile) {
  if (!this.location.coordinates || !otherProfile.location.coordinates) {
    return null;
  }
  
  const R = 6371; // Earth's radius in km
  const lat1 = this.location.coordinates[1] * Math.PI / 180;
  const lat2 = otherProfile.location.coordinates[1] * Math.PI / 180;
  const deltaLat = (otherProfile.location.coordinates[1] - this.location.coordinates[1]) * Math.PI / 180;
  const deltaLon = (otherProfile.location.coordinates[0] - this.location.coordinates[0]) * Math.PI / 180;
  
  const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c;
};

// Get public profile data
profileSchema.methods.getPublicData = function() {
  const profileObject = this.toObject();
  delete profileObject.__v;
  delete profileObject.isComplete;
  delete profileObject.isPublic;
  return profileObject;
};

module.exports = mongoose.model('Profile', profileSchema); 