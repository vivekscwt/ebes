const express = require("express");
//const bodyParser = require('body-parser');
const cors = require("cors");
require('dotenv').config();

const userRoutes = require("./routes/user");
const productRoutes = require("./routes/product");
// const orderRoutes = require("./routes/order");
// const cartRoutes = require("./routes/cart");
//const userToken = require("./routes/userToken");

const app = express();

app.use(cors());
app.use(express.json());
//app.use(bodyParser.json());
// Connect to the database

// Mount routes
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
// app.use("/api/orders", orderRoutes);
// app.use("/api/cart", cartRoutes);
//app.use("/api/token", userToken)

const PORT = process.env.PORT || 3001;


//User.sync({ alter: true })

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
