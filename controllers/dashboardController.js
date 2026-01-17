const User = require('../models/User');
const Course = require('../models/Course');
const Progress = require('../models/Progress');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get Instructor Dashboard Stats
// @route   GET /api/dashboard/instructor
// @access  Private/Instructor
const getInstructorStats = asyncHandler(async (req, res) => {
  const courses = await Course.find({ instructor: req.user._id });
  const courseIds = courses.map(c => c._id);

  const totalCourses = courses.length;

  // Calculate total students enrolled in my courses
  // A student can be enrolled in multiple courses, so we need distinct users
  // We can query Users who have enrolledCourses in courseIds
  const students = await User.find({
    enrolledCourses: { $in: courseIds }
  }).distinct('_id');
  
  const totalStudents = students.length;

  // Calculate total progress entries
  const progressCount = await Progress.countDocuments({
    courseId: { $in: courseIds }
  });

  res.json({
    totalCourses,
    totalStudents,
    totalProgressEntries: progressCount
  });
});

// @desc    Get Admin Dashboard Stats
// @route   GET /api/dashboard/admin
// @access  Private/Admin
const getAdminStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalStudent = await User.countDocuments({ role: 'student' });
  const totalInstructors = await User.countDocuments({ role: 'instructor' });
  const totalCourses = await Course.countDocuments();
  
  res.json({
    totalUsers,
    totalStudent,
    totalInstructors,
    totalCourses
  });
});

module.exports = {
  getInstructorStats,
  getAdminStats
};
