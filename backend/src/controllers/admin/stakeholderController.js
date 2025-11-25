const Stakeholder = require("../../models/Stakeholder");

const createStakeholder = async (req, res) => {
  try {
    const stakeholder = await Stakeholder.create(req.body);
    
    res.status(201).json({
      success: true,
      data: { stakeholder }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

const getStakeholders = async (req, res) => {
  try {
    const { type, status, search, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { organization: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const stakeholders = await Stakeholder.find(filter)
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Stakeholder.countDocuments(filter);

    res.json({
      success: true,
      data: {
        stakeholders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalStakeholders: total
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

const getStakeholder = async (req, res) => {
  try {
    const stakeholder = await Stakeholder.findById(req.params.id);

    if (!stakeholder) {
      return res.status(404).json({
        success: false,
        error: 'Stakeholder not found'
      });
    }

    res.json({
      success: true,
      data: { stakeholder }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const updateStakeholder = async (req, res) => {
  try {
    const stakeholder = await Stakeholder.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!stakeholder) {
      return res.status(404).json({
        success: false,
        error: 'Stakeholder not found'
      });
    }

    res.json({
      success: true,
      data: { stakeholder }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

const deleteStakeholder = async (req, res) => {
  try {
    const stakeholder = await Stakeholder.findByIdAndDelete(req.params.id);

    if (!stakeholder) {
      return res.status(404).json({
        success: false,
        error: 'Stakeholder not found'
      });
    }

    res.json({
      success: true,
      message: 'Stakeholder deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  createStakeholder,
  getStakeholders,
  getStakeholder,
  updateStakeholder,
  deleteStakeholder,
};