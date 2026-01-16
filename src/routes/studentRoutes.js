const express = require('express');
const router = express.Router();
const {
  enrollCourse,
  getMyCourses,
  updateProgress,
  getCourseProgress,
  saveNote,
  getLessonNotes,
  deleteNote
} = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All routes protected

router.post('/enroll/:courseId', enrollCourse);
router.get('/my-courses', getMyCourses);

router.post('/progress', updateProgress);
router.get('/progress/:courseId', getCourseProgress);

router.post('/notes', saveNote);
router.get('/notes/:lessonId', getLessonNotes);
router.delete('/notes/:id', deleteNote);

module.exports = router;
