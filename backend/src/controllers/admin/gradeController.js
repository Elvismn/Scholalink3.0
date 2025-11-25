const Grade = require("../../models/Grade");
const Student = require("../../models/Student");
const Course = require("../../models/Course");

const createGrade = async (req, res) => {
  try {
    const grade = await Grade.create(req.body);
    await grade.populate('student course teacher');
    
    res.status(201).json({
      success: true,
      data: { grade }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

const getGrades = async (req, res) => {
  try {
    const { student, course, academicYear, term, published, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (student) filter.student = student;
    if (course) filter.course = course;
    if (academicYear) filter.academicYear = academicYear;
    if (term) filter.term = term;
    if (published !== undefined) filter.published = published === 'true';

    const grades = await Grade.find(filter)
      .populate('student course teacher')
      .sort({ academicYear: -1, term: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Grade.countDocuments(filter);

    res.json({
      success: true,
      data: {
        grades,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalGrades: total
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

const getGrade = async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id)
      .populate('student course teacher');

    if (!grade) {
      return res.status(404).json({
        success: false,
        error: 'Grade not found'
      });
    }

    res.json({
      success: true,
      data: { grade }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const updateGrade = async (req, res) => {
  try {
    const grade = await Grade.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('student course teacher');

    if (!grade) {
      return res.status(404).json({
        success: false,
        error: 'Grade not found'
      });
    }

    res.json({
      success: true,
      data: { grade }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

const deleteGrade = async (req, res) => {
  try {
    const grade = await Grade.findByIdAndDelete(req.params.id);

    if (!grade) {
      return res.status(404).json({
        success: false,
        error: 'Grade not found'
      });
    }

    res.json({
      success: true,
      message: 'Grade deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const publishGrades = async (req, res) => {
  try {
    const { gradeIds } = req.body;
    
    const result = await Grade.updateMany(
      { _id: { $in: gradeIds } },
      { published: true }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} grades published successfully`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  createGrade,
  getGrades,
  getGrade,
  updateGrade,
  deleteGrade,
  publishGrades
};