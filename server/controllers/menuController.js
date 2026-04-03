const Menu = require('../models/Menu');
const User = require('../models/User');

const getMappedRestaurantForVendor = async (userId) => {
  const user = await User.findById(userId);
  const mappedRestaurant = String(user?.assignedRestaurant || '').trim();
  if (!mappedRestaurant) {
    return null;
  }
  return mappedRestaurant;
};

const getMenuByVendor = async (req, res) => {
  try {
    const { vendor, date } = req.query;
    const menu = await Menu.findOne({ vendor, date: new Date(date) });
    res.json(menu || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const addMenuItems = async (req, res, io) => {
  try {
    const { date, items } = req.body;
    const vendor = await getMappedRestaurantForVendor(req.user.id);

    if (!vendor) {
      return res.status(403).json({ error: 'Vendor account is not mapped to a restaurant' });
    }
    
    let menu = await Menu.findOne({ vendor, date: new Date(date) });
    
    if (!menu) {
      menu = new Menu({ vendor, date: new Date(date), items });
    } else {
      menu.items.push(...items);
    }
    
    await menu.save();
    io.emit('menu_updated', { vendor, menu });
    
    res.status(201).json(menu);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateMenuItems = async (req, res, io) => {
  try {
    const { date, items } = req.body;
    const vendor = await getMappedRestaurantForVendor(req.user.id);

    if (!vendor) {
      return res.status(403).json({ error: 'Vendor account is not mapped to a restaurant' });
    }
    
    const menu = await Menu.findOneAndUpdate(
      { vendor, date: new Date(date) },
      { items },
      { new: true }
    );
    
    io.emit('menu_updated', { vendor, menu });
    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getMenuByVendor, addMenuItems, updateMenuItems };