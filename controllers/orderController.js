// orderController.js

const orderModel = require("../models/orders");
const crypto = require('crypto');
const { createTransactionv2 } = require("../authorize.net");
const { sendSuccess, sendError } = require("../libs/responseLib");


exports.getAllOrders = (req, res) => {
    orderModel.getAllOrders()
        .then(result => {
            res.send({
                success: true,
                message: "Orders fetched successfully.",
                result: result
            });
        })
        .catch(err => {
            console.error(err.message);
            res.status(500).send("Error fetching orders.");
        });
};

exports.getOrderById = (req, res) => {
    const orderId = req.params.id;
    orderModel.getOrderById(orderId)
        .then(result => {
            res.send({
                success: true,
                message: "Orders fetched successfully.",
                result: result
            })
        })
        .catch(err => {
            console.error(err.message);
            res.status(500).send({
                success: false,
                message: "Error fetching order."
            });
        });
};

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
                message:"Error updating order."
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
                message:"Error getting order."
            });
        });
};

// Function to generate a token
function generateToken() {
    const token = crypto.randomBytes(16).toString('hex');
      return token;
}

function invoice(billingData) {
    return `
      <table class="table_custome">
    <tr>
      <th style="border-bottom: 1px solid #000;   padding: 20px 20px;   display: block; width: 100%;">
       <a href=""><img src="https://infoonmydate.com/assets/logo.jpg" alt="365logo" style="display: block; margin-right: auto; width: 24%;"></a>
      </th>
      <th style="text-align: left; border-bottom: 1px solid #000;   padding: 20px 20px;     display: block;    width: 100%;">
        <h4 style="color: #000; font-style: 24px;     line-height: normal;">365 INSTANT CHECK - BILLING RECEIPT</h4>
        <p style="color: #000;  font-size: 16px;    line-height: 26px; margin-bottom: 10px;">Date of Purchase: ${billingData.dateOfPurchase}</p>
        <p style="color: #000;  font-size: 16px;    line-height: 26px; margin-bottom: 10px;">Customer Name: ${billingData.customerName}</p>
        <p style="color: #000;  font-size: 16px;    line-height: 26px; margin-bottom: 0px;">Customer Email: ${billingData.email}</p>
      </th>
      <th style="text-align: left; border-bottom: 1px solid #000;   padding: 20px 20px;     display: block;    width: 100%;">
        <h4 style=" color: #000; font-style: 24px;     line-height: normal;">365 Instant Check: </h4>
        <p style="color: #000;  font-size: 16px;    line-height: 26px; margin-bottom: 10px;">Search Description : ${billingData.searchType} Background Report</p>
        <p style="color: #000;  font-size: 16px;    line-height: 26px; margin-bottom: 10px;">Quantity: ${billingData.quantity} </p>
        <p style="color: #000;  font-size: 16px;    line-height: 26px; margin-bottom: 10px;">Unit Price: $${billingData.unitPrice} </p>
        <p style="color: #000;  font-size: 16px;    line-height: 26px; margin-bottom: 0px;">Total: $${billingData.total} </p>
      </th>
      <th style="text-align: left; border-bottom: 1px solid #000;   padding: 20px 20px;     display: block;    width: 100%;">
        <p style="color: #000;  font-size: 16px;    line-height: 26px; margin-bottom: 10px;">Payment Details </p>
        <p style="color: #000;  font-size: 16px;    line-height: 26px; margin-bottom: 10px;">Payment Method: ${billingData.paymentMethod} </p>
        <p style="color: #000;  font-size: 16px;    line-height: 26px; margin-bottom: 10px;">Credit Card Number: ${billingData.cardNumber.replace(/.(?=.{4})/g, 'x')}</p>
        <p style="color: #000;  font-size: 16px;    line-height: 26px; margin-bottom: 0px;">Total Amount: $${billingData.total}</p>
      </th>
      <th style="text-align: left;  border-bottom: 1px solid #000;   padding: 20px 20px;     display: block;    width: 100%;">
        <p style="color: #000;  font-size: 16px;    line-height: 26px; margin-bottom: 10px;">This transaction has been
          approved. </p>
        <p style="color: #000;  font-size: 16px;    line-height: 26px; margin-bottom: 10px;">Auth Code: ${billingData.authCode} </p>
        <p style="color: #000;  font-size: 16px;    line-height: 26px; margin-bottom: 10px;">Credit Card Number: ${billingData.cardNumber.replace(/.(?=.{4})/g, 'x')}</p>
        <p style="color: #000;  font-size: 16px;    line-height: 26px; margin-bottom: 0px;">Transaction ID: ${billingData.transactionId}
        </p>
      </th>
      <th style="text-align: left; border-bottom: 1px solid #000;   padding: 20px 20px;     display: block;    width: 100%;">
        <p style="color: #000;  font-size: 16px;    line-height: 26px; margin-bottom: 10px;">Thank you for your
          purchase!</p>
        <p style="color: #000;  font-size: 16px;    line-height: 26px; margin-bottom: 0px;">You have successfully
          purchased the 365 Instant Check Report listed above. If you have any questions or need further assistance,
          feel free to contact us.
        </p>
      </th>
      <th style="text-align: left;  border-bottom: 1px solid #000;   padding: 20px 20px;     display: block;    width: 100%;">
        <p style="color: #000;  font-size: 16px;    line-height: 26px; margin-bottom: 10px;">365 Instant Check </p>
        <p style="color: #000;  font-size: 16px;    line-height: 26px; margin-bottom: 10px;">Customer Support: Support
          Email: </p>
        <p style="color: #000;  font-size: 16px;    line-height: 26px; margin-bottom: 0px;">365InstantCheck.com
        </p>
      </th>
    </tr>
  </table>
  
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

exports.handlePayment = async (req, res, next) => {
  // Set common headers before any response is sent
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Headers", "x-payment-api-key");
  const { amount, productOriginalPrice, productType, couponCode, firstName, lastName, email, customerProfileId, customerPaymentProfileId, paymentNonce } = req.body;
//   const { id } = req.user;
  const { id } = req.body;
  let { useSavedCard } = req.body;
  if (parseFloat(amount) !== parseFloat(productOriginalPrice) && !couponCode) {
      return next(new BadrequestError("Amount mismatch"));
  }
  
  try {
    //   const product = await db.Product.findOne({
    //       where: { type: productType, deletedFlag: false },
    //       attributes: ["id", "type", "price"],
    //       raw: true,
    //   });
    //   if (!product) {
    //       return next(new NotFoundError("Product not found"));
    //   }
    //   // product price
    //   const searchProductPrice = product.price;

      // check amount == searchProductPrice
    //   if (parseFloat(searchProductPrice) !== parseFloat(productOriginalPrice)) {
    //       return next(new BadrequestError("Amount mismatch"));
    //   }

      let coupon = null;
    //   if (couponCode) {
    //       coupon = await db.Coupon.findOne({
    //           where: { code: couponCode, deletedFlag: false },
    //           attributes: ["id", "code", "discount", "type", "limit", "usedCount", "expiryDate"],
    //           raw: true,
    //       });

    //       if (!coupon) {
    //           return next(new NotFoundError("Coupon not found"));
    //       }
    //       // Check if the coupon has exceeded its usage limit
    //       if (coupon.usedCount >= coupon.limit) {
    //           return next(new BadrequestError("Coupon usage limit exceeded"));
    //       }

    //       // Check if the coupon has expired
    //       const currentDate = new Date();
    //       const expiryDate = new Date(coupon.expiryDate);

    //       if (currentDate > expiryDate) {
    //           return next(new BadrequestError("Coupon has expired"));
    //       }

    //       // coupon discount price
    //       const searchCouponDiscountPrice = parseFloat(coupon.discount);
    //       const searchCouponDiscountType = coupon.type;

    //       // Validate if the productDiscountedPrice (amount) is calculated correctly
    //       let expectedFinalPrice = 0;
    //       if (searchCouponDiscountType == "fixed") {
    //           expectedFinalPrice = searchProductPrice - searchCouponDiscountPrice;
    //       } else if (searchCouponDiscountType == "percentage") {
    //           expectedFinalPrice = searchProductPrice - (searchProductPrice * searchCouponDiscountPrice) / 100;
    //       } else {
    //           return next(new BadrequestError("Invalid discount type"));
    //       }

    //       if (parseFloat(amount) !== parseFloat(expectedFinalPrice.toFixed(2))) {
    //           return next(new BadrequestError("Discounted price calculation mismatch"));
    //       }
    //   }
      const customerData = { firstName, lastName, email };

      const token = await generateToken();
      console.log("createdtoken",token);

      const transactionResponse = await createTransactionv2(amount, useSavedCard, paymentNonce, customerProfileId, customerPaymentProfileId, customerData, "Basic", token);
      if (transactionResponse.getResponseCode() === "1") {
          if (!token) {
              return next(new UnhandledError("Token generation failed"));
          }
          
          

          const transactionId = transactionResponse.getTransId();
        //   const insertedToken = await db.Token.create({
        //       token,
        //       paymentStatus: "success",
        //       transactionId,
        //   });

        //   if (!insertedToken) {
        //       return next(new UnhandledError("Token insertion failed"));
        //   }

          // Billing data
          var billingData = {
              dateOfPurchase: new Date().toISOString().split('T')[0],
              customerName: customerData?.firstName + " " + customerData?.lastName,
              email: email,
            //   searchType: product?.type,
              searchType:'Basic',
              quantity: 1,
              total: amount,
              unitPrice: amount,
              paymentMethod: transactionResponse.accountType,
              cardNumber: `**** **** **** ${transactionResponse.accountNumber.slice(4)}`,
              authCode: transactionResponse.getAuthCode(),
              transactionId: transactionId,
          };
          // Insert billing data
        //   await db.BillingDetail.create({
        //       transactionId: transactionId,
        //       customerName: billingData.customerName,
        //       email: billingData.email,
        //     //   productType: product.type,
        //       productType:'Basic',
        //       quantity: billingData.quantity,
        //       total: billingData.total,
        //       paymentMethod: billingData.paymentMethod,
        //       cardNumber: billingData.cardNumber,
        //       purchaseDate: billingData.dateOfPurchase,
        //       tokenId: insertedToken.id,
        //       userId: id,
        //   });

          // Send Invoice email
          const invoice_template = invoice(billingData);

          //If coupon used and coupon matched update usedCount +1
        //   if (coupon) {
        //       const usedCount = (coupon.usedCount || 0) + 1;
        //       db.Coupon.update({ usedCount: usedCount }, { where: { id: coupon.id } });
        //   }

          // Add email job to queue
          sendEmail(email, "Invoice", invoice_template);

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

