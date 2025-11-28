const Parent = require('../../models/Parent');
const Student = require('../../models/Student');

// Get parent's children list
const getMyChildren = async (req, res) => {
  try {
    console.log('🔧 Getting children for parent:', req.user.id);
    
    const parent = await Parent.findOne({ user: req.user.id })
      .populate({
        path: 'children',
        select: 'firstName lastName studentId grade section dateOfBirth gender enrollmentStatus',
        populate: [
          {
            path: 'classroom',
            select: 'name gradeLevel section'
          },
          {
            path: 'homeroomTeacher',
            select: 'profile.employeeId profile.firstName profile.lastName'
          }
        ]
      });

    if (!parent) {
      return res.status(404).json({
        success: false,
        error: 'Parent profile not found'
      });
    }

    res.json({
      success: true,
      data: {
        children: parent.children || []
      }
    });
  } catch (error) {
    console.error('❌ Get children error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get specific child details
const getChildDetails = async (req, res) => {
  try {
    const { childId } = req.params;
    console.log('🔧 Getting child details for:', childId, 'parent:', req.user.id);

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

    const child = await Student.findById(childId)
      .populate('classroom', 'name gradeLevel section')
      .populate('homeroomTeacher', 'profile.employeeId profile.firstName profile.lastName')
      .populate('emergencyContacts', 'name relationship phone')
      .select('-createdAt -updatedAt -__v');

    if (!child) {
      return res.status(404).json({
        success: false,
        error: 'Child not found'
      });
    }

    res.json({
      success: true,
      data: {
        child
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
  getMyChildren,
  getChildDetails
};