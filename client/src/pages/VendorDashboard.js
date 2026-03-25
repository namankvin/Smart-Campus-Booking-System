import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/authContext';
import { adminService, menuService } from '../services/api';

const VendorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const defaultVendorName = useMemo(() => user?.name || '', [user]);
  const [vendorName, setVendorName] = useState('');
  const [menuDate, setMenuDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', description: '', price: '', category: '', isAvailable: true });
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchMenu = async () => {
    try {
      const res = await menuService.getByVendor(vendorName, menuDate);
      setItems(res.data.items || []);
    } catch (err) {
      setError('Failed to fetch menu');
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await adminService.getVendorOrders(vendorName);
      setOrders(res.data || []);
    } catch (err) {
      setError('Failed to fetch orders');
    }
  };

  useEffect(() => {
    if (!vendorName && defaultVendorName) {
      setVendorName(defaultVendorName);
      return;
    }

    if (vendorName) {
      fetchMenu();
      fetchOrders();
    }
  }, [vendorName, menuDate, defaultVendorName]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price) {
      setError('Item name and price are required');
      return;
    }

    try {
      await menuService.addItems({
        vendor: vendorName,
        date: menuDate,
        items: [{ ...newItem, price: Number(newItem.price) }]
      });
      setSuccess('Menu item added');
      setError('');
      setNewItem({ name: '', description: '', price: '', category: '', isAvailable: true });
      fetchMenu();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add menu item');
    }
  };

  const toggleItemAvailability = async (index) => {
    const updated = items.map((item, i) => (i === index ? { ...item, isAvailable: !item.isAvailable } : item));
    try {
      await menuService.updateItems({ vendor: vendorName, date: menuDate, items: updated });
      setItems(updated);
      setSuccess('Menu updated');
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update menu');
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await adminService.updateOrderStatus(orderId, { status });
      setSuccess('Order status updated');
      setError('');
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update order status');
    }
  };

  return (
    <div>
      <nav className="navbar">
        <h1>Vendor Dashboard</h1>
        <div className="navbar-menu">
          <span>Welcome, {user?.name}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="container">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="card">
          <h2>Menu Management</h2>
          <div className="form-group">
            <label>Vendor Outlet Name</label>
            <input
              type="text"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder="e.g. Taaza Tiffins"
            />
          </div>

          <div className="form-group">
            <label>Date</label>
            <input type="date" value={menuDate} onChange={(e) => setMenuDate(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Item Name</label>
            <input
              type="text"
              value={newItem.name}
              onChange={(e) => setNewItem((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <input
              type="text"
              value={newItem.description}
              onChange={(e) => setNewItem((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Category</label>
            <input
              type="text"
              value={newItem.category}
              onChange={(e) => setNewItem((prev) => ({ ...prev, category: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Price</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={newItem.price}
              onChange={(e) => setNewItem((prev) => ({ ...prev, price: e.target.value }))}
            />
          </div>
          <button className="button" onClick={handleAddItem}>Add Item</button>

          <h3 style={{ marginTop: '20px' }}>Current Menu</h3>
          {items.length === 0 ? (
            <p>No items for selected date.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Available</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={`${item.name}-${index}`}>
                    <td>{item.name}</td>
                    <td>${item.price}</td>
                    <td>{item.isAvailable ? 'Yes' : 'No'}</td>
                    <td>
                      <button className="button" onClick={() => toggleItemAvailability(index)}>
                        Toggle Availability
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h2>Active Orders</h2>
          {orders.length === 0 ? (
            <p>No active orders.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>{order.user?.name || 'Unknown'}</td>
                    <td>
                      {(order.items || []).map((item) => `${item.name} x${item.quantity}`).join(', ')}
                    </td>
                    <td>{order.status}</td>
                    <td>
                      {order.status === 'Accepted' && (
                        <button className="button" onClick={() => updateOrderStatus(order._id, 'Preparing')}>
                          Mark Preparing
                        </button>
                      )}
                      {order.status === 'Preparing' && (
                        <button className="button" onClick={() => updateOrderStatus(order._id, 'Ready')}>
                          Mark Ready
                        </button>
                      )}
                      {order.status === 'Ready' && (
                        <button className="button" onClick={() => updateOrderStatus(order._id, 'Completed')}>
                          Mark Completed
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
