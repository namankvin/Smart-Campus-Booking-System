const Notification = require('../models/Notification');
const User = require('../models/User');

const createNotification = async ({ recipient, title, message, type = 'info', metadata = {}, io }) => {
  if (!recipient || !title || !message) {
    return null;
  }

  const notification = await Notification.create({
    recipient,
    title,
    message,
    type,
    metadata
  });

  if (io) {
    io.to(`user:${recipient.toString()}`).emit('notification_created', {
      notification
    });
  }

  return notification;
};

const notifyUsers = async ({ recipients = [], title, message, type = 'info', metadata = {}, io }) => {
  const uniqueRecipients = [...new Set((recipients || []).map((recipient) => recipient?.toString()).filter(Boolean))];
  if (uniqueRecipients.length === 0) {
    return [];
  }

  return Promise.all(
    uniqueRecipients.map((recipient) =>
      createNotification({ recipient, title, message, type, metadata, io })
    )
  );
};

const notifyRoles = async ({ roles = [], title, message, type = 'info', metadata = {}, io }) => {
  if (!Array.isArray(roles) || roles.length === 0) {
    return [];
  }

  const users = await User.find({ role: { $in: roles } }, '_id');
  return notifyUsers({
    recipients: users.map((user) => user._id),
    title,
    message,
    type,
    metadata,
    io
  });
};

module.exports = {
  createNotification,
  notifyUsers,
  notifyRoles
};
