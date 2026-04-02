import React, { useState, useEffect } from 'react';
import { bookingService, menuService } from '../services/api';
import { demoVendorMenus } from '../data/demoData';

const FoodOrdering = ({ onSuccess }) => {
  const [menus, setMenus] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [cart, setCart] = useState([]);
  const [pickupTime, setPickupTime] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [usingDemoMenu, setUsingDemoMenu] = useState(false);

  const vendors = Object.keys(demoVendorMenus);

  useEffect(() => {
    const loadMenu = async () => {
      try {
        setError('');
        const response = await menuService.getByVendor(selectedVendor, date);
        const apiItems = response?.data?.items || [];
        if (apiItems.length > 0) {
          setMenus(apiItems);
          setUsingDemoMenu(false);
        } else {
          setMenus(demoVendorMenus[selectedVendor] || []);
          setUsingDemoMenu(true);
        }
      } catch (err) {
        setMenus(demoVendorMenus[selectedVendor] || []);
        setUsingDemoMenu(true);
        setError('Live menu is unavailable. Showing sample items.');
      }
    };

    if (selectedVendor && date) {
      loadMenu();
    }
  }, [selectedVendor, date]);

  const addToCart = (item) => {
    const existing = cart.find(i => i.name === item.name);
    if (existing) {
      setCart(cart.map(i => i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemName) => {
    setCart(cart.filter(i => i.name !== itemName));
  };

  const handleOrder = async () => {
    if (!pickupTime) {
      setError('Please select pickup time');
      return;
    }

    try {
      const normalizedItems = cart.map((item) => ({
        name: item.name,
        quantity: item.quantity
      }));

      await bookingService.placeFoodOrder({
        vendor: selectedVendor,
        items: normalizedItems,
        pickupTime
      });
      setSuccess('Order placed successfully!');
      setError('');
      setCart([]);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to place order');
    }
  };

  const totalCost = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="card">
      <h2>Order Food</h2>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      {usingDemoMenu && selectedVendor && (
        <div className="alert alert-warning">Showing demo menu items for {selectedVendor}.</div>
      )}
      
      <div className="form-group">
        <label>Vendor</label>
        <select value={selectedVendor} onChange={(e) => setSelectedVendor(e.target.value)}>
          <option value="">Select vendor</option>
          {vendors.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>
      
      <div className="form-group">
        <label>Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {selectedVendor && (
        <>
          <h3>Menu Items</h3>
          {menus.length === 0 ? (
            <p>No menu items found for this restaurant and date.</p>
          ) : (
            menus.map((item) => (
              <div key={item.name} className="metric-card" style={{ marginBottom: '10px' }}>
                <div><strong>{item.name}</strong> - ${item.price}</div>
                <small>{item.description || 'Freshly prepared item'}</small>
                <div style={{ marginTop: '6px', color: '#9fb0ca' }}>
                  Category: {item.category || 'General'}
                  {item.prepTimeMins ? ` | Prep Time: ${item.prepTimeMins} mins` : ''}
                </div>
                <div className={item.isAvailable === false ? 'status-offline' : 'status-online'} style={{ marginTop: '6px' }}>
                  {item.isAvailable === false ? 'Currently Unavailable' : 'Available'}
                </div>
                <button
                  onClick={() => addToCart(item)}
                  className="button"
                  style={{ marginTop: '8px' }}
                  disabled={item.isAvailable === false}
                >
                  Add to Cart
                </button>
              </div>
            ))
          )}
        </>
      )}

      {cart.length > 0 && (
        <>
          <h3>Cart</h3>
          {cart.map(item => (
            <div key={item.name} style={{ padding: '10px', background: 'rgba(255,255,255,0.08)', marginBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
              <span>{item.name} x {item.quantity} = ${item.price * item.quantity}</span>
              <button onClick={() => removeFromCart(item.name)} className="button button-danger">Remove</button>
            </div>
          ))}
          <h3>Total: ${totalCost}</h3>
          
          <div className="form-group">
            <label>Pickup Date & Time</label>
            <input
              type="datetime-local"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              required
            />
          </div>
          
          <button onClick={handleOrder} className="button button-success">Place Order</button>
        </>
      )}
    </div>
  );
};

export default FoodOrdering;