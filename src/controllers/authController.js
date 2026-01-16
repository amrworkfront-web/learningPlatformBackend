const User = require('../models/User');
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

    // Role validation
    if (role && !['student', 'instructor'].includes(role)) {
       // limiting role creation via public api if needed
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student'
    });

    if (user) {
      // Generate tokens immediately upon register or just return success?
      // Usually users expect to be logged in. Let's issue tokens.
      const accessToken = generateAccessToken(user._id, user.role);
      const refreshToken = generateRefreshToken(user._id);

      // Set Cookies
      // Access Token
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      // Refresh Token
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

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

      // NO Database storage for tokens (Stateless)

      // Set Access Token Cookie
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      // Set Refresh Token Cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({
        success: true,
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
// @access  Public (Current implementation relies on cookie presence, not auth middleware)
const refresh = async (req, res) => {
  try {
    const cookies = req.cookies;
    
    // Check for 'refreshToken' cookie (named explicitly)
    if (!cookies?.refreshToken) return res.status(401).json({ message: 'Unauthorized, no refresh token' });

    const refreshToken = cookies.refreshToken;

    // Verify JWT - Stateleless check
    jwt.verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET, 
      async (err, decoded) => {
        if (err) return res.status(403).json({ message: 'Forbidden, invalid token' });
        
        const user = await User.findById(decoded.userId);
        if(!user) return res.status(401).json({ message: 'User not found' });

        // Rotate Tokens
        const newAccessToken = generateAccessToken(user._id, user.role);
        const newRefreshToken = generateRefreshToken(user._id);

        // Set New Access Token
        res.cookie('accessToken', newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 15 * 60 * 1000 // 15 minutes
        });

        // Set New Refresh Token
        res.cookie('refreshToken', newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({ success: true, message: 'Tokens refreshed' });
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
    // Clear both cookies
    res.clearCookie('accessToken', { 
        httpOnly: true, 
        sameSite: 'strict', 
        secure: process.env.NODE_ENV === 'production' 
    });
    
    res.clearCookie('refreshToken', { 
        httpOnly: true, 
        sameSite: 'strict', 
        secure: process.env.NODE_ENV === 'production' 
    });

    res.json({ message: 'Logged out successfully' });
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
