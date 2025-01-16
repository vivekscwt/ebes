const models = require('../models');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

function register(req, res) {
  const { fname, lname, email, password, phone, isCustomer } = req.body;

  // Validate required fields
  if (!fname || !lname || !email || !password || !phone) {
      return res.status(400).json({
          success: false,
          message: "All fields (first name, last name, email, phone, password) are required.",
      });
  }

  // Check if the email or phone already exists
  models.User.findOne({ where: { email } })
      .then((emailExists) => {
          if (emailExists) {
              return res.status(409).json({
                  success: false,
                  message: "Email is already registered!",
              });
          }

          return models.User.findOne({ where: { phone } });
      })
      .then((phoneExists) => {
          if (phoneExists) {
              return res.status(409).json({
                  success: false,
                  message: "Phone is already registered!",
              });
          }

          // Hash the password
          return bcryptjs.genSalt(10);
      })
      .then((salt) => bcryptjs.hash(password, salt))
      .then((hashedPassword) => {
          const user = {
              fname,
              lname,
              email,
              password: hashedPassword,
              phone,
              isCustomer
          };

          // Create the new user
          return models.User.create(user);
      })
      .then((newUser) => {
          res.status(201).json({
              success: true,
              message: "User created successfully",
              data: {
                  id: newUser.id,
                  name: newUser.name,
                  email: newUser.email,
                  phone: newUser.phone,
                  isCustomer: isCustomer
              },
          });
      })
      .catch((error) => {
          console.error("Error in user registration:", error.message);
          res.status(500).json({
              success: false,
              message: "Something went wrong!",
              error: error.message,
          });
      });
}
function login(req, res) {
    const { email, password } = req.body;
  
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }
  
    models.User.findOne({ where: { email } })
      .then((user) => {
        if (!user) {
          return res.status(401).json({
            success: false,
            message: "Invalid credentials!",
          });
        }
  
        // Compare passwords
        return bcryptjs.compare(password, user.password).then((isMatch) => {
          if (!isMatch) {
            return res.status(401).json({
              success: false,
              message: "Invalid credentials!",
            });
          }
  
          // Generate JWT token
          return new Promise((resolve, reject) => {
            jwt.sign(
              {
                email: user.email,
                userId: user.id,
              },
              process.env.JWT_KEY,
              (err, token) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(token);
                }
              }
            );
          });
        });
      })
      .then((token) => {
        if (token) {
          return res.status(200).json({
            success: true,
            message: "Authentication successful!",
            token: token,
          });
        }
      })
      .catch((error) => {
        console.error("Error during login:", error.message);
        
        // Handle errors and ensure only one response
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: "Something went wrong!",
            error: error.message,
          });
        }
      });
  }
  
  
  module.exports = {
    register,
    login,
  };
  
