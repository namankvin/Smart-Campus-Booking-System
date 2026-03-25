const Menu = require('../models/Menu');

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
    const { vendor, date, items } = req.body;
    
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
    const { vendor, date, items } = req.body;
    
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