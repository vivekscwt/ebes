const express = require("express");
//const bodyParser = require('body-parser');
const cors = require("cors");
require('dotenv').config();
const bcryptjs = require('bcryptjs');

const userRoutes = require("./routes/user");
const productRoutes = require("./routes/product");
const imageRoute = require('./routes/images');
const categoriesRoutes = require('./routes/categoriesRoutes')
const timeManagementRoutes = require('./routes/timeManagementRoutes')
const cartRoutes = require('./routes/cartRoutes')
const pageRoutes = require('./routes/page')
const { Admin } = require("./models");
const orderRoutes = require("./routes/orderRoutes");
const settingRoutes = require("./routes/setting");
const notificationRoutes = require("./routes/notification");
const strodetailRoutes = require("./routes/strodetail");

const app = express();

app.use(cors({
    origin: '*'
 }));
app.use(express.json());
app.use('/uploads', express.static('uploads'));
//app.use(bodyParser.json());
// Connect to the database

// Mount routes
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/images", imageRoute);
app.use("/api/categories", categoriesRoutes);
app.use("/api/times", timeManagementRoutes)
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/pages", pageRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/strodetails", strodetailRoutes);

const PORT = process.env.PORT || 3001;

//User.sync({ alter: true })

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://192.168.1.7:${PORT}`);
});