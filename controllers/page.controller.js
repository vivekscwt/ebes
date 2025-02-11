const Validator = require('fastest-validator');
const { Op } = require("sequelize");
const models = require('../models');
const { QueryTypes } = require('sequelize');

async function saveBanner(req, res) {
    const banners = req.body;

    if (!Array.isArray(banners)) {
        return res.status(400).json({
            success: false,
            message: "Invalid input. Expected an array of banners."
        });
    }

    try {
        // Delete all existing records in the HomeBanner table
        await models.HomeBanner.destroy({ where: {} });

        let successCount = 0;
        let failedItems = [];

        for (const banner of banners) {
            try {
                // Check if "image" exists and is not empty
                if (!banner.image || banner.image.trim() === "") {
                    throw new Error("Image is required and cannot be empty.");
                }

                // Check if "order" exists and is a number
                if (!banner.order || isNaN(banner.order)) {
                    throw new Error("Order is required and must be a number.");
                }

                await models.HomeBanner.create({
                    heading: banner.heading.substring(0, 80), // Trim to 80 chars
                    content: banner.content.substring(0, 150), // Trim to 150 chars
                    image: banner.image,
                    order: parseInt(banner.order) // Convert order to number
                });

                successCount++;
            } catch (error) {
                failedItems.push({ banner, error: error.message });
            }
        }

        if (successCount > 0 && failedItems.length > 0) {
            return res.status(207).json({
                success: true,
                message: "Partial insertion completed.",
                result:{
                    successCount: successCount,
                    failedCount: failedItems.length,
                    failedItems: failedItems
                }
            });
        }
        if (successCount == 0 && failedItems.length > 0) {
            return res.status(207).json({
                success: false,
                message: "Insertion failed.",
                result:{
                    successCount: successCount,
                    failedCount: failedItems.length,
                    failedItems: failedItems
                }
            });
        }

        res.status(201).json({
            success: true,
            message: "All banners inserted successfully",
            result:{
                successCount: successCount
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while clearing the table or inserting banners.",
            error: error.message
        });
    }
}

async function getAllBanner(req, res) {
    try {
        // Retrieve all banners ordered by order
        const banners = await models.HomeBanner.findAll({
            order: [['order']]
        });

        // Send success response with retrieved banners
        res.status(200).json({
            success: true,
            message: "Banners fetched successfully.",
            result: banners
        });
    } catch (error) {
        // Log error and send error response
        console.error("Error fetching banners:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching banners.",
            error: error.message
        });
    }
}

/**
 * Function to retrieve all banner details, all product categories, and the latest 6 products.
*/
async function getHomeData(req, res) {
    try {
        // Retrieve all banners ordered by 'order'
        const banners = await models.HomeBanner.findAll({
            order: [['order']]
        });

        // Retrieve all product categories
        const categories = await models.ProductCategory.findAll();

        // Retrieve the latest 6 products ordered by 'createdAt' in descending order
        const latestProducts = await models.Product.findAll({
            where: { status: 1, isPublic: true },
            order: [['createdAt', 'DESC']],
            limit: 6
        });

        // Define productSalesArray at a higher scope to ensure availability
        let productSalesArray = [];

        // Best-selling Products
        try {
            // Fetch all orders from the order_products table
            const orders = await models.Order_Product.findAll({
                attributes: ['order_details'], // Fetch only the order_details column
                raw: true,
            });

            // Initialize a Map to store product IDs and their total quantities
            const productSales = new Map();

            // Process each order
            orders.forEach((order) => {
                const orderDetails = JSON.parse(order.order_details); // Parse the JSON array

                // Iterate through each product in the order
                orderDetails.forEach((product) => {
                    const productId = product.id;
                    const quantity = product.quantity;

                    // Update the total quantity for the product ID
                    productSales.set(productId, (productSales.get(productId) || 0) + quantity);
                });
            });

            // Convert the Map to an array of { productId, totalQuantity } objects
            const productSalesArrayRaw = Array.from(productSales, ([productId, totalQuantity]) => ({
                productId,
                totalQuantity,
            }));
            

            // Sort the array by totalQuantity in descending order
            productSalesArrayRaw.sort((a, b) => b.totalQuantity - a.totalQuantity);

            // Extract only product IDs
            const bestSellingProductIds = productSalesArrayRaw.map(item => item.productId);

            if (bestSellingProductIds.length > 0) {
                // Fetch product details for best-selling products
                const bestSellingProducts = await models.Product.findAll({
                    where: { id: bestSellingProductIds },
                    raw: true
                });

                // Merge product details with totalQuantity
                productSalesArray = bestSellingProducts.map(product => {
                    const totalQuantity = productSales.get(product.id) || 0;
                    return { ...product, totalQuantity };
                });

                // Sort again just in case (to ensure proper order after merging)
                productSalesArray.sort((a, b) => b.totalQuantity - a.totalQuantity);

                // Keep only the top 4 best-selling products
                productSalesArray = productSalesArray.slice(0, 4);
            }

        } catch (error) {
            console.error("Error fetching best-selling products:", error.message);
        }

        // Send success response with retrieved data
        res.status(200).json({
            success: true,
            message: "Home data fetched successfully.",
            result: {
                banners: banners,
                categories: categories,
                latestProducts: latestProducts,
                Bestsellers: productSalesArray
            }
        });
    } catch (error) {
        // Log error and send error response
        console.error("Error fetching home data:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching home data.",
            error: error.message
        });
    }
}

module.exports = {
    saveBanner: saveBanner,
    getAllBanner: getAllBanner,
    getHomeData: getHomeData
}