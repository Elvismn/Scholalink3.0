const Club = require("../../models/Club");

const createClub = async (req, res) => {
  try {
    const club = await Club.create(req.body);
    await club.populate('patron members.student');
    
    res.status(201).json({
      success: true,
      data: { club }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

const getClubs = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { patron: { $regex: search, $options: 'i' } }
      ];
    }

    const clubs = await Club.find(filter)
      .populate('patron members.student')
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Club.countDocuments(filter);

    res.json({
      success: true,
      data: {
        clubs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalClubs: total
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

const getClub = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate('patron members.student');

    if (!club) {
      return res.status(404).json({
        success: false,
        error: 'Club not found'
      });
    }

    res.json({
      success: true,
      data: { club }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const updateClub = async (req, res) => {
  try {
    const club = await Club.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('patron members.student');

    if (!club) {
      return res.status(404).json({
        success: false,
        error: 'Club not found'
      });
    }

    res.json({
      success: true,
      data: { club }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

const deleteClub = async (req, res) => {
  try {
    const club = await Club.findByIdAndDelete(req.params.id);

    if (!club) {
      return res.status(404).json({
        success: false,
        error: 'Club not found'
      });
    }

    res.json({
      success: true,
      message: 'Club deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  createClub,
  getClubs,
  getClub,
  updateClub,
  deleteClub,
};