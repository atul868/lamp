const mongoose = require('mongoose');

const { Schema } = mongoose;

const UserNotification = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  notificationData: {
    notification: {
      title: {
        type: String,
        required: true
      },
      body: String,
      icon: {
        type: Schema.Types.Mixed
      }
    },
    data: Schema.Types.Mixed
  },
  devices: [
    {
      token: {
        type: String,
        required: true
      },
      success: {
        type: Boolean,
        required: true
      },
      response: Schema.Types.Mixed
    }
  ],
  success: {
    type: Boolean,
    required: true,
    default: false
  }
});

const Notification = new Schema(
  {
    notificationData: {
      notification: {
        title: {
          type: String,
          required: true
        },
        body: String
      },
      data: Schema.Types.Mixed
    },
    userNotifications: [UserNotification],
    successCount: {
      type: Number,
      default: 0
    },
    failureCount: {
      type: Number,
      default: 0
    },
    generatedBy: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('notifications', Notification);
