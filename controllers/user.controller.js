const models = require('../models');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { Sequelize } = require('sequelize');
const { Op } = require("sequelize");
const { transporter } = require("../config/nodemailer");
const path = require('path');
const fs = require('fs');

const register = async (req, res) => {
  const { fname, lname, email, password, phone, isCustomer } = req.body;

  // Validate required fields
  if (!fname || !lname || !email || !password || !phone) {
    return res.status(400).json({
      success: false,
      message: "All fields (first name, last name, email, phone, password) are required.",
    });
  }

  try {
    // Check if the email or phone already exists in Admin or User tables
    const adminExists = await models.Admin.findOne({
      where: {
        [Sequelize.Op.or]: [
          { email: email },
          { phone: phone },
        ],
      },
    });

    if (adminExists) {
      if (adminExists.email === email) {
        return res.status(409).json({
          success: false,
          message: "Email is already registered in Admin!",
        });
      }
      if (adminExists.phone === phone) {
        return res.status(409).json({
          success: false,
          message: "Phone is already registered in Admin!",
        });
      }
    }

    const userExists = await models.User.findOne({
      where: {
        [Sequelize.Op.or]: [
          { email: email },
          { phone: phone },
        ],
      },
    });

    if (userExists) {
      if (userExists.email === email) {
        return res.status(409).json({
          success: false,
          message: "Email is already registered!",
        });
      }
      if (userExists.phone === phone) {
        return res.status(409).json({
          success: false,
          message: "Phone is already registered!",
        });
      }
    }

    // Hash the password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    // Create the new user
    const newUser = await models.User.create({
      fname,
      lname,
      email,
      password: hashedPassword,
      phone,
      isCustomer,
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      result: {
        id: newUser.id,
        fname: newUser.fname,
        lname: newUser.lname,
        email: newUser.email,
        phone: newUser.phone,
        isCustomer,
      },
    });
  } catch (error) {
    console.error("Error in user registration:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong!",
      error: error.message,
    });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required.",
    });
  }

  try {
    // Find user by email
    const user = await models.User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials!",
      });
    }

    // Compare passwords
    const isMatch = await bcryptjs.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials!",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        email: user.email,
        userId: user.id,
        isCustomer: user.isCustomer
      },
      process.env.JWT_KEY,
      { expiresIn: "30d" } // Token expiration time
    );

    // Fetch user cart data if it exists
    let userCart = null;
    const cartData = await models.User_cart.findOne({
      where: { user_id: user.id },
    });

    if (cartData) {
      // Parse the cart_products JSON string if it exists
      userCart = JSON.parse(cartData.cart_products);
    }

    // Return successful response with the token
    return res.status(200).json({
      success: true,
      message: "Authentication successful!",
      token: token,
      result: {
        id: user.id,
        fname: user.fname,
        lname: user.lname,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage || "avatar.png",
        isCustomer: user.isCustomer,
        Cart_data: userCart,
      }
    });
  } catch (error) {
    console.error("Error during login:", error.message);

    // Handle any unexpected errors
    return res.status(500).json({
      success: false,
      message: "Something went wrong!",
      error: error.message,
    });
  }
};


const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required.",
    });
  }

  try {
    // Find admin by email
    const admin = await models.Admin.findOne({ where: { email } });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials!",
      });
    }


    // Compare passwords
    const isMatch = await bcryptjs.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials!",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        email: admin.email,
        userId: admin.id,
        userType: admin.userType
      },
      process.env.JWT_KEY,
      { expiresIn: "30d" } // Token expiration time
    );

    // Return successful response with the token
    return res.status(200).json({
      success: true,
      message: "Authentication successful!",
      token: token,
      result: {
        id: admin.id,
        fname: admin.fname,
        lname: admin.lname,
        email: admin.email,
        phone: admin.phone,
        userType: admin.userType,
      }
    });
  } catch (error) {
    console.error("Error during admin login:", error.message);

    // Handle unexpected errors
    return res.status(500).json({
      success: false,
      message: "Something went wrong!",
      error: error.message,
    });
  }
};


const changePassword = async (req, res) => {
  const { email, current_password, new_password, confirm_password, user_type } = req.body;

  try {
    // Validate inputs
    if (!email || !current_password || !new_password || !confirm_password || !user_type) {
      return res.status(400).json({
        success: false,
        message: "All fields (email, current password, new password, confirm password, user type) are required.",
      });
    }

    // Check if new password and confirm password match
    if (new_password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match.",
      });
    }

    // Determine which model to query based on user type
    const userModel = user_type === "customer" ? models.User : user_type === "admin" ? models.Admin : null;

    if (!userModel) {
      return res.status(400).json({
        success: false,
        message: "Invalid user type. Must be 'customer' or 'admin'.",
      });
    }

    // Find user by email
    const user = await userModel.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Compare current password with the stored password
    const isPasswordMatch = await bcryptjs.compare(current_password, user.password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password does not match.",
      });
    }

    // Hash the new password and update the user record
    const hashedNewPassword = await bcryptjs.hash(new_password, 8);
    user.password = hashedNewPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error("Error when changing the password:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while changing the password.",
      error: error.message,
    });
  }
};

const allCount = async (req, res) => {
  try {
    const totaluserscount = await models.User.count();
    const registereduserscount = await models.User.count({
      where: {
        isCustomer: 1
      }
    })
    const guestuserscount = await models.User.count({
      where: {
        isCustomer: { [Op.ne]: 1 }
      }
    })
    const totalProducts = await models.Product.count({
      where:{
        status: 1,
        isPublic: true
      }
    });
    const totalOrders = await models.Order_Product.count();

    const totalSales = await models.Order_Product.sum('total_amount', {
      where: {
        payment_status: 'success'
      }
    });

    return res.status(200).json({
      success: true,
      result: {
        totaluserscount: totaluserscount,
        registereduserscount: registereduserscount,
        guestuserscount: guestuserscount,
        totalProducts: totalProducts,
        totalOrders: totalOrders?totalOrders:0,
        totalSales: totalSales?totalOrders:0
      },
      message: "No of users fetched successfully.",
    });

  } catch (error) {
    console.error("Error when counting the users:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while counting the users.",
      error: error.message,
    });
  }
}

const usersOverMonth = async (req, res) => {
  try {
    const usersPerMonth = await models.User.findAll({
      attributes: [
        [Sequelize.fn("DATE_FORMAT", Sequelize.col("createdAt"), "%b"), "month"], 
        [Sequelize.fn("COUNT", Sequelize.col("id")), "user_count"] 
      ],
      where: Sequelize.where(
        Sequelize.fn("YEAR", Sequelize.col("createdAt")),
        Sequelize.fn("YEAR", Sequelize.fn("NOW")) 
      ),
      group: [Sequelize.fn("DATE_FORMAT", Sequelize.col("createdAt"), "%b")],
      order: [[Sequelize.fn("DATE_FORMAT", Sequelize.col("createdAt"), "%m"), "ASC"]],
      raw: true
    });

    const allMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const userDataMap = Object.fromEntries(usersPerMonth.map(entry => [entry.month, entry.user_count]));

    const labels = allMonths;
    const data = allMonths.map(month => userDataMap[month] || 0)

    return res.status(200).json({
      success: true,
      result: {
        monthly_registered_users: data,
        monthly_sales: [
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0
      ]
      },
      message: "No of users per month fetched successfully.",
    });
  } catch (error) {
    console.error("Error fetching user count per month:", error);
  }
}

const forgotPassword = async (req, res) => {
  const { email, user_type } = req.body;

  try {
    // Determine which model to query based on user type
    const userModel = user_type === "customer" ? models.User : user_type === "admin" ? models.Admin : null;

    if (!userModel) {
      return res.status(400).json({
        success: false,
        message: "Invalid user type. Must be 'customer' or 'admin'.",
      });
    }

    // Find user by email
    const user = await userModel.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Generate OTP to send to the user's email
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Store OTP in the database
    await userModel.update({ otp }, { where: { email } });

    // Set Mail Body
    const mailBody = mailTemplate(otp);

    if (!mailBody) {
      throw new Error("MailBody must be provided");
    }

    // Send OTP to the user's email
    const mailOptions = {
      from: `"EBES" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Password Reset OTP",
      html: mailBody, // Use the `html` property for HTML content
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending OTP:", error);
        return res.status(500).json({
          success: false,
          message: "An error occurred while sending the OTP.",
          error: error.message,
        });
      } else {
        console.log("OTP sent:", info.response);
        return res.status(200).json({
          success: true,
          message: "OTP sent successfully.",
        });
      }
    });

  } catch (error) {
    console.error("Error when changing the password:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while changing the password.",
      error: error.message,
    });
  }
};

function mailTemplate(otp) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: auto; border-collapse: collapse; margin-top: 50px;">

    <!-- Order Summary -->
    <tr>
      <td style="padding: 20px; text-align: left; background-color: #f4f4f4;">
        <h3 style="color: #000;">Password Reset OTP</h3>
        <p style="margin: 5px 0;"><strong>Your OTP for password reset is: <span style="color:red;">${otp}</span></strong> </p>
      </td>
    </tr>

  </table>
</body>
</html>
`;
}

const verifyOTP = async (req, res) => {
  const { email, user_type, otp } = req.body;

  try {
    // Determine which model to query based on user type
    const userModel = user_type === "customer" ? models.User : user_type === "admin" ? models.Admin : null;

    if (!userModel) {
      return res.status(400).json({
        success: false,
        message: "Invalid user type. Must be 'customer' or 'admin'.",
      });
    }

    // Find user by email
    const user = await userModel.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Check if OTP matches
    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please try again.",
      });
    }

    // Clear OTP after successful verification
    await userModel.update({ otp: null }, { where: { email } });

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully.",
    });

  } catch (error) {
    console.error("Error verifying OTP:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while verifying the OTP.",
      error: error.message,
    });
  }
};

const updatePassword = async (req, res) => {
  const { email, user_type, new_password, confirm_password } = req.body;

  try {
    // Validate input fields
    if (!email || !user_type || !new_password || !confirm_password) {
      return res.status(400).json({
        success: false,
        message: "All fields(email, user_type, new_password, confirm_password) are required.",
      });
    }

    // Check if passwords match
    if (new_password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match.",
      });
    }

    // Determine which model to query based on user type
    const userModel = user_type === "customer" ? models.User : user_type === "admin" ? models.Admin : null;

    if (!userModel) {
      return res.status(400).json({
        success: false,
        message: "Invalid user type. Must be 'customer' or 'admin'.",
      });
    }

    // Find user by email
    const user = await userModel.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Encrypt the new password
    const hashedPassword = await bcryptjs.hash(new_password, 8);

    // Update the password in the database
    await userModel.update(
      { password: hashedPassword },
      { where: { email } }
    );

    return res.status(200).json({
      success: true,
      message: "Password updated successfully.",
    });

  } catch (error) {
    console.error("Error updating password:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the password.",
      error: error.message,
    });
  }
};


const adminEditProfile = async (req, res) => {
  try {
    const { first_name, last_name, new_password, confirm_password, email } = req.body;

    // Check if new password and confirm password match
    if (new_password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match.",
      });
    }

    // Find the admin by email
    const admin = await models.Admin.findOne({ where: { email } });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found.",
      });
    }

    // Prepare the update object
    const updateData = {
      fname: first_name,
      lname: last_name,
    };

    // Update password only if new_password is provided
    if (new_password && new_password.trim() !== "") {
      const hashedNewPassword = await bcryptjs.hash(new_password, 8);
      updateData.password = hashedNewPassword;
    }

    // Update the admin profile
    await models.Admin.update(updateData, {
      where: { email: email },
    });

    return res.status(200).json({
      success: true,
      message: "Admin profile updated successfully.",
    });

  } catch (error) {
    console.error("Error when updating the profile:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the profile.",
      error: error.message,
    });
  }
};

//userEditProfile APi
const userEditProfile = async (req, res) => {
  try {
    const { user_id, first_name, last_name, email, phone } = req.body;

    // Validate input fields
    if (!user_id || !first_name || !last_name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    // Find the customer by user_id
    const customer = await models.User.findOne({ where: { id: user_id } });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    // Check if the new email is already used by another user
    if (email !== customer.email) {
      const existingUser = await models.User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email is already in use by another customer.",
        });
      }
    }

    // Check if the new phone number is already used by another user
    if (phone !== customer.phone) {
      const existingPhoneUser = await models.User.findOne({ where: { phone } });
      if (existingPhoneUser) {
        return res.status(400).json({
          success: false,
          message: "Phone number is already in use by another customer.",
        });
      }
    }

    // Prepare the update object
    const updateData = {
      fname: first_name,
      lname: last_name,
      email: email,
      phone: phone,
    };

    // Update the customer profile
    await models.User.update(updateData, {
      where: { id: user_id },
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
    });

  } catch (error) {
    console.error("Error when updating the profile:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the profile.",
      error: error.message,
    });
  }
};


const userListing = async (req, res) => {
  try {
    const type = req.params.type;
    const whereCondition = type === "registered" ? { isCustomer: 1 } : { isCustomer: 0 };

    const users = await models.User.findAll({
      where: whereCondition,
      attributes: { exclude: ['password', 'otp'] }, // Exclude password column
    });

    // Modify the response to replace null profileImage with a default image
    const modifiedUsers = users.map(user => ({
      ...user.toJSON(),
      profileImage: user.profileImage || "avatar.png", // Set default image if null
    }));

    return res.status(200).json({
      success: true,
      result: modifiedUsers,
      message: "Users fetched successfully.",
    });

  } catch (error) {
    console.error("Error when fetching users:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching users.",
      error: error.message,
    });
  }
};

const uploadOrEditProfileImage = async (req, res) => {
  try {
      const { userId } = req.body;
      if (!userId) {
          return res.status(400).json({ success: false, message: "User ID is required." });
      }

      const user = await models.User.findOne({ where: { id: userId } });
      if (!user) {
          return res.status(404).json({ success: false, message: "User not found!" });
      }

      if (!req.file) {
          return res.status(400).json({ success: false, message: "No file uploaded." });
      }

      const newImagePath = `/uploads/${req.file.filename}`;
      const newImageFileName = req.file.filename;

      // Delete old profile image if it exists
      if (user.profileImage) {
          const oldImagePath = path.join(__dirname, '../uploads/', user.profileImage);
          if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
          }
      }

      // Update profile image in database
      await models.User.update({ profileImage: newImageFileName }, { where: { id: userId } });

      return res.status(200).json({
          success: true,
          message: "Profile image updated successfully.",
          profileImage: newImageFileName,
      });

  } catch (error) {
      console.error("Error updating profile image:", error);
      return res.status(500).json({ success: false, message: "Something went wrong!" });
  }
};

module.exports = {
  register,
  login,
  adminLogin: adminLogin,
  changePassword: changePassword,
  allCount: allCount,
  usersOverMonth: usersOverMonth,
  forgotPassword: forgotPassword,
  verifyOTP: verifyOTP,
  updatePassword: updatePassword,
  adminEditProfile: adminEditProfile,
  userEditProfile: userEditProfile,
  userListing: userListing,
  uploadOrEditProfileImage: uploadOrEditProfileImage
};

