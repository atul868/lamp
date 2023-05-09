const handlebars = require('handlebars');
const NotificationModel = require('./schema');
const UserModel = require('../member/schema');
const notificationFacade = require('./facade');
const { sendNotification } = require('../../utils/fcm');
class NotificationController {
  async send(req, res, next) {
    try {
      let Users;
      const query = {};
      const { users, notificationData } = req.body;
      const { from, to, search } = req.query;
      if (!users) {
        if (from || to) {
          query.createdAt = {};
          if (from) {
            query.createdAt.$gte = new Date(from);
          }
          if (to) {
            query.createdAt.$lte = new Date(to);
          }
        }

        if (search) {
          query.$or = [
            {
              name: {
                $regex: new RegExp(search.toLowerCase().replace(/\s+/g, '\\s+'), 'gi')
              }
            },
            {
              email: {
                $regex: new RegExp(`^${search.toLowerCase()}`, 'ig')
              }
            },
            {
              phone: {
                $regex: new RegExp(`^${search.toLowerCase()}`, 'ig')
              }
            }
          ];
        }
        Users = await UserModel.find(query);
      } else {
        Users = await UserModel.find({ _id: { $in: users } }).select('name  email phone deviceTokens');
      }
      const notification = new NotificationModel({ notificationData });
      for (const user of Users) {
        const userNotification = {
          user: user._id,
          devices: []
        };
        const message = {
          notification: {
            title: handlebars.compile(notificationData.notification.title)
          },
          data: notificationData.data
        };
        if (notificationData.notification.body) {
          message.notification.body = handlebars.compile(notificationData.notification.body);
          message.notification.body = message.notification.body(user.toJSON());
        }
        message.notification.title = message.notification.title(user.toJSON());
        userNotification.notificationData = message;
        if (user.deviceTokens && user.deviceTokens.length) {
          for (const token of user.deviceTokens) {
            const device = {
              token
            };
            message.to = token;
            try {
              device.response = await sendNotification(message);
              device.success = true;
              userNotification.success = true;
            } catch (err) {
              device.response = err;
              device.success = false;
            }
            userNotification.devices.push(device);
          }
        }
        notification.userNotifications.push(userNotification);
        if (userNotification.success) {
          notification.successCount += 1;
        } else {
          notification.failureCount += 1;
        }
      }
      await notification.save();
      res.json({ message: 'Notification Sent' });
    } catch (err) {
      return next(err);
    }
  }

  async get(req, res, next) {
    try {
      let { page, skip, limit, sortBy } = req.query;
      const { from, to } = req.query;
      const query = {};
      page = parseInt(page, 10) || 1;
      limit = parseInt(limit, 10) || 20;
      skip = (page - 1) * limit || 0;

      sortBy = sortBy || '-_id';

      if (from || to) {
        query.createdAt = {};
        if (from) {
          query.createdAt.$gte = new Date(from);
        }
        if (to) {
          query.createdAt.$lte = new Date(to);
        }
      }
      const notifications = await NotificationModel.find(query)
        .sort(sortBy)
        .skip(skip)
        .limit(limit);
      const meta = {
        currentPage: page,
        recordsPerPage: limit,
        totalRecords: await NotificationModel.find(query).count()
      };
      meta.totalPages = Math.ceil(meta.totalRecords / meta.recordsPerPage);
      const dataToSend = { notifications, meta };
      res.json(dataToSend);
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new NotificationController(notificationFacade);
