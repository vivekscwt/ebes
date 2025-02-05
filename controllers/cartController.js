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
    try{
        var {user_id, product_id, product_price} = req.body;

        var cartQuery = await models.User_cart.findAll({
            where:{
                user_id: user_id
            }
        })
        console.log("cartQuery.length", cartQuery.length);
        
        const updatedCart = {
            product_id: product_id,
            product_price: product_price
        }
        if(cartQuery.length>0){
            var product = await models.User_cart.update(updatedCart,{
                where:{
                    user_id: user_id
                }
            })
            return res.status(200).json({
                success: true,
                message: `user cart added successfully.`,
                result: updatedCart
            })
        } else {
            var product = await models.User_cart.create({
                user_id: user_id,
                product_id: product_id,
                product_price: product_price
            })
            return res.status(200).json({
                success: true,
                message: `user cart added successfully.`,
                result: product
            })
        }
    } catch(error){
        console.error("Error deleting images:", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong!",
            error: error.message
        });
    }
}
