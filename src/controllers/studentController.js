const User = require('../models/User');
const Course = require('../models/Course');
const Progress = require('../models/Progress');
const Note = require('../models/Note');

// @desc    Enroll in a course
// @route   POST /api/students/enroll/:courseId
// @access  Private/Student
const enrollCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const user = await User.findById(req.user._id);

    if (user.enrolledCourses.includes(courseId)) {
      return res.status(400).json({ message: 'Already enrolled' });
    }

    user.enrolledCourses.push(courseId);
    await user.save();

    res.json({ message: 'Enrolled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my enrolled courses
// @route   GET /api/students/my-courses
// @access  Private/Student
const getMyCourses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('enrolledCourses');
    res.json(user.enrolledCourses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update lesson progress
// @route   POST /api/students/progress
// @access  Private/Student
const updateProgress = async (req, res) => {
  try {
    const { courseId, lessonId, completed, watchedSeconds } = req.body;

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
      const newProgress = await Progress.create({
        userId: req.user._id,
        courseId,
        lessonId,
        completed,
        watchedSeconds,
        lastWatched: Date.now()
      });
      res.json(newProgress);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get progress for a course
// @route   GET /api/students/progress/:courseId
// @access  Private/Student
const getCourseProgress = async (req, res) => {
  try {
    const progress = await Progress.find({
      userId: req.user._id,
      courseId: req.params.courseId
    });
    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create/Update Note
// @route   POST /api/students/notes
// @access  Private/Student
const saveNote = async (req, res) => {
  try {
    const { lessonId, content, timestamp } = req.body;

    const note = await Note.create({
        userId: req.user._id,
        lessonId,
        content,
        timestamp
    });

    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get notes for a lesson
// @route   GET /api/students/notes/:lessonId
// @access  Private/Student
const getLessonNotes = async (req, res) => {
  try {
    const notes = await Note.find({
      userId: req.user._id,
      lessonId: req.params.lessonId
    }).sort({ timestamp: 1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a note
// @route   DELETE /api/students/notes/:id
// @access  Private/Student
const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (note) {
        if(note.userId.toString() !== req.user._id.toString()){
            return res.status(403).json({ message: 'Not authorized' });
        }
        await note.deleteOne();
        res.json({ message: 'Note removed' });
    } else {
        res.status(404).json({ message: 'Note not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  enrollCourse,
  getMyCourses,
  updateProgress,
  getCourseProgress,
  saveNote,
  getLessonNotes,
  deleteNote
};
