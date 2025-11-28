const Parent = require('../../models/Parent');
const Grade = require('../../models/Grade');
const Student = require('../../models/Student');

// Get child's grades
const getChildGrades = async (req, res) => {
  try {
    const { childId } = req.params;
    const { term, academicYear } = req.query;
    
    console.log('🔧 Getting grades for child:', childId, 'parent:', req.user.id);

    // Verify the child belongs to this parent
    const parent = await Parent.findOne({ 
      user: req.user.id,
      children: childId 
    });

    if (!parent) {
      return res.status(404).json({
        success: false,
        error: 'Child not found or access denied'
      });
    }

    const query = { student: childId };
    if (term) query.term = term;
    if (academicYear) query.academicYear = academicYear;

    const grades = await Grade.find(query)
      .populate('course', 'name code')
      .populate('teacher', 'firstName lastName')
      .select('scores totalScore grade term academicYear comments published')
      .sort({ academicYear: -1, term: -1 });

    res.json({
      success: true,
      data: {
        grades,
        summary: {
          totalCourses: grades.length,
          currentTerm: term || 'latest',
          academicYear: academicYear || 'current'
        }
      }
    });
  } catch (error) {
    console.error('❌ Get child grades error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get child's academic summary
const getChildAcademicSummary = async (req, res) => {
  try {
    const { childId } = req.params;
    
    console.log('🔧 Getting academic summary for child:', childId, 'parent:', req.user.id);

    const parent = await Parent.findOne({ 
      user: req.user.id,
      children: childId 
    });

    if (!parent) {
      return res.status(404).json({
        success: false,
        error: 'Child not found or access denied'
      });
    }

    const currentGrades = await Grade.find({
      student: childId
    })
    .populate('course', 'name code')
    .select('course totalScore grade term academicYear')
    .sort({ academicYear: -1, term: -1 })
    .limit(10);

    const performance = currentGrades.reduce((acc, grade) => {
      acc.totalScore += grade.totalScore || 0;
      acc.courseCount++;
      return acc;
    }, { totalScore: 0, courseCount: 0 });

    performance.averageScore = performance.courseCount > 0 
      ? (performance.totalScore / performance.courseCount).toFixed(2) 
      : 0;

    res.json({
      success: true,
      data: {
        summary: {
          currentCourses: currentGrades.length,
          averageScore: performance.averageScore,
          latestTerm: currentGrades[0]?.term || 'N/A',
          academicYear: currentGrades[0]?.academicYear || 'N/A'
        },
        recentGrades: currentGrades
      }
    });
  } catch (error) {
    console.error('❌ Get academic summary error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get child's basic info with classroom
const getChildDetails = async (req, res) => {
  try {
    const { childId } = req.params;
    
    console.log('🔧 Getting child details for:', childId, 'parent:', req.user.id);

    const parent = await Parent.findOne({ 
      user: req.user.id,
      children: childId 
    });

    if (!parent) {
      return res.status(404).json({
        success: false,
        error: 'Child not found or access denied'
      });
    }

    const child = await Student.findById(childId)
      .populate('classroom', 'name gradeLevel classTeacher')
      .populate('parents', 'user')
      .populate({
        path: 'classroom',
        populate: {
          path: 'classTeacher',
          select: 'firstName lastName'
        }
      });

    if (!child) {
      return res.status(404).json({
        success: false,
        error: 'Child not found'
      });
    }

    res.json({
      success: true,
      data: {
        child: {
          id: child._id,
          firstName: child.firstName,
          lastName: child.lastName,
          studentId: child.studentId,
          grade: child.grade,
          classroom: child.classroom,
          dateOfBirth: child.dateOfBirth,
          gender: child.gender,
          enrollmentDate: child.enrollmentDate,
          status: child.status
        }
      }
    });
  } catch (error) {
    console.error('❌ Get child details error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  getChildGrades,
  getChildAcademicSummary,
  getChildDetails
};