// orderController.js
const { UnhandledError, NotFoundError, AppError } = require('../errors'); // Adjust the path as needed
const orderModel = require("../models/orders");
const crypto = require('crypto');
const { createTransactionv2 } = require("../authorize.net");
const { sendSuccess, sendError } = require("../libs/responseLib");
const models = require("../models")
const { v4: uuidv4 } = require('uuid');
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../models');  // Ensure the path is correct
const { transporter } = require("../config/nodemailer");



// exports.getAllOrders = (req, res) => {
//   orderModel.getAllOrders()
//     .then(result => {
//       res.send({
//         success: true,
//         message: "Orders fetched successfully.",
//         result: result
//       });
//     })
//     .catch(err => {
//       console.error(err.message);
//       res.status(500).send("Error fetching orders.");
//     });
// };

// exports.getOrderById = (req, res) => {
//   const orderId = req.params.id;
//   orderModel.getOrderById(orderId)
//     .then(result => {
//       res.send({
//         success: true,
//         message: "Orders fetched successfully.",
//         result: result
//       })
//     })
//     .catch(err => {
//       console.error(err.message);
//       res.status(500).send({
//         success: false,
//         message: "Error fetching order."
//       });
//     });
// };

exports.getProductsByOrder = (req, res) => {
  const orderId = req.params.id;
  orderModel.getProductsByOrder(orderId)
    .then(result => {
      res.send({
        success: true,
        message: "Products fetched successfully.",
        result: result
      })
    })
    .catch(err => {
      console.error(err.message);
      res.status(500).send({
        success: false,
        message: "Error creating order."
      });
    });
};

exports.updateOrder = (req, res) => {
  const orderId = req.params.id;
  const newData = req.body; // Assuming newData is an object containing fields to be updated
  orderModel.updateOrder(orderId, newData)
    .then(result => {
      res.send({
        success: true,
        message: "Order updated successfully.",
        result: result
      })
    })
    .catch(err => {
      console.error(err.message);
      res.status(500).send({
        success: false,
        message: "Error updating order."
      });
    });
};

exports.getPastOrdersByCustomerID = (req, res) => {
  const orderId = req.params.id;
  orderModel.getPastOrdersByCustomerID(orderId)
    .then(result => {
      res.send({
        success: true,
        message: "Order fetched successfully.",
        result: result
      })
    })
    .catch(err => {
      console.error(err.message);
      res.status(500).send({
        success: false,
        message: "Error getting order."
      });
    });
};

function generateToken() {
  const token = crypto.randomBytes(16).toString('hex');
  return token;
};

function invoice(billingData) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: auto; border-collapse: collapse;">
    <!-- Header -->


    <!-- Purchase Details -->
    <tr>
      <td style="padding: 20px; text-align: left;">
        <h3 style="color: #000;">Order Confirmation</h3>
        <p style="margin: 5px 0;"><strong>Date of Purchase:</strong> ${billingData.dateOfPurchase}</p>
        <p style="margin: 5px 0;"><strong>Customer Name:</strong> ${billingData.customerName}</p>
        <p style="margin: 5px 0;"><strong>Email:</strong> ${billingData.email}</p>
      </td>
    </tr>

    <!-- Order Summary -->
    <tr>
      <td style="padding: 20px; text-align: left; background-color: #f4f4f4;">
        <h3 style="color: #000;">Order Summary</h3>
        <p style="margin: 5px 0;"><strong>Unit Price:</strong> $${billingData.unitPrice}</p>
        <p style="margin: 5px 0;"><strong>Total:</strong> $${billingData.total}</p>
      </td>
    </tr>

    <!-- Payment Details -->
    <tr>
      <td style="padding: 20px; text-align: left;">
        <h3 style="color: #000;">Payment Details</h3>
        <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${billingData.paymentMethod}</p>
        <p style="margin: 5px 0;"><strong>Credit Card Number:</strong> ${billingData.cardNumber.replace(/.(?=.{4})/g, 'x')}</p>
        <p style="margin: 5px 0;"><strong>Total Amount:</strong> $${billingData.total}</p>
      </td>
    </tr>

    <!-- Transaction Approval -->
    <tr>
      <td style="padding: 20px; text-align: left; background-color: #f4f4f4;">
        <h3 style="color: #000;">Transaction Approved</h3>
        <p style="margin: 5px 0;"><strong>Auth Code:</strong> ${billingData.authCode}</p>
        <p style="margin: 5px 0;"><strong>Transaction ID:</strong> ${billingData.transactionId}</p>
      </td>
    </tr>

    <!-- Thank You Message -->
    <tr>
      <td style="padding: 20px; text-align: left;">
        <h3 style="color: #000;">Thank You for Your Purchase!</h3>
        <p>You have successfully purchased product. If you have any questions or need further assistance, feel free to contact us.</p>
      </td>
    </tr>

  </table>
</body>
</html>
`
};

const sendEmail = async (to, subject, html) => {
  // Check if all parameters are provided
  if (!to || !subject || !html) {
    throw new Error("All parameters (to, subject, html) must be provided");
  }

  const mailOptions = {
    from: `"Ebes" <${process.env.MAIL_USER}>`,
    to,
    subject,
    html,
  };
};

exports.createdOrder = async (req, res, next) => {
  const { amount, product_details, firstName, lastName, email, phone, order_pickup_time } = req.body;
  const { user_id } = req.body;
  try {
    if (!Array.isArray(product_details) || product_details.length === 0) {
      return next(new BadRequestError("Invalid product_details. It should be a non-empty array."));
    }

    // Fetch the latest order ID from the database
    const latestOrder = await models.Order_Product.findOne({
      order: [['createdAt', 'DESC']], // Get the most recent order
      attributes: ['order_id'], // Only fetch the order_id column
      raw: true,
    });

    let newOrderId;
    if (latestOrder && latestOrder.order_id) {
      // Extract the numeric part of the order ID and increment it
      const numericPart = parseInt(latestOrder.order_id, 10);
      newOrderId = (numericPart + 1).toString().padStart(4, '0'); // Pad with leading zeros
    } else {
      // If no orders exist, start from 0001
      newOrderId = '0001';
    }

    // Prepare order details
    const orderDetails = JSON.stringify(product_details);
    console.log("Parsed Order Details:", orderDetails);

    const customerData = { firstName, lastName, email, phone };

    const orderData = {
      order_id: newOrderId, // Use the generated order ID
      customerName: customerData?.firstName + " " + customerData?.lastName,
      email: email,
      phone: phone,
      total_amount: amount,
      payment_status: 'pending',
      delivery_status: 'pending',
      order_details: orderDetails,
      userId: user_id,
      order_pickup_time: order_pickup_time,
    };

    // Create the order in the database
    await models.Order_Product.create(orderData);

    return res.status(200).json({
      success: true,
      message: "Order created successfully.",
      result: orderData,
    });

  } catch (error) {
    console.error("Payment processing error:", error);
    next(new UnhandledError("Payment processing error"));
  }
};

exports.handlePayment = async (req, res, next) => {

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Headers", "x-payment-api-key");
  const { order_id, amount, productOriginalPrice, firstName, lastName, email, customerProfileId, customerPaymentProfileId, paymentNonce } = req.body;
  const { user_id } = req.body;
  let { useSavedCard } = req.body;

  try {
    const product_order = await models.Order_Product.findOne({
      where: { order_id: order_id },
      attributes: ["customerName", "email", "phone"],
      raw: true,
    });
    if (!product_order) {
      return next(new NotFoundError("Product order not found"));
    }

    const customerData = {
      Name: product_order.customerName,
      email: product_order.email
    };

    // Generate a token
    const token = generateToken();
    console.log("createdtoken", token);

    if (!token) {
      return next(new UnhandledError("Token generation failed"));
    }

    // Process the payment
    const transactionResponse = await createTransactionv2(
      amount,
      useSavedCard,
      paymentNonce,
      customerProfileId,
      customerPaymentProfileId,
      customerData,
      "Basic",
      token
    );

    if (transactionResponse.getResponseCode() === "1") {
      
      const transactionId = transactionResponse.getTransId();

      // Insert the token into the database
      const insertedToken = await models.token.create({
        token,
        paymentStatus: "success",
        transactionId: transactionId,
      });
      //console.log("insertedToken", insertedToken);
      if (!insertedToken) {
        return next(new UnhandledError("Token insertion failed"));
      }


      // Prepare billing data
      var billingData = {
        dateOfPurchase: new Date().toISOString().split('T')[0],
        customerName: customerData.Name,
        email: customerData.email,
        total: amount,
        unitPrice: amount,
        paymentMethod: transactionResponse.accountType,
        cardNumber: `**** **** **** ${transactionResponse.accountNumber.slice(4)}`,
        authCode: transactionResponse.getAuthCode(),
        transactionId: transactionId,
      };

      // Insert billing data into the database
      await models.Order_History.create({
        order_id: order_id,
        transactionId: transactionId,
        customerName: billingData.customerName,
        email: billingData.email,
        total: billingData.total,
        paymentMethod: billingData.paymentMethod,
        cardNumber: billingData.cardNumber,
        purchaseDate: billingData.dateOfPurchase,
        tokenId: insertedToken.id,
        userId: user_id,
      });

      var order_product_status={
        delivery_status: 'pending',
        payment_status: 'success'
      };

      await models.Order_Product.update(order_product_status,
        { where: { order_id: order_id } }
      );

      const invoice_template = invoice(billingData);
      sendEmail(customerData.email, "Invoice", invoice_template);

      // Send back the transactionId and token to the client
      // return sendSuccess(res, { transactionId, token }, "Payment successful");
      return res.json({
        success: true,
        message: "Payment successful",
        result: {
          transactionId: transactionId,
          token: token
        }
      });
      
    } else {
        console.log("Payment failed:", transactionResponse);
    
        // Extract error message properly
        let errorMessage = "Payment failed.";
        if (transactionResponse.getErrors() && transactionResponse.getErrors().getError()) {
            const errorArray = transactionResponse.getErrors().getError();
            if (errorArray.length > 0) {
                errorMessage = errorArray[0].getErrorText();
            }
        }
    
        // **Update Order_Product payment_status to 'failed'**
        await models.Order_Product.update(
            { payment_status: 'failed' },
            { where: { order_id: order_id } }
        );
    
        return res.status(400).json({
            success: false,
            message: "Payment failed",
            error: errorMessage
        });
    }  
  } catch (error) {
    console.error("Payment processing error:", error);

    // Ensure payment_status is updated to 'failed' even in case of errors
    try {
        await models.Order_Product.update(
            { payment_status: 'failed' },
            { where: { order_id: order_id } }
        );
        return res.status(500).json({
          success: false,
          message: "Payment processing error",
          error: error.message || "An unexpected error occurred"
        });
    } catch (dbError) {
        console.error("Failed to update payment_status to 'failed':", dbError);
    }

  }
};


exports.orderDetails = async (req, res, next) => {
  try{
    var order_id = req.params.order_id;

    const getorders = await sequelize.query(
      `SELECT Order_Product.*, Order_History.transactionId, Order_History.paymentMethod, Order_History.cardNumber, Order_History.cardNumber
       FROM order_products AS Order_Product
       LEFT JOIN order_histories AS Order_History
       ON Order_Product.order_id = Order_History.order_id
       WHERE Order_Product.order_id = :order_id`,
      {
        replacements: { order_id: order_id },
        type: QueryTypes.SELECT, 
        raw: true 
      }
    );
    
    if (!getorders || getorders.length === 0) {
      return next(new NotFoundError("Order not found"));
    }
    
    return res.status(200).json({
      success: true,
      message: "order fetched successfully.",
      result: getorders
    });
  }catch(error){
    console.log("errors",error);
    return res.status(200).json({
        success: false,
        message: "Something went wrong",
        error: error
    });
  }
  }

exports.Orders = async (req, res, next) => {
  try {
    const type = req.params.type;
    let orders;

    // Fetch orders based on the type
    switch (type) {
      case "latest":
        orders = await models.Order_Product.findAll({
          limit: 10,
          order: [['createdAt', 'DESC']],
          raw: true,
        });
        break;

      case "all":
        orders = await models.Order_Product.findAll({
          order: [['createdAt', 'DESC']],
          raw: true,
        });
        break;

      case "payment_pending":
        orders = await models.Order_Product.findAll({
          where: { payment_status: 'pending' },
          order: [['createdAt', 'DESC']],
          raw: true,
        });
        break;

      case "success":
        orders = await models.Order_Product.findAll({
          where: { payment_status: 'success' },
          order: [['createdAt', 'DESC']],
          raw: true,
        });
        break;

      case "failed":
        orders = await models.Order_Product.findAll({
          where: { payment_status: 'failed' },
          order: [['createdAt', 'DESC']],
          raw: true,
        });
        break;

      default:
        // Assume type is a delivery_status
        orders = await models.Order_Product.findAll({
          where: { delivery_status: type },
          raw: true,
        });
        break;
    }

    // Check if orders were found
    if (!orders || orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No orders found.",
      });
    }

    // Return the orders
    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully.",
      result: orders,
    });

  } catch (error) {
    console.error("Error fetching orders:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching orders.",
      error: error.message,
    });
  }
};



  exports.myOrders = async (req, res, next) => {
    try {
      const user_id = req.params.user_id;
      let Orders = await models.Order_Product.findAll({
        where:{
          payment_status: 'success',
          userId: user_id
        },
        order: [['createdAt', 'DESC']],
        raw: true
      });
  
      if (!Orders || Orders.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No orders found.",
          result: Orders,
        });
      }
      return res.status(200).json({
        success: true,
        message: "Orders fetched successfully.",
        result: Orders,
      });
    } catch (error) {
        console.error("Error fetching orders:", error.message);
        return res.status(500).json({
          success: false,
          message: "An error occurred while fetching the latest orders.",
          error: error.message,
        });
    }
  };
  

