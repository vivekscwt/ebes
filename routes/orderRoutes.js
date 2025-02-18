// orderRoutes.js

const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const checkAdminMiddleware = require('../middleware/check-admin');
const checkAuthMiddleware = require('../middleware/check-auth');

// Route to get all orders
// router.get("/", orderController.getAllOrders);

// Route to get order details by ID
// router.get("/:id", orderController.getOrderById);

// Route to get getProductsByOrder
router.get("/getProductsByOrder/:id", orderController.getProductsByOrder);

// Route to update an existing order
router.put("/update/:id", orderController.updateOrder);

// Route to get past orders by customerId
router.get("/myPastOrders/:id", orderController.getPastOrdersByCustomerID);

//latest orders
// router.get("/latest-orders", orderController.get)

router.post("/handle-payment",orderController.handlePayment);

router.post("/create-order",orderController.createdOrder);

router.get("/orders-data/:type",checkAdminMiddleware.checkAdmin, orderController.Orders);

router.get("/order-details/:order_id",checkAdminMiddleware.checkAdmin, orderController.orderDetails);

router.get("/my-orders/:user_id", orderController.myOrders);

router.patch("/:order_id", checkAdminMiddleware.checkAdmin, orderController.updateOrderStatus);

module.exports = router;
