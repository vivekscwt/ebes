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

        // Send success response with retrieved data
        res.status(200).json({
            success: true,
            message: "Home data fetched successfully.",
            result: {
                banners: banners,
                categories: categories,
                latestProducts: latestProducts,
                Bestsellers: []
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