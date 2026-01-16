const User = require('../models/User');
const Token = require('../models/Token');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateTokens');
const jwt = require('jsonwebtoken');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Role validation (optional simple check)
    if (role && !['student', 'instructor'].includes(role)) {
       // Only allow setting student or instructor, admin usually manual
       // But for this project, I'll allow it or just default to student if not provided
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student'
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get tokens
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      const accessToken = generateAccessToken(user._id, user.role);
      const refreshToken = generateRefreshToken(user._id);

      // Save refresh token to DB
      await Token.create({
        userId: user._id,
        token: refreshToken
      });

      // Set Refresh Token in HTTP-only cookie
      res.cookie('jwt', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({
        accessToken,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Refresh Access Token
// @route   GET /api/auth/refresh
// @access  Public (with Cookie)
const refresh = async (req, res) => {
  try {
    const cookies = req.cookies;
    
    if (!cookies?.jwt) return res.status(401).json({ message: 'Unauthorized, no refresh token' });

    const refreshToken = cookies.jwt;

    // Check if token exists in DB
    const tokenDoc = await Token.findOne({ token: refreshToken });
    if (!tokenDoc) {
       return res.status(403).json({ message: 'Forbidden, token not found' });
    }

    jwt.verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET, 
      async (err, decoded) => {
        if (err || tokenDoc.userId.toString() !== decoded.userId) {
            return res.status(403).json({ message: 'Forbidden, invalid token' });
        }
        
        const user = await User.findById(decoded.userId);
        if(!user) return res.status(401).json({ message: 'User not found' });

        const accessToken = generateAccessToken(user._id, user.role);

        res.json({ accessToken });
      }
    );

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logout = async (req, res) => {
  try {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.status(204).send(); // No content

    const refreshToken = cookies.jwt;

    // Is refresh token in db?
    const tokenDoc = await Token.findOne({ token: refreshToken });
    if (tokenDoc) {
       await Token.deleteOne({ token: refreshToken });
    }

    res.clearCookie('jwt', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
    res.json({ message: 'Cookie cleared' });
  } catch (error) {
     res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout
};
