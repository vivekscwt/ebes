const express = require("express");
//const bodyParser = require('body-parser');
const cors = require("cors");
require('dotenv').config();
const bcryptjs = require('bcryptjs');

const userRoutes = require("./routes/user");
const productRoutes = require("./routes/product");
const imageRoute = require('./routes/images');
//const categoriesRoutes = require('./routes/categoriesRoutes')
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
//app.use("/api/categories", categoriesRoutes);
// app.use("/api/orders", orderRoutes);
// app.use("/api/cart", cartRoutes);

const PORT = process.env.PORT || 3001;

//User.sync({ alter: true })

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
