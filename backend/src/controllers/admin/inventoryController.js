const Inventory = require("../../models/Inventory");

const createInventory = async (req, res) => {
  try {
    const inventory = await Inventory.create(req.body);
    await inventory.populate('checkedBy');
    
    res.status(201).json({
      success: true,
      data: { inventory }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

const getInventories = async (req, res) => {
  try {
    const { category, condition, search, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (category) filter.category = category;
    if (condition) filter.condition = condition;
    if (search) {
      filter.$or = [
        { itemName: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const inventories = await Inventory.find(filter)
      .populate('checkedBy')
      .sort({ itemName: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Inventory.countDocuments(filter);

    res.json({
      success: true,
      data: {
        inventories,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalInventories: total
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id)
      .populate('checkedBy');

    if (!inventory) {
      return res.status(404).json({
        success: false,
        error: 'Inventory not found'
      });
    }

    res.json({
      success: true,
      data: { inventory }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const updateInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('checkedBy');

    if (!inventory) {
      return res.status(404).json({
        success: false,
        error: 'Inventory not found'
      });
    }

    res.json({
      success: true,
      data: { inventory }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

const deleteInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findByIdAndDelete(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        error: 'Inventory not found'
      });
    }

    res.json({
      success: true,
      message: 'Inventory deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  createInventory,
  getInventories,
  getInventory,
  updateInventory,
  deleteInventory,
};