const User = require('../models/User');
const Course = require('../models/Course');
const Progress = require('../models/Progress');
const Note = require('../models/Note');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Enroll in a course
// @route   POST /api/students/enroll/:courseId
// @access  Private/Student
const enrollCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const user = await User.findById(req.user._id);

  if (user.enrolledCourses.includes(courseId)) {
    res.status(400);
    throw new Error('Already enrolled');
  }

  user.enrolledCourses.push(courseId);
  await user.save();

  res.json({ message: 'Enrolled successfully' });
});

// @desc    Get my enrolled courses
// @route   GET /api/students/my-courses
// @access  Private/Student
const getMyCourses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('enrolledCourses');
  res.json(user.enrolledCourses);
});

// @desc    Update lesson progress
// @route   PUT /api/students/progress/lessons/:lessonId
// @access  Private/Student
const updateProgress = asyncHandler(async (req, res) => {
  const { lessonId } = req.params;
  const { courseId, completed, watchedSeconds } = req.body;

  const progress = await Progress.findOne({
    userId: req.user._id,
    lessonId
  });

  if (progress) {
    progress.completed = completed !== undefined ? completed : progress.completed;
    progress.watchedSeconds = watchedSeconds !== undefined ? watchedSeconds : progress.watchedSeconds;
    progress.lastWatched = Date.now();
    await progress.save();
    res.json(progress);
  } else {
    // For creation, courseId is required.
    if (!courseId) {
        res.status(400);
        throw new Error('Course ID is required for first time progress');
    }
    
    const newProgress = await Progress.create({
      userId: req.user._id,
      courseId,
      lessonId,
      completed: completed || false,
      watchedSeconds: watchedSeconds || 0,
      lastWatched: Date.now()
    });
    res.json(newProgress);
  }
});

// @desc    Get progress for a course
// @route   GET /api/students/progress/:courseId
// @access  Private/Student
const getCourseProgress = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  
  // 1. Get Total Lessons count
  const course = await Course.findById(courseId);
  if (!course) {
      res.status(404);
      throw new Error('Course not found');
  }
  
  const totalLessons = course.lessons.length;

  // 2. Get Completed Lessons count
  // Find all progress docs for this user & course where completed is true
  const completedProgressDocs = await Progress.find({
    userId: req.user._id,
    courseId,
    completed: true
  });
  
  const completedCount = completedProgressDocs.length;

  // 3. Calculate Percentage
  const progressPercentage = totalLessons === 0 ? 0 : (completedCount / totalLessons) * 100;

  res.json({
      courseId,
      totalLessons,
      completedLessons: completedCount,
      progressPercentage: Math.round(progressPercentage * 100) / 100, // Round to 2 decimal places
      details: completedProgressDocs // Optional: return which lessons are completed
  });
});

// @desc    Create/Update Note
// @route   POST /api/students/notes
// @access  Private/Student
const saveNote = asyncHandler(async (req, res) => {
  const { lessonId, content, timestamp } = req.body;

  const note = await Note.create({
      userId: req.user._id,
      lessonId,
      content,
      timestamp
  });

  res.status(201).json(note);
});

// @desc    Get notes for a lesson
// @route   GET /api/students/notes/:lessonId
// @access  Private/Student
const getLessonNotes = asyncHandler(async (req, res) => {
  const notes = await Note.find({
    userId: req.user._id,
    lessonId: req.params.lessonId
  }).sort({ timestamp: 1 });
  res.json(notes);
});

// @desc    Delete a note
// @route   DELETE /api/students/notes/:id
// @access  Private/Student
const deleteNote = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);

  if (note) {
      if(note.userId.toString() !== req.user._id.toString()){
          res.status(403);
          throw new Error('Not authorized');
      }
      await note.deleteOne();
      res.json({ message: 'Note removed' });
  } else {
      res.status(404);
      throw new Error('Note not found');
  }
});

module.exports = {
  enrollCourse,
  getMyCourses,
  updateProgress,
  getCourseProgress,
  saveNote,
  getLessonNotes,
  deleteNote
};
