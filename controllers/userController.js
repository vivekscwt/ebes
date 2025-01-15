const db = require("../models");
const User = db.User;
const bcrypt = require("bcrypt");

const register = async (req, res) => {
  const { email, password, isCustomer, fname, lname, phone } = req.body;

  try {
    // Validate request
    if (!email || !password || !fname || !lname || !phone) {
      return res.status(400).json({
        success: false,
        message: "All fields (email, phone, password, fname, lname) are required.",
      });
    }

    // Check if the email is already registered
    const emailExists = await User.findOne({ where: { email } });
    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered.",
      });
    }

    // Check if the phone is already registered
    const phoneExists = await User.findOne({ where: { phone } });
    if (phoneExists) {
      return res.status(409).json({
        success: false,
        message: "Phone is already registered.",
      });
    }

    // Hash the password
    const saltRounds = 10; // Define the salt rounds (higher value = more secure, but slower)
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = await User.create({
      email,
      password: hashedPassword, // Store the hashed password
      isCustomer: isCustomer || false, // Default to false if not provided
      fname,
      lname,
    });

    // Respond with the created user's data
    res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: {
        id: newUser.id,
        fname: newUser.fname,
        lname: newUser.lname,
        email: newUser.email,
        isCustomer: newUser.isCustomer,
      },
    });
  } catch (error) {
    console.error("Error in user registration:", error.message);

    // Handle server error
    res.status(500).json({
      success: false,
      message: "An error occurred during registration. Please try again later.",
      error: error.message,
    });
  }
};

const login = async (req, res) => {
    const { email, password } = req.body;
  
    try {
      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required.",
        });
      }
  
      // Find user by email
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }
  
      // Compare provided password with hashed password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password.",
        });
      }
  
      // Respond with success
      res.status(200).json({
        success: true,
        message: "Login successful.",
        data: {
          id: user.id,
          fname: user.fname,
          lname: user.lname,
          email: user.email,
        },
      });
    } catch (error) {
      console.error("Error in user login:", error.message);
  
      res.status(500).json({
        success: false,
        message: "An error occurred during login. Please try again later.",
        error: error.message,
      });
    }
  };
  
  module.exports = {
    register,
    login,
  };
  
