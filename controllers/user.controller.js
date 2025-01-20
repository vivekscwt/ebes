const models = require('../models');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { Sequelize } = require('sequelize');

function register(req, res) {
  const { fname, lname, email, password, phone, isCustomer } = req.body;

  // Validate required fields
  if (!fname || !lname || !email || !password || !phone) {
    return res.status(400).json({
      success: false,
      message: "All fields (first name, last name, email, phone, password) are required.",
    });
  }

  models.Admin.findOne({
    where: {
      [Sequelize.Op.or]: [
        { email: email },
        { phone: phone }
      ]
    }
  })
    .then((userExists) => {
      if (userExists) {
        if (userExists.email == email) {
          return res.status(409).json({
            success: false,
            message: "Email is already registered!",
          });
        } else if (userExists.phone == phone) {
          return res.status(409).json({
            success: false,
            message: "Phone is already registered!",
          });
        }
        else {
          return res.status(409).json({
            success: false,
            message: "Phone is already registered!",
          });
        }
      }
    })
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

function adminLogin(req, res) {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required.",
    });
  }
  models.Admin.findOne({ where: { email } })
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

async function changePassword(req, res) {
  const { email, current_password, new_password, confirm_password, user_id} = req.body;
  try {

    if (new_password !== confirm_password) {
      return res.send({
        status: "error",
        message: "New password and confirm password do not match",
      });
    }
    models.User.findOne({ where: { email } })
      .then(async (user) => {
        if (!user) {
          return res.status(401).json({
            success: false,
            message: "User not found.",
          });
        }
        console.log("userasss", user.password);

        const isPasswordMatch = await bcryptjs.compare(
          current_password,
          user.password
        );

        if (isPasswordMatch) {
          const hashedNewPassword = await bcryptjs.hash(new_password, 8);
          user.password = hashedNewPassword;
          await user.save();

          return res.status(200).json({
            status: "success",
            message: "Password updated successfully",
          });
        }
        else {
          return res.send({
            status: "error",
            message: "Current password does not match",
          });
        }
      })
  } catch (error) {
    res.status(500).json({
      status: false,
      message: "Error when changing the password",
      error: error.message
    });
  }
}


module.exports = {
  register,
  login,
  adminLogin: adminLogin,
  changePassword: changePassword
};

