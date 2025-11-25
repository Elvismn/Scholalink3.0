const Curriculum = require("../../models/Curriculum");

const createCurriculum = async (req, res) => {
  try {
    const curriculum = await Curriculum.create(req.body);
    await curriculum.populate('subjects.subject');
    
    res.status(201).json({
      success: true,
      data: { curriculum }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

const getCurriculums = async (req, res) => {
  try {
    const { academicYear, gradeLevel, status, search, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (academicYear) filter.academicYear = academicYear;
    if (gradeLevel) filter.gradeLevel = gradeLevel;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const curriculums = await Curriculum.find(filter)
      .populate('subjects.subject')
      .sort({ academicYear: -1, gradeLevel: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Curriculum.countDocuments(filter);

    res.json({
      success: true,
      data: {
        curriculums,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalCurriculums: total
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

const getCurriculum = async (req, res) => {
  try {
    const curriculum = await Curriculum.findById(req.params.id)
      .populate('subjects.subject');

    if (!curriculum) {
      return res.status(404).json({
        success: false,
        error: 'Curriculum not found'
      });
    }

    res.json({
      success: true,
      data: { curriculum }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const updateCurriculum = async (req, res) => {
  try {
    const curriculum = await Curriculum.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('subjects.subject');

    if (!curriculum) {
      return res.status(404).json({
        success: false,
        error: 'Curriculum not found'
      });
    }

    res.json({
      success: true,
      data: { curriculum }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

const deleteCurriculum = async (req, res) => {
  try {
    const curriculum = await Curriculum.findByIdAndDelete(req.params.id);

    if (!curriculum) {
      return res.status(404).json({
        success: false,
        error: 'Curriculum not found'
      });
    }

    res.json({
      success: true,
      message: 'Curriculum deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  createCurriculum,
  getCurriculums,
  getCurriculum,
  updateCurriculum,
  deleteCurriculum,
};