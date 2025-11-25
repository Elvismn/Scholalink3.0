const Classroom = require("../../models/Classroom");

const createClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.create(req.body);
    await classroom.populate('classTeacher students courses');
    
    res.status(201).json({
      success: true,
      data: { classroom }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

const getClassrooms = async (req, res) => {
  try {
    const { gradeLevel, search, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (gradeLevel) filter.gradeLevel = gradeLevel;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { classTeacher: { $regex: search, $options: 'i' } }
      ];
    }

    const classrooms = await Classroom.find(filter)
      .populate('classTeacher students courses')
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Classroom.countDocuments(filter);

    res.json({
      success: true,
      data: {
        classrooms,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalClassrooms: total
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

const getClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id)
      .populate('classTeacher students courses');

    if (!classroom) {
      return res.status(404).json({
        success: false,
        error: 'Classroom not found'
      });
    }

    res.json({
      success: true,
      data: { classroom }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const updateClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('classTeacher students courses');

    if (!classroom) {
      return res.status(404).json({
        success: false,
        error: 'Classroom not found'
      });
    }

    res.json({
      success: true,
      data: { classroom }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

const deleteClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.findByIdAndDelete(req.params.id);

    if (!classroom) {
      return res.status(404).json({
        success: false,
        error: 'Classroom not found'
      });
    }

    res.json({
      success: true,
      message: 'Classroom deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  createClassroom,
  getClassrooms,
  getClassroom,
  updateClassroom,
  deleteClassroom,
};