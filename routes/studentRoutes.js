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
const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect); 
router.use(authorize('student')); // Enforce RBAC for all student routes

router.post('/enroll/:courseId', enrollCourse);
router.get('/my-courses', getMyCourses);

router.put('/progress/lessons/:lessonId', updateProgress);
router.get('/progress/:courseId', getCourseProgress);

router.post('/notes', saveNote);
router.get('/notes/:lessonId', getLessonNotes);
router.delete('/notes/:id', deleteNote);

module.exports = router;
