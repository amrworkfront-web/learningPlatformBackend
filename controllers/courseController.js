const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
const getCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({ published: true }).populate('instructor', 'name');
  res.json(courses);
});

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
const getCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate('instructor', 'name');

  if (course) {
     // Get lessons
     const lessons = await Lesson.find({ courseId: course._id }).sort({ order: 1 });
     res.json({ ...course.toObject(), lessons });
  } else {
    res.status(404);
    throw new Error('Course not found');
  }
});

// @desc    Create a course
// @route   POST /api/courses
// @access  Private/Instructor
const createCourse = asyncHandler(async (req, res) => {
  const { title, description, thumbnail, price } = req.body;

  const course = await Course.create({
    title,
    description,
    thumbnail,
    price,
    instructor: req.user._id
  });

  res.status(201).json(course);
});

// @desc    Update a course
// @route   PUT /api/courses/:id
// @access  Private/Instructor
const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (course) {
    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to update this course');
    }

    course.title = req.body.title || course.title;
    course.description = req.body.description || course.description;
    course.thumbnail = req.body.thumbnail || course.thumbnail;
    course.price = req.body.price !== undefined ? req.body.price : course.price;
    course.published = req.body.published !== undefined ? req.body.published : course.published;

    const updatedCourse = await course.save();
    res.json(updatedCourse);
  } else {
    res.status(404);
    throw new Error('Course not found');
  }
});

// @desc    Delete a course
// @route   DELETE /api/courses/:id
// @access  Private/Instructor
const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (course) {
    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to delete this course');
    }

    await course.deleteOne();
    // Also delete lessons
    await Lesson.deleteMany({ courseId: course._id });

    res.json({ message: 'Course removed' });
  } else {
    res.status(404);
    throw new Error('Course not found');
  }
});

// @desc    Add lesson to course
// @route   POST /api/courses/:id/lessons
// @access  Private/Instructor
const addLesson = asyncHandler(async (req, res) => {
  const { title, description, videoUrl, duration, order } = req.body;
  const course = await Course.findById(req.params.id);

  if (!course) {
      res.status(404);
      throw new Error('Course not found');
  }

  if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Not authorized to add lessons to this course');
  }

  const lesson = await Lesson.create({
      courseId: course._id,
      title,
      description,
      videoUrl,
      duration,
      order
  });

  res.status(201).json(lesson);
});

module.exports = {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  addLesson
};
