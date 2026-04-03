import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { notificationService } from '../services/api';

const NotificationCenter = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const triggerRef = useRef(null);
  const [panelStyle, setPanelStyle] = useState({});

  const fetchNotifications = async () => {
    try {
      const response = await notificationService.getMine(20);
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      // Silent fail in navbar widget.
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return undefined;
    }

    fetchNotifications();

    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    const socket = io(socketUrl, {
      auth: {
        token: token ? `Bearer ${token}` : ''
      }
    });

    if (socket && typeof socket.on === 'function') {
      socket.on('notification_created', ({ notification }) => {
        if (!notification) return;
        setNotifications((prev) => [notification, ...prev].slice(0, 50));
        setUnreadCount((prev) => prev + (notification.isRead ? 0 : 1));
      });
    }

    const intervalId = setInterval(fetchNotifications, 60000);

    return () => {
      clearInterval(intervalId);
      if (socket && typeof socket.disconnect === 'function') {
        socket.disconnect();
      }
    };
  }, []);

  const markRead = async (id) => {
    try {
      await notificationService.markRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => (prev > 0 ? prev - 1 : 0));
    } catch (error) {
      // Silent fail in navbar widget.
    }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      // Silent fail in navbar widget.
    }
  };

  const handleToggle = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPanelStyle({
        top: `${rect.bottom + 8}px`,
        right: `${window.innerWidth - rect.right}px`
      });
    }
    setOpen((prev) => !prev);
  };

  return (
    <div className="notification-center">
      <button ref={triggerRef} className="notification-trigger" onClick={handleToggle}>
        Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}
      </button>

      {open && (
        <div className="notification-panel" style={panelStyle}>
          <div className="notification-header">
            <strong>Notifications</strong>
            <button className="button" onClick={markAllRead}>Mark all read</button>
          </div>

          {notifications.length === 0 ? (
            <p style={{ margin: 0 }}>No notifications yet.</p>
          ) : (
            <div className="notification-list">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`notification-item ${notification.isRead ? 'notification-read' : 'notification-unread'}`}
                >
                  <div className="notification-title">{notification.title}</div>
                  <div className="notification-message">{notification.message}</div>
                  <div className="notification-footer">
                    <small>{new Date(notification.createdAt).toLocaleString()}</small>
                    {!notification.isRead && (
                      <button className="button" onClick={() => markRead(notification._id)}>
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
