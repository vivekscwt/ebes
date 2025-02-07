// orderController.js

const orderModel = require("../models/orders");
const crypto = require('crypto');
const { createTransactionv2 } = require("../authorize.net");
const { sendSuccess, sendError } = require("../libs/responseLib");
const models = require("../models")
const { v4: uuidv4 } = require('uuid');
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../models');  // Ensure the path is correct



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

    let orderDetails;
    orderDetails = JSON.stringify(product_details);
    console.log("Parsed Order Details:", orderDetails);

    const customerData = { firstName, lastName, email, phone };

    var orderData = {
      order_id: uuidv4(),
      customerName: customerData?.firstName + " " + customerData?.lastName,
      email: email,
      phone: phone,
      total_amount: amount,
      payment_status: 'pending',
      delivery_status: 'pending',
      order_details: orderDetails,
      userId: user_id,
      order_pickup_time: order_pickup_time
    };

    await models.Order_Product.create({
      ...orderData
    });

    return res.status(200).json({
      success: true,
      message: "order created successfully.",
      result: orderData
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

    const token = generateToken();
    console.log("createdtoken", token);

    const transactionResponse = await createTransactionv2(amount, useSavedCard, paymentNonce, customerProfileId, customerPaymentProfileId, customerData, "Basic", token);
    if (transactionResponse.getResponseCode() === "1") {
      if (!token) {
        return next(new UnhandledError("Token generation failed"));
      }

      const transactionId = transactionResponse.getTransId();
      const insertedToken = await models.token.create({
        token,
        paymentStatus: "success",
        transactionId: transactionId,
      });
      console.log("insertedToken", insertedToken);


      if (!insertedToken) {
        return next(new UnhandledError("Token insertion failed"));
      }

      // Oder billing data
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
      // Insert billing data
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
      }
      var payment_updation = await models.Order_Product.update(order_product_status,
        { where: { order_id: order_id } }
      );

      const invoice_template = invoice(billingData);
      sendEmail(customerData.email, "Invoice", invoice_template);

      // Send back the transactionId and token to the client
      return sendSuccess(res, { transactionId, token }, "Payment successful");
    } else {
      console.log("Payment failed:", transactionResponse);
      return next(new AppError("Payment failed : " + transactionResponse.getErrors().getError()[0].getErrorText(), 400));
    }
  } catch (error) {
    console.error("Payment processing error:", error);
    next(new UnhandledError("Payment processing error"));
  }
};

exports.orderDetails = async (req, res, next) => {
try{
  var order_id = req.params.order_id;
  // var getorders = await models.Order_Product.findOne({
  //   where: {
  //     order_id: order_id
  //   },
  //   // include: [{
  //   //   model: models.Order_History,
  //   //   as: 'orderHistories',
  //   //   where: {
  //   //     order_id: order_id
  //   //   },
  //   //   attributes: ['transactionId'] 
  //   // }],
  //   // raw: true
  // })
  const getorders = await sequelize.query(
    `SELECT Order_Product.*, Order_History.transactionId
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

exports.latestOrders = async (req, res, next) => {
  try {
    const latestOrders = await models.Order_Product.findAll({
      order: [['createdAt', 'DESC']],
      limit: 10, 
      raw: true
    });

    if (!latestOrders || latestOrders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No orders found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Latest orders fetched successfully.",
      result: latestOrders,
    });
  } catch (error) {
    console.error("Error fetching latest orders:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching the latest orders.",
      error: error.message,
    });
  }
};


