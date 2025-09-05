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
const bcryptjs = require('bcryptjs');
const { SquareClient, SquareEnvironment } = require("square");
const { randomUUID } = require("crypto");


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
  let orderDetails = [];

  // Ensure orderDetails is parsed if it's a string
  if (typeof billingData.orderDetails === "string") {
    try {
      orderDetails = JSON.parse(billingData.orderDetails);
    } catch (error) {
      console.error("Error parsing orderDetails:", error);
      orderDetails = []; // Default to empty array if parsing fails
    }
  } else if (Array.isArray(billingData.orderDetails)) {
    orderDetails = billingData.orderDetails;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Invoice</title>
  <style>
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background-color: #f4f4f4; }
  </style>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: auto; border-collapse: collapse;">

    <!-- Header -->
    <tr>
      <td style="padding: 20px; text-align: left; background-color:#ffeb00;">
        <h3 style="color: #000;">Order Invoice</h3>
        <p style="margin: 5px 0;">Thank you for your order! Below is your invoice.</p>
      </td>
    </tr>

    <!-- Purchase Details -->
    <tr>
      <td style="padding: 20px; text-align: left;">
        <h3 style="color: #000;">Invoice Details</h3>
        <p style="margin: 5px 0;"><strong>Order ID:</strong> ${billingData.order_id}</p>
        <p style="margin: 5px 0;"><strong>Date of Purchase:</strong> ${billingData.dateOfPurchase}</p>
        <p style="margin: 5px 0;"><strong>Order Pickup Time:</strong> ${billingData.order_pickup_time} mins.</p>
        <p style="margin: 5px 0;"><strong>Customer Name:</strong> ${billingData.customerName}</p>
        <p style="margin: 5px 0;"><strong>Email:</strong> ${billingData.email}</p>
      </td>
    </tr>

    <!-- Order Summary Table -->
    <tr>
      <td style="padding: 20px; text-align: left; background-color: #f4f4f4;">
        <h3 style="color: #000;">Order Summary</h3>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Unit Price</th>
              <th>Quantity</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${orderDetails.map(item => {
              let unitPrice = item.finalPrice !== null ? item.finalPrice : item.priceRegular;
              return `
                <tr>
                  <td>${item.title}
                    ${item.type === "variable" && item.variation ? `<br><small><strong>Variation:</strong> ${item.variation}</small>` : ""}
                    ${item.selectedMilk ? `<br><small><strong>Milk:</strong> ${item.selectedMilk}</small>` : ""}
                    ${item.whipped_cream ? `<br><small><strong>Whipped Cream:</strong> ${item.whipped_cream}</small>` : ""}
                    ${item.extraNote ? `<br><small><strong>ExtraNote:</strong> ${item.extraNote}</small>` : ""}
                    ${item.selectedProductAddOn ? `<br><small><strong>Selected AddOn:</strong> ${item.selectedProductAddOn}</small>` : ""}
                  </td>
                  <td>$${unitPrice}</td>
                  <td>${item.productQuantity}</td>
                  <td>$${item.totalPrice}</td>
                </tr>
              `;
            }).join('')}
            <tr><td colspan="4"><p><strong>Additional Notes:</strong> ${billingData.extra_notes}</p></td></tr>
          </tbody>
        </table>
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

    <!-- Footer -->
    <tr>
      <td style="padding: 20px; text-align: center; font-size: 14px; background-color:#ffeb00;">
        <p>If you have any questions regarding your order, feel free to contact our support team.</p>
        <p>Best Regards,<br>EBES Team</p>
      </td>
    </tr>

  </table>
</body>
</html>`;
}

exports.createdOrder = async (req, res, next) => {
  const { amount, product_details, firstName, lastName, email, phone, order_pickup_time, user_id, extra_notes } = req.body;

  try {
    // Validate product_details
    if (!Array.isArray(product_details) || product_details.length === 0) {
      return next(new BadRequestError("Invalid product_details. It should be a non-empty array."));
    }

    let newUserId = user_id;
    // If user_id is not provided, create a new user
    if (!user_id) {
      const existingUser = await models.User.findOne({
        where: { email },
      });

      if (existingUser) {
        newUserId = existingUser.id; // Use existing user ID if email is found
      } else {
        // Create new user
        const newUser = await models.User.create({
          fname: firstName,
          lname: lastName,
          email,
          phone,
          password: await bcryptjs.hash(email, 10), // Set a default password
          isCustomer: false,
        });

        newUserId = newUser.id;
      }
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

    const orderData = {
      order_id: newOrderId,
      customerName: `${firstName} ${lastName}`,
      email,
      phone,
      total_amount: amount,
      payment_status: 'pending',
      delivery_status: 'pending',
      order_details: orderDetails,
      extra_notes: extra_notes,
      userId: newUserId,
      order_pickup_time,
    };

    // Create the order in the database
    await models.Order_Product.create(orderData);

    return res.status(200).json({
      success: true,
      message: "Order created successfully.",
      result: orderData,
    });

  } catch (error) {
    console.error("Order creation error:", error);
    next(new UnhandledError("Order creation error"));
  }
};

// exports.handlePayment = async (req, res, next) => {

//   res.setHeader("Content-Type", "application/json");
//   res.setHeader("Access-Control-Allow-Headers", "x-payment-api-key");
//   const { order_id, amount, productOriginalPrice, firstName, lastName, email, customerProfileId, customerPaymentProfileId, paymentNonce } = req.body;
//   const { user_id } = req.body;
//   let { useSavedCard } = req.body;

//   try {
//     const product_order = await models.Order_Product.findOne({
//       where: { order_id: order_id },
//       attributes: ["customerName", "email", "phone", "order_details", "extra_notes"],
//       raw: true,
//     });
//     if (!product_order) {
//       return next(new NotFoundError("Product order not found"));
//     }

//     const customerData = {
//       Name: product_order.customerName,
//       email: product_order.email,
//       phone: product_order.phone
//     };

//     // Generate a token
//     const token = generateToken();
//     console.log("createdtoken", token);

//     if (!token) {
//       return next(new UnhandledError("Token generation failed"));
//     }

//     // Process the payment
//     const transactionResponse = await createTransactionv2(
//       amount,
//       useSavedCard,
//       paymentNonce,
//       customerProfileId,
//       customerPaymentProfileId,
//       customerData,
//       "Purchase products from EBES",
//       token
//     );

//     if (String(transactionResponse.getResponseCode()) === "1") {
      
//       const transactionId = transactionResponse.getTransId();

//       // Insert the token into the database
//       const insertedToken = await models.token.create({
//         token,
//         paymentStatus: "success",
//         transactionId: transactionId,
//       });
//       //console.log("insertedToken", insertedToken);
//       if (!insertedToken) {
//         return next(new UnhandledError("Token insertion failed"));
//       }


//       // Prepare billing data
//       var billingData = {
//         dateOfPurchase: new Date().toISOString().split('T')[0],
//         customerName: customerData.Name,
//         email: customerData.email,
//         total: amount,
//         unitPrice: amount,
//         paymentMethod: transactionResponse.accountType,
//         cardNumber: `**** **** **** ${transactionResponse.accountNumber.slice(4)}`,
//         authCode: transactionResponse.getAuthCode(),
//         transactionId: transactionId,
//         orderDetails: product_order.order_details,
//         extra_notes: product_order.extra_notes,
//         order_id: order_id
//       };

//       // Insert billing data into the database
//       await models.Order_History.create({
//         order_id: order_id,
//         transactionId: transactionId,
//         customerName: billingData.customerName,
//         email: billingData.email,
//         total: billingData.total,
//         paymentMethod: billingData.paymentMethod,
//         cardNumber: billingData.cardNumber,
//         purchaseDate: billingData.dateOfPurchase,
//         tokenId: insertedToken.id,
//         userId: user_id,
//       });

//       // Update Order status
//       await models.Order_Product.update(
//         { delivery_status: 'pending', payment_status: 'success' },
//         { where: { order_id: order_id } }
//       );

//       // Clear user cart after successful payment
//       if (user_id) {
//         await models.User_cart.destroy({ where: { user_id: user_id } });
//       }

//       // Set Mail Body
//       const mailBody = invoice(billingData);

//       if (!mailBody) {
//         throw new Error("MailBody must be provided");
//       }

//       // Send invoice to the user's email
//       const mailOptions = {
//         from: `"EBES" <${process.env.MAIL_USER}>`,
//         to: customerData.email,
//         subject: "EBE New Order Invoice",
//         html: mailBody,
//       };

//       try {
//         await transporter.sendMail(mailOptions);
//         console.log("New order Invoice sent");
//         return res.status(200).json({
//           success: true,
//           message: "Payment successful",
//           result: { transactionId, token }
//         });
//       } catch (error) {
//         console.error("Error sending invoice:", error);
//         return res.status(500).json({
//           success: false,
//           message: "Invoice email failed",
//           error: error.message,
//         });
//       }
      
//     } else {
//         console.log("Payment failed:", transactionResponse);
    
//         // Extract error message properly
//         let errorMessage = "Payment failed.";
//         if (transactionResponse.getErrors() && transactionResponse.getErrors().getError()) {
//             const errorArray = transactionResponse.getErrors().getError();
//             if (errorArray.length > 0) {
//                 errorMessage = errorArray[0].getErrorText();
//             }
//         }
    
//         // **Update Order_Product payment_status to 'failed'**
//         await models.Order_Product.update(
//             { payment_status: 'failed' },
//             { where: { order_id: order_id } }
//         );
    
//         return res.status(400).json({
//             success: false,
//             message: "Payment failed",
//             error: errorMessage
//         });
//     }  
//   } catch (error) {
//     console.error("Payment processing error:", error);

//     // Ensure payment_status is updated to 'failed' even in case of errors
//     try {
//         await models.Order_Product.update(
//             { payment_status: 'failed' },
//             { where: { order_id: order_id } }
//         );
//         return res.status(500).json({
//           success: false,
//           message: "Payment processing error",
//           error: error.message || "An unexpected error occurred"
//         });
//     } catch (dbError) {
//         console.error("Failed to update payment_status to 'failed':", dbError);
//     }

//   }
// };


const client = new SquareClient({
    environment: SquareEnvironment.Sandbox,
    token: process.env.SQUARE_ACCESS_TOKEN,
});

function safeJson(obj) {
  return JSON.parse(JSON.stringify(obj, (_, v) =>
    typeof v === 'bigint' ? v.toString() : v
  ));
}

exports.handlePayment = async (req, res, next) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Headers", "x-payment-api-key");

  const { order_id, amount, firstName, lastName, email, user_id, paymentNonce } = req.body;
  console.log("handlePayment", req.body);
  
  try {
    const product_order = await models.Order_Product.findOne({
      where: { order_id },
      attributes: ["customerName", "email", "phone", "total_amount", "order_details", "extra_notes", "order_pickup_time"],
      raw: true,
    });

    if (!product_order) {
      return next(new NotFoundError("Product order not found"));
    }

    const customerData = {
      name: product_order.customerName,
      email: product_order.email,
      phone: product_order.phone,
    };

    const token = generateToken();
    if (!token) return next(new UnhandledError("Token generation failed"));

    const response = await client.payments.create({
      sourceId: paymentNonce,              
      idempotencyKey: randomUUID(),   
      amountMoney: {
        amount: amount,           
        currency: "USD",
      },
      locationId: process.env.SQUARE_LOCATION_ID,
      note: "Purchase products from EBES",
    });

    const payment = response.payment;
    console.log("paymentsss",payment);

    if (payment && payment.status === "COMPLETED") {
      const transactionId = payment.id;

      const insertedToken = await models.token.create({
        token,
        paymentStatus: "success",
        transactionId,
      });

      const billingData = {
        dateOfPurchase: new Date().toISOString().split("T")[0],
        customerName: customerData.name,
        email: customerData.email,
        total: product_order.total_amount,
        unitPrice: product_order.total_amount,
        paymentMethod: payment.sourceType,
        cardNumber: `**** **** **** ${payment.cardDetails?.card?.last4}`,
        authCode: payment.cardDetails?.authResultCode || "",
        transactionId,
        orderDetails: product_order.order_details,
        extra_notes: product_order.extra_notes,
        order_pickup_time: product_order.order_pickup_time,
        order_id,
      };

      await models.Order_History.create({
        order_id,
        transactionId,
        customerName: billingData.customerName,
        email: billingData.email,
        total: billingData.total,
        paymentMethod: billingData.paymentMethod,
        cardNumber: billingData.cardNumber,
        purchaseDate: billingData.dateOfPurchase,
        tokenId: insertedToken.id,
        userId: user_id,
      });

      await models.Order_Product.update(
        { delivery_status: "pending", payment_status: "success" },
        { where: { order_id } }
      );

      if (user_id) await models.User_cart.destroy({ where: { user_id } });

      const mailBody = invoice(billingData);
      await transporter.sendMail({
        from: `"EBES" <${process.env.MAIL_USER}>`,
        to: customerData.email,
        subject: "EBES New Order Invoice",
        html: mailBody,
      });

      return res.status(200).json({
        success: true,
        message: "Payment successful",
        result: { transactionId, token },
      });
    } else {
      await models.Order_Product.update(
        { payment_status: "failed" },
        { where: { order_id } }
      );

      return res.status(400).json({
        success: false,
        message: "Payment failed",
        error: payment?.status || "Unknown error",
      });
    }
  } catch (error) {
    console.error("Square Payment error:", error);

    await models.Order_Product.update(
      { payment_status: "failed" },
      { where: { order_id } }
    );

    return res.status(500).json({
      success: false,
      message: "Payment processing error",
      error: error.body || error.message,
    });
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
      return res.status(200).json({
        success: true,
        message: "No orders found.",
        result:[]
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

      const myOrders = await sequelize.query(
          `SELECT 
              Order_Product.*, 
              Order_History.transactionId, 
              Order_History.paymentMethod, 
              Order_History.cardNumber
            FROM order_products AS Order_Product
            LEFT JOIN order_histories AS Order_History
            ON Order_Product.order_id = Order_History.order_id
            WHERE Order_Product.userId = :user_id`,
          {
              replacements: { user_id: user_id }, 
              type: sequelize.QueryTypes.SELECT,
              raw: true,
          }
      );

    if (!myOrders || myOrders.length === 0) {
      return res.status(200).json({
        success: false,
        message: "No orders found.",
        result: [],
      });
    }
    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully.",
      result: myOrders,
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
  function parseOrderDetails(orderDetailsString) {
  if (!orderDetailsString) return [];

  let raw = orderDetailsString;

  try {
    // Remove outer quotes if present
    if (raw.startsWith('"') && raw.endsWith('"')) {
      raw = raw.slice(1, -1);
    }

    // Replace escaped quotes
    raw = raw.replace(/\\"/g, '"');

    return JSON.parse(raw);
  } catch (err) {
    console.error("Error parsing order details:", err);
    return [];
  }
}


/**
 * Updates the delivery status of an order.
 */
exports.updateOrderStatus = async (req, res, next) => {
    try {
        const orderId = req.params.order_id;
        const { delivery_status } = req.body;

        // Validate the delivery_status
        const allowedStatuses = ["pending", "processing", "ready", "completed"];
        if (!allowedStatuses.includes(delivery_status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid delivery status. Allowed values are: pending, processing, ready, completed.",
            });
        }
        // Update the delivery status in the database
        const result = await models.Order_Product.update(
            { delivery_status },
            { where: { order_id: orderId } }
        );

        // Check if any rows were affected
        if (result[0] === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found or delivery status unchanged.",
            });
        }

        // Fetch order data from order_products
        const orderProduct = await models.Order_Product.findOne({ where: { order_id: orderId } });
        if (!orderProduct) {
          return res.status(404).json({ success: false, message: "Order product not found." });
        }

        // Fetch transaction/payment info from order_histories
        const orderHistory = await models.Order_History.findOne({ where: { order_id: orderId } });
        if (!orderHistory) {
          return res.status(404).json({ success: false, message: "Order history not found or payment is pending for this order." });
        }

        // Create notification message based on status
        let notificationMessage = "";
        switch (delivery_status) {
            case "pending":
                notificationMessage = `Order ID #${orderId} has been received and is pending processing.`;
                break;
            case "processing":
                notificationMessage = `Order ID #${orderId} is being processed.`;
                break;
            case "ready":
                notificationMessage = `Order ID #${orderId} is ready for delivery.`;
                break;
            case "completed":
                notificationMessage = `Order ID #${orderId} has been completed. Thank you for your purchase!`;
                break;
        }

        // Check if notification exists
        const existingNotification = await models.Notification.findOne({
          where: {
              user_id: orderProduct.userId,
              order_id: orderId
          }
        });

        if (existingNotification) {
          // Update existing notification
          await existingNotification.update({
              message_body: notificationMessage,
              updatedAt: new Date()
          });
        } else {
          // Create new notification
          await models.Notification.create({
              type: "private",
              message_body: notificationMessage,
              user_id: orderProduct.userId,
              order_id: orderId
          });
        }

      let orderDetails = parseOrderDetails(orderProduct.order_details);

        // Build billing data
        const billingData = {
          order_id: orderId,
          dateOfPurchase: orderHistory.purchaseDate.toLocaleDateString(),
          customerName: orderProduct.customerName,
          email: orderProduct.email,
          orderDetails: orderDetails,
          paymentMethod: orderHistory.paymentMethod,
          cardNumber: orderHistory.cardNumber,
          total: orderProduct.total_amount,
          delivery_status: orderProduct.delivery_status,
          order_pickup_time: orderProduct.order_pickup_time,
          extra_notes: orderProduct.extra_notes
        };

        // Generate email body
        const mailBody = orderStatusMailbody(billingData);
        if (!mailBody) {
          throw new Error("Mail body must be provided.");
        }

        // Set subject based on status
        let subjectLine = "Your Order Status Has Been Updated";
        switch (delivery_status) {
          case "pending":
            subjectLine = "Order Received - Status: Pending";
            break;
          case "processing":
            subjectLine = "Order is Being Processed";
            break;
          case "ready":
            subjectLine = "Your Order is Ready for Delivery";
            break;
          case "completed":
            subjectLine = "Order Completed - Thank You!";
            break;
        }

        // Send email
        const mailOptions = {
          from: `"EBES" <${process.env.MAIL_USER}>`,
          to: orderProduct.email,
          subject: subjectLine,
          html: mailBody,
        };

        try {
          await transporter.sendMail(mailOptions);
          console.log("Order status updated and email sent.");
          return res.status(200).json({
            success: true,
            message: "Order status updated and email sent successfully.",
          });
        } catch (emailError) {
          console.error("Error sending email:", emailError);
          return res.status(500).json({
            success: false,
            message: "Order status updated, but email failed.",
            error: emailError.message,
          });
        }
    } catch (error) {
        console.error("Error updating delivery status:", error.message);
        return res.status(500).json({
            success: false,
            message: "An error occurred while updating delivery status.",
            error: error.message,
        });
    }
};

// function orderStatusMailbody(billingData) {
//   let orderDetails = [];
//   console.log("billingData", billingData);
  
//   // Ensure orderDetails is parsed if it's a string
//   if (typeof billingData.orderDetails === "string") {
//     try {
//       orderDetails = JSON.parse(billingData.orderDetails);
//     } catch (error) {
//       console.error("Error parsing orderDetails:", error);
//       orderDetails = []; // Default to empty array if parsing fails
//     }
//   } else if (Array.isArray(billingData.orderDetails)) {
//     orderDetails = billingData.orderDetails;
//   }

//   console.log("orderDetails", orderDetails);
  
//   const maskCardNumber = (cardNumber) => {
//     if (!cardNumber || cardNumber.length < 4) return 'xxxx';
//     return cardNumber.replace(/.(?=.{4})/g, 'x');
//   };

//   return `<!DOCTYPE html>
// <html>
// <head>
//   <meta charset="UTF-8">
//   <meta name="viewport" content="width=device-width, initial-scale=1.0">
//   <title>Order Invoice</title>
//   <style>
//     table { width: 100%; border-collapse: collapse; }
//     th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
//     th { background-color: #f4f4f4; }
//   </style>
// </head>
// <body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
//   <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: auto; border-collapse: collapse;">

//     <!-- Header -->
//     <tr>
//       <td style="padding: 20px; text-align: left; background-color:#ffeb00;">
//         <h3 style="color: #000;">Order Invoice</h3>
//         <p style="margin: 5px 0;">Thank you for your order! Below is your invoice.</p>
//       </td>
//     </tr>

//     <!-- Purchase Details -->
//     <tr>
//       <td style="padding: 20px; text-align: left;">
//         <h3 style="color: #000;">Invoice Details</h3>
//         <p style="margin: 5px 0;"><strong>Order ID:</strong> ${billingData.order_id}</p>
//         <p style="margin: 5px 0;"><strong>Date of Purchase:</strong> ${billingData.dateOfPurchase}</p>
//         <p style="margin: 5px 0;"><strong>Invoice Number:</strong> ${billingData.invoiceNumber}</p>
//         <p style="margin: 5px 0;"><strong>Customer Name:</strong> ${billingData.customerName}</p>
//         <p style="margin: 5px 0;"><strong>Email:</strong> ${billingData.email}</p>
//         <p style="margin: 5px 0;"><strong>Order Status:</strong> ${billingData.delivery_status || "Pending"}</p>
//       </td>
//     </tr>

//     <!-- Order Summary Table -->
//     <tr>
//       <td style="padding: 20px; text-align: left; background-color: #f4f4f4;">
//         <h3 style="color: #000;">Order Summary</h3>
//         <table>
//           <thead>
//             <tr>
//               <th>Product</th>
//               <th>Unit Price</th>
//               <th>Quantity</th>
//               <th>Total</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${orderDetails.map(item => {
//               const unitPrice = item.finalPrice !== null && item.finalPrice !== undefined
//                 ? parseFloat(item.finalPrice)
//                 : parseFloat(item.priceRegular);

//               const quantity = parseInt(item.productQuantity);
//               const total = unitPrice * quantity;

//               return `
//                 <tr>
//                   <td>
//                     ${item.title}
//                     ${item.type === "variable" && item.variation ? `<br><small><strong>Variation:</strong> ${item.variation}</small>` : ""}
//                     ${item.selectedMilk ? `<br><small><strong>Milk:</strong> ${item.selectedMilk}</small>` : ""}
//                     ${item.whipped_cream ? `<br><small><strong>Whipped Cream:</strong> ${item.whipped_cream}</small>` : ""}
//                     ${item.extraNote ? `<br><small><strong>ExtraNote:</strong> ${item.extraNote}</small>` : ""}
//                     ${item.selectedProductAddOn ? `<br><small><strong>Selected AddOn:</strong> ${item.selectedProductAddOn}</small>` : ""}
//                   </td>
//                   <td>$${unitPrice}</td>
//                   <td>${quantity}</td>
//                   <td>$${item.totalPrice}</td>
//                 </tr>
//               `;
//             }).join('')}
//             <tr><td colspan="4"><p><strong>Additional Notes:</strong> ${billingData.extra_notes}</p></td></tr>
//           </tbody>
//         </table>
//       </td>
//     </tr>

//     <!-- Payment Details -->
//     <tr>
//       <td style="padding: 20px; text-align: left;">
//         <h3 style="color: #000;">Payment Details</h3>
//         <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${billingData.paymentMethod}</p>
//         <p style="margin: 5px 0;"><strong>Credit Card Number:</strong> ${maskCardNumber(billingData.cardNumber)}</p>
//         <p style="margin: 5px 0;"><strong>Total Amount:</strong> $${parseFloat(billingData.total).toFixed(2)}</p>
//       </td>
//     </tr>

//     <!-- Footer -->
//     <tr>
//       <td style="padding: 20px; text-align: center; font-size: 14px; background-color:#ffeb00;">
//         <p>If you have any questions regarding your order, feel free to contact our support team.</p>
//         <p>Best Regards,<br>EBES Team</p>
//       </td>
//     </tr>

//   </table>
// </body>
// </html>`;
// }


function orderStatusMailbody(billingData) {
  let orderDetails = [];
  console.log("billingData",billingData);
  

  // Ensure orderDetails is parsed if it's a string
  if (typeof billingData.orderDetails === "string") {
    try {
      orderDetails = JSON.parse(billingData.orderDetails);
    } catch (error) {
      console.error("Error parsing orderDetails:", error);
      orderDetails = []; // Default to empty array if parsing fails
    }
  } else if (Array.isArray(billingData.orderDetails)) {
    orderDetails = billingData.orderDetails;
  }
  console.log("orderDetailssss", orderDetails);
  
  const maskCardNumber = (cardNumber) => {
    if (!cardNumber || cardNumber.length < 4) return 'xxxx';
    return cardNumber.replace(/.(?=.{4})/g, 'x');
  };

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Invoice</title>
  <style>
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background-color: #f4f4f4; }
  </style>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 0;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: auto; border-collapse: collapse;">

    <!-- Header -->
    <tr>
      <td style="padding: 20px; text-align: left; background-color:#ffeb00;">
        <h3 style="color: #000;">Order Invoice</h3>
        <p style="margin: 5px 0;">Thank you for your order! Below is your invoice.</p>
      </td>
    </tr>

    <!-- Purchase Details -->
    <tr>
      <td style="padding: 20px; text-align: left;">
        <h3 style="color: #000;">Invoice Details</h3>
        <p style="margin: 5px 0;"><strong>Order ID:</strong> ${billingData.order_id}</p>
        <p style="margin: 5px 0;"><strong>Date of Purchase:</strong> ${billingData.dateOfPurchase}</p>
        <p style="margin: 5px 0;"><strong>Order Pickup Time:</strong> ${billingData.order_pickup_time}</p>
        <p style="margin: 5px 0;"><strong>Invoice Number:</strong> ${billingData.invoiceNumber || billingData.order_id}</p>
        <p style="margin: 5px 0;"><strong>Customer Name:</strong> ${billingData.customerName}</p>
        <p style="margin: 5px 0;"><strong>Email:</strong> ${billingData.email}</p>
        <p style="margin: 5px 0;"><strong>Order Status:</strong> ${billingData.delivery_status || "Pending"}</p>
      </td>
    </tr>

    <!-- Order Summary Table -->
    <tr>
      <td style="padding: 20px; text-align: left; background-color: #f4f4f4;">
        <h3 style="color: #000;">Order Summary</h3>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Unit Price</th>
              <th>Quantity</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${orderDetails.map(item => {
              const unitPrice = item.finalPrice !== null && item.finalPrice !== undefined
                ? parseFloat(item.finalPrice)
                : parseFloat(item.priceRegular);

              const quantity = parseInt(item.productQuantity);
              const total = unitPrice * quantity;

              // Generate HTML for Product AddOns
              let addOnsHTML = '';
              if (item.ProductAddOns && Array.isArray(item.ProductAddOns)) {
                item.ProductAddOns.forEach(addonGroup => {
                  if (addonGroup.addons && addonGroup.addons.length > 0) {
                    addonGroup.addons.forEach(addon => {
                      addOnsHTML += `<br><small><strong>${addonGroup.addonLable}:</strong> ${addon.addon_name} ($${addon.price})</small>`;
                    });
                  }
                });
              }

              return `
                <tr>
                  <td>
                    ${item.title}
                    ${item.type === "variable" && item.variation ? `<br><small><strong>Variation:</strong> ${item.variation}</small>` : ""}
                    ${addOnsHTML}
                    ${item.extraNote ? `<br><small><strong>ExtraNote:</strong> ${item.extraNote}</small>` : ""}
                  </td>
                  <td>$${unitPrice}</td>
                  <td>${quantity}</td>
                  <td>$${item.totalPrice}</td>
                </tr>
              `;
            }).join('')}
            <tr><td colspan="4"><p><strong>Additional Notes:</strong> ${billingData.extra_notes || "N/A"}</p></td></tr>
          </tbody>
        </table>
      </td>
    </tr>

    <!-- Payment Details -->
    <tr>
      <td style="padding: 20px; text-align: left;">
        <h3 style="color: #000;">Payment Details</h3>
        <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${billingData.paymentMethod}</p>
        <p style="margin: 5px 0;"><strong>Credit Card Number:</strong> ${maskCardNumber(billingData.cardNumber)}</p>
        <p style="margin: 5px 0;"><strong>Total Amount:</strong> $${parseFloat(billingData.total).toFixed(2)}</p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 20px; text-align: center; font-size: 14px; background-color:#ffeb00;">
        <p>If you have any questions regarding your order, feel free to contact our support team.</p>
        <p>Best Regards,<br>EBES Team</p>
      </td>
    </tr>

  </table>
</body>
</html>`;
}
