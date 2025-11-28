const Parent = require('../../models/Parent');
const User = require('../../models/User');

// Get parent's own profile
const getMyProfile = async (req, res) => {
  try {
    console.log('🔧 Getting parent profile for:', req.user.id);
    
    const parent = await Parent.findOne({ user: req.user.id })
      .populate('user', 'email profile')
      .populate('children', 'firstName lastName studentId grade');

    if (!parent) {
      return res.status(404).json({
        success: false,
        error: 'Parent profile not found'
      });
    }

    res.json({
      success: true,
      data: {
        parent: {
          id: parent._id,
          user: parent.user,
          children: parent.children,
          address: parent.address,
          emergencyContact: parent.emergencyContact,
          createdAt: parent.createdAt,
          updatedAt: parent.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('❌ Get parent profile error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update parent's own profile
const updateMyProfile = async (req, res) => {
  try {
    console.log('🔧 Updating parent profile for:', req.user.id);
    const { phone, address, emergencyContact } = req.body;

    const updateData = {};
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (emergencyContact) updateData.emergencyContact = emergencyContact;

    // Update parent profile
    const parent = await Parent.findOneAndUpdate(
      { user: req.user.id },
      updateData,
      { new: true, runValidators: true }
    ).populate('user', 'email profile')
     .populate('children', 'firstName lastName studentId grade');

    if (!parent) {
      return res.status(404).json({
        success: false,
        error: 'Parent profile not found'
      });
    }

    // Also update user profile if firstName/lastName provided
    if (req.body.firstName || req.body.lastName) {
      const userUpdate = {};
      if (req.body.firstName) userUpdate['profile.firstName'] = req.body.firstName;
      if (req.body.lastName) userUpdate['profile.lastName'] = req.body.lastName;
      
      await User.findByIdAndUpdate(req.user.id, userUpdate);
      
      // Refresh parent data to include updated user info
      await parent.populate('user', 'email profile');
    }

    res.json({
      success: true,
      data: {
        parent: {
          id: parent._id,
          user: parent.user,
          children: parent.children,
          address: parent.address,
          emergencyContact: parent.emergencyContact,
          createdAt: parent.createdAt,
          updatedAt: parent.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('❌ Update parent profile error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile
};