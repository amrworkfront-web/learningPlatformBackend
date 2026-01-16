const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');
const User = require('./src/models/User');
const Course = require('./src/models/Course');
const Lesson = require('./src/models/Lesson');
const connectDB = require('./src/config/db');

dotenv.config();

connectDB();

const importData = async () => {
    try {
        await User.deleteMany();
        await Course.deleteMany();
        await Lesson.deleteMany();

        console.log('Data Destroyed...'.red.inverse);

        const users = await User.create([
            {
                name: 'Admin User',
                email: 'admin@example.com',
                password: 'password123',
                role: 'admin'
            },
            {
                name: 'Instructor One',
                email: 'instructor1@example.com',
                password: 'password123',
                role: 'instructor'
            },
            {
                name: 'Student One',
                email: 'student1@example.com',
                password: 'password123',
                role: 'student'
            }
        ]);

        const instructor = users[1]._id;

        const courses = await Course.create([
            {
                title: 'Full Stack Development',
                description: 'Learn MERN Stack from scratch',
                instructor: instructor,
                price: 100,
                published: true
            },
            {
                title: 'Advanced React Patterns',
                description: 'Master React with advanced patterns',
                instructor: instructor,
                price: 150,
                published: true
            }
        ]);

        const lessons = await Lesson.create([
            {
                courseId: courses[0]._id,
                title: 'Introduction to Node.js',
                videoUrl: 'https://example.com/video1.mp4',
                duration: 600,
                order: 1
            },
            {
                courseId: courses[0]._id,
                title: 'Express Routing',
                videoUrl: 'https://example.com/video2.mp4',
                duration: 1200,
                order: 2
            }
        ]);

        console.log('Data Imported!'.green.inverse);
        process.exit();
    } catch (error) {
        console.error(`${error}`.red.inverse);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await User.deleteMany();
        await Course.deleteMany();
        await Lesson.deleteMany();

        console.log('Data Destroyed!'.red.inverse);
        process.exit();
    } catch (error) {
        console.error(`${error}`.red.inverse);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}
