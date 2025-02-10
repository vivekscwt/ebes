// cartController.js

const models = require('../models');
const { verifyToken } = require('../utils/token'); 


exports.getShoppingCart = (req, res) => {
    const userId = req.params.userId;
    cartModel.getShoppingCart(userId)
        .then(result => {
            res.send({
                success: true,
                message: "Shopping cart fetched successfully.",
                result: result
            })
        })
        .catch(err => {
            console.error(err.message);
            res.status(500).send("Error fetching shopping cart.");
        });
};

exports.addToCart = (req, res) => {
    const { customerId, productId, quantity, isPresent } = req.body;
    cartModel.addToCart(customerId, productId, quantity, isPresent)
        .then(result => {
            res.send({
                success: true,
                message: "Cart added successfully.",
                result: result
            })
        })
        .catch(err => {
            console.error(err.message);
            res.status(500).send("Error adding product to cart.");
        });
};

exports.removeFromCart = (req, res) => {
    const productId = req.params.productId;
    const userId = req.params.userId;
    cartModel.removeFromCart(productId, userId)
        .then(result => {
            res.send(result);
        })
        .catch(err => {
            console.error(err.message);
            res.status(500).send("Error removing product from cart.");
        });
};


exports.buy = (req, res) => {
    // Extract JWT token from the request headers
    const token = req.headers.authorization;

    // Check if token is present and properly formatted
    if (!token || !token.startsWith('Bearer ')) {
        return res.status(401).send('Unauthorized: Missing or invalid token');
    }

    // Extract the token from the header
    const tokenValue = token.split(' ')[1];

    // Verify the token
    verifyToken(tokenValue)
        .then(decoded => {
            // Token is valid, proceed with cartModel.buy function
            const customerId = req.params.id;
            const address = req.body.address;

            cartModel.buy(customerId, address)
                .then(result => {
                    res.send(result);
                })
                .catch(err => {
                    console.error(err.message);
                    res.status(500).send("Error removing product from cart.");
                });
        })
        .catch(err => {
            // Token verification failed
            console.error('Token verification failed:', err);
            return res.status(401).send('Unauthorized: Invalid token');
        });
};

exports.verifyCart = async (req, res) => {
    const { Logedin_user_ID, Cart_data } = req.body;

    try {

        // Check if Cart_data exists and contains products
        if (!Array.isArray(Cart_data) || Cart_data.length === 0) {
            // Delete user cart data if Cart_data is empty
            if (Logedin_user_ID) {
                await models.User_cart.destroy({ where: { user_id: Logedin_user_ID } });
            }

            return res.status(200).json({
                success: true,
                message: "Cart is empty.",
                result:{
                    'Logedin_user_ID' : Logedin_user_ID,
                    'Cart_data' :[]
                }
            });
        }

        let updatedCartData = [];
        for (const item of Cart_data) {
            const product = await models.Product.findOne({
                where: { id: item.id }
            });

            // If product does not exist, skip it
            if (!product) continue;

            let updatedItem = { ...item };

            // Check and update priceRegular & priceOffer if incorrect
            if (product.priceRegular !== item.priceRegular || product.priceOffer !== item.priceOffer) {
                updatedItem.priceRegular = product.priceRegular;
                updatedItem.priceOffer = product.priceOffer;
            }

            updatedCartData.push({ ...updatedItem, user_id: Logedin_user_ID });
        }

        // Delete existing cart for user if Logedin_user_ID is not null
        if (Logedin_user_ID) {
            await models.User_cart.destroy({ where: { user_id: Logedin_user_ID } });

            // Save updated cart data as a single row with cart_products stored as JSON
            if (updatedCartData.length > 0) {
                await models.User_cart.create({
                    user_id: Logedin_user_ID,
                    cart_products: JSON.stringify(updatedCartData) // Store as JSON string
                });
            }
        }
        

        return res.status(200).json({
            success: true,
            message: "Cart saved successfully.",
            result:{
                'Logedin_user_ID' : Logedin_user_ID,
                'Cart_data' : updatedCartData
            }
        });

    }catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong!",
            error: error.message
        });
    }
}

