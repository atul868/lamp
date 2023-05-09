const mongoose = require('mongoose');
const authUtils = require('../../utils/auth');
const { Schema } = mongoose;
const fileUtil = require('../../utils/file');

// mr can create retailer and address is required

const address = new Schema([
  {
    line1: { type: String },
    line2: { type: String },
    pincode: { type: Number },
    city: { type: String },
    state: { type: String },
    phone : {type : String},
    isPrimary: { type: Boolean, default: false },
    location: {
      type: { type: String },
      coordinates: []
    },
    name: { type: String }
  }
]);
const member = new Schema(
  {
    name: {
      type: String
    },
    companyName: {
      type: String
    },
    email: {
      type: String,
      unique: true
    },
    emailStatus: {
      type: String,
      enum: ['pending', 'verified'],
      default: 'pending'
    },
    password: {
      type: String
    },
    phone: {
      type: String
    },
    profilePic: {
      type: String
    },
    address: [address],
    mr: [
      {
        mrId: { type: Schema.Types.ObjectId, ref: 'member' },
        isPrimary: { type: Boolean, default: false }
      }
    ],
    stockist: [
      {
        stockistId: { type: Schema.Types.ObjectId, ref: 'member' },
        isPrimary: { type: Boolean, default: false }
      }
    ],
    token: {
      type: String
    },
    role: {
      type: String,
      enum: ['admin', 'mrManager', 'subAdmin', 'retailer', 'stockist', 'distributor', 'mr','customer']
    },
    otp: {
      type: Number
    },
    points: {
      type: Number
    },
    userId: {
      type: String
    },
    licence: {
      type: String
    },
    gst: {
      type: String
    },
    licenceDoc: {
      type: String
    },
    gstDoc: {
      type: String
    },
    otpExpiresAt: {
      type: Date
    },
    isDisabled: {
      type: Boolean,
      default: false
    },
    isApproved: {
      type: Boolean,
      default: true
    },
    contactPerson: {
      name: { type: String },
      phone: { type: String }
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    recentlyViewed: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'parentProduct' },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    deviceTokens: [String],
    devices: [String],
    referralCode: {
      type: String
    },
    referredCode: {
      type: String
    }
  },
  {
    versionKey: false,
    timestamps: true
  }
);

member.set('toJSON', {
  virtuals: true
});
member.set('toObject', {
  virtuals: true
});
member.index({ 'address.location': '2dsphere' });

member.virtual('signedUrlGst').get(function() {
  if (this.gstDoc) {
    return fileUtil.getSignedUrl(this.gstDoc);
  }
});

member.virtual('signedUrlLicence').get(function() {
  if (this.licenceDoc) {
    return fileUtil.getSignedUrl(this.licenceDoc);
  }
});

const memberSchema = mongoose.model('member', member);
module.exports = memberSchema;

memberSchema.prototype.createAccessToken = function(deviceType) {
  const that = this;
  return new Promise(async (resolve, reject) => {
    const criteriaForJWT = {
      _id: that._id,
      date: new Date()
    };
    let accessToken;
    try {
      accessToken = authUtils.generateAuthToken(criteriaForJWT);
    } catch (err) {
      return reject(err);
    }
    resolve({ accessToken });
  });
};
