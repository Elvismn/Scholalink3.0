const Staff = require("../../models/Staff");

const createStaff = async (req, res) => {
  try {
    const staff = await Staff.create(req.body);
    await staff.populate('user department subjects');
    
    res.status(201).json({
      success: true,
      data: { staff }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

const getStaff = async (req, res) => {
  try {
    const { department, position, search, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (department) filter.department = department;
    if (position) filter.position = position;
    if (search) {
      filter.$or = [
        { 'user.profile.firstName': { $regex: search, $options: 'i' } },
        { 'user.profile.lastName': { $regex: search, $options: 'i' } },
        { 'user.email': { $regex: search, $options: 'i' } }
      ];
    }

    const staff = await Staff.find(filter)
      .populate('user department subjects')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Staff.countDocuments(filter);

    res.json({
      success: true,
      data: {
        staff,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalStaff: total
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

const getOneStaff = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id)
      .populate('user department subjects');

    if (!staff) {
      return res.status(404).json({
        success: false,
        error: 'Staff not found'
      });
    }

    res.json({
      success: true,
      data: { staff }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const updateStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('user department subjects');

    if (!staff) {
      return res.status(404).json({
        success: false,
        error: 'Staff not found'
      });
    }

    res.json({
      success: true,
      data: { staff }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

const deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        error: 'Staff not found'
      });
    }

    res.json({
      success: true,
      message: 'Staff deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  createStaff,
  getStaff,
  getOneStaff,
  updateStaff,
  deleteStaff,
};