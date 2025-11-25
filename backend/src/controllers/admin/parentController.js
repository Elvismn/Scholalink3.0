const Parent = require("../../models/Parent");

const createParent = async (req, res) => {
  try {
    const parent = await Parent.create(req.body);
    await parent.populate('user children');
    
    res.status(201).json({
      success: true,
      data: { parent }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

const getParents = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (search) {
      filter.$or = [
        { 'user.profile.firstName': { $regex: search, $options: 'i' } },
        { 'user.profile.lastName': { $regex: search, $options: 'i' } },
        { 'user.email': { $regex: search, $options: 'i' } }
      ];
    }

    const parents = await Parent.find(filter)
      .populate('user children')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Parent.countDocuments(filter);

    res.json({
      success: true,
      data: {
        parents,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalParents: total
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

const getParent = async (req, res) => {
  try {
    const parent = await Parent.findById(req.params.id)
      .populate('user children');

    if (!parent) {
      return res.status(404).json({
        success: false,
        error: 'Parent not found'
      });
    }

    res.json({
      success: true,
      data: { parent }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const updateParent = async (req, res) => {
  try {
    const parent = await Parent.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('user children');

    if (!parent) {
      return res.status(404).json({
        success: false,
        error: 'Parent not found'
      });
    }

    res.json({
      success: true,
      data: { parent }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

const deleteParent = async (req, res) => {
  try {
    const parent = await Parent.findByIdAndDelete(req.params.id);

    if (!parent) {
      return res.status(404).json({
        success: false,
        error: 'Parent not found'
      });
    }

    res.json({
      success: true,
      message: 'Parent deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  createParent,
  getParents,
  getParent,
  updateParent,
  deleteParent,
};