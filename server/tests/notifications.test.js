const request = require('supertest');
const { createAppServer } = require('../app');
const Notification = require('../models/Notification');
const { createUserAndToken } = require('./helpers');

describe('Notifications API', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  });

  it('returns user notifications and unread count', async () => {
    const { app } = createAppServer();
    const { user, token } = await createUserAndToken();

    await Notification.create([
      { recipient: user._id, title: 'A', message: 'msg A', isRead: false },
      { recipient: user._id, title: 'B', message: 'msg B', isRead: true }
    ]);

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.notifications).toHaveLength(2);
    expect(res.body.unreadCount).toBe(1);
  });

  it('marks all notifications as read', async () => {
    const { app } = createAppServer();
    const { user, token } = await createUserAndToken();

    await Notification.create([
      { recipient: user._id, title: 'A', message: 'msg A', isRead: false },
      { recipient: user._id, title: 'B', message: 'msg B', isRead: false }
    ]);

    await request(app)
      .patch('/api/notifications/read-all')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const unread = await Notification.countDocuments({ recipient: user._id, isRead: false });
    expect(unread).toBe(0);
  });
});
