const express = require("express");
//const bodyParser = require('body-parser');
const cors = require("cors");
require('dotenv').config();
const bcryptjs = require('bcryptjs');

const userRoutes = require("./routes/user");
const productRoutes = require("./routes/product");
const imageRoute = require('./routes/images');
const { Admin } = require("./models");
// const orderRoutes = require("./routes/order");
// const cartRoutes = require("./routes/cart");

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
//app.use(bodyParser.json());
// Connect to the database

// Mount routes
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/images", imageRoute);
// app.use("/api/orders", orderRoutes);
// app.use("/api/cart", cartRoutes);

const PORT = process.env.PORT || 3001;

async function hashPassword(password) {
    try {
      const salt = await bcryptjs.genSalt(10); // Generate salt
      const hashedPassword = await bcryptjs.hash(password, salt); // Hash password
      console.log('Hashed Password:', hashedPassword);
      return hashedPassword; // Return hashed password (store in DB)
    } catch (error) {
      console.error('Error hashing password:', error);
      throw error; // Re-throw the error for further handling
    }
  }

  const initializeDatabase = async () => {
    try {
      await Admin.sync(); // Ensures the table exists
      const adminCount = await Admin.count();
  
      if (adminCount === 0) {
        const password = "dev2.scwt@gmail.com";
        const hashedPassword = await hashPassword(password); // Await the hashed password
  
        await Admin.create({
          fname: "Moumita",
          lname: "Das",
          email: "dev2.scwt@gmail.com",
          phone: "6294601754",
          password: hashedPassword, // Use the awaited hashed password
          userType: "admin",
          role: "superadmin",
        });
        console.log("Default admin record inserted.");
      } else {
        console.log("Admins table already has records.");
      }
    } catch (error) {
      console.error("Error during database initialization:", error);
    }
  };
  
  initializeDatabase();
  



//User.sync({ alter: true })

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
