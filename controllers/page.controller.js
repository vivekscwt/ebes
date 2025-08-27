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
        // const latestProducts = await models.Product.findAll({
        //     where: { status: 1, isPublic: true },
        //     order: [['createdAt', 'DESC']],
        //     limit: 6
        // });

        // const Breadcategory = await models.ProductCategory.findOne({
        //     where: { id: 5 }, // Assuming 5 is the ID for "Cuban Bread & Sandwiches"
        //     include: [
        //         {
        //             model: models.Product,
        //             where: {
        //                 isPublic: true,
        //                 status: 1
        //             },
        //             through: { attributes: [] }
        //         }
        //     ]
        // });
        // if (!Breadcategory) {
        //     var BreadcategoryProducts = {
        //         message: new Error("Cuban Bread & Sandwiches category products not found")
        //     };
        // }else {
        //     // Convert the category and its products to JSON
        //     var BreadcategoryProducts = Breadcategory.Products;
        // }
        // console.log("BreadcategoryProducts:", BreadcategoryProducts);
        
        // for (const productInstance of BreadcategoryProducts) {
        //     const product = productInstance.get({ plain: true });

        //     if (product.type === 'variable') {
        //         const variations = await models.ProductVariation.findAll({
        //             where: { parentProductId: product.id },
        //             attributes: ['id', 'variationName', 'price']
        //         });
        //         product.variations = variations.map(v => v.get({ plain: true }));
        //     }
        // }
        const Breadcategory = await models.ProductCategory.findOne({
            where: { id: 5 }, // Assuming 5 is the ID for "Cuban Bread & Sandwiches"
            include: [
                {
                    model: models.Product,
                    where: {
                        isPublic: true,
                        status: 1
                    },
                    through: { attributes: [] }
                }
            ]
        });
let BreadcategoryProducts = [];

if (!Breadcategory) {
    BreadcategoryProducts = []; // or an empty array, not a string
} else {
    BreadcategoryProducts = await Promise.all(
        Breadcategory.Products.map(async (productInstance) => {
            const product = productInstance.get({ plain: true });

            if (product.type === 'variable') {
                const variations = await models.ProductVariation.findAll({
                    where: { parentProductId: product.id },
                    attributes: ['id', 'variationName', 'price']
                });
                product.variations = variations.map(v => v.get({ plain: true }));
            }

            return product;
        })
    );
}

console.log("BreadcategoryProducts with variations:", BreadcategoryProducts);



        const Kidscategory = await models.ProductCategory.findOne({
            where: { id: 12 }, // Assuming 12 is the ID for "Kids Menu"
            include: [
                {
                    model: models.Product,
                    where: {
                        isPublic: true,
                        status: 1
                    },
                    through: { attributes: [] }
                }
            ]
        });
        if (!Kidscategory) {
            var KidscategoryProducts = {
                message: new Error("Kids Menu category products not found")
            };
        }else {
            // Convert the category and its products to JSON
            var KidscategoryProducts = Kidscategory.Products;
        }
        // for (const productInstance of KidscategoryProducts) {
        //     // Convert Sequelize instance to plain object
        //     const product = productInstance.get({ plain: true });

        //     if (product.type === 'variable') {
        //         const variations = await models.ProductVariation.findAll({
        //             where: { parentProductId: product.id },
        //             attributes: ['id', 'variationName', 'price']
        //         });
        //         // Convert variations to plain objects
        //         product.variations = variations.map(v => v.get({ plain: true }));
        //     }
        // }

        const finalProducts = [];

        for (const productInstance of KidscategoryProducts) {
            const product = productInstance.get({ plain: true });

            if (product.type === 'variable') {
                const variations = await models.ProductVariation.findAll({
                    where: { parentProductId: product.id },
                    attributes: ['id', 'variationName', 'price']
                });
                product.variations = variations.map(v => v.get({ plain: true }));
            }

            finalProducts.push(product); // build new array
        }

        console.log("KidscategoryProducts with variations:", JSON.stringify(finalProducts, null, 2));

        

        // Define productSalesArray at a higher scope to ensure availability
        let productSalesArray = [];

        try {
        const orders = await models.Order_Product.findAll({
            where: { payment_status: 'success' },
            attributes: ['order_details'],
            raw: true,
        });

        const productSales = new Map();

        for (const order of orders) {
            const orderDetails = JSON.parse(order.order_details);

            for (const product of orderDetails) {
            const productId = product.id;
            const quantity = product.productQuantity;

            const productExists = await models.Product.findOne({
                where: { id: productId, isPublic: true, status: 1 },
                raw: true,
            });

            if (productExists) {
                productSales.set(productId, (productSales.get(productId) || 0) + quantity);
            }
            }
        }

        const productSalesArrayRaw = Array.from(productSales, ([productId, productQuantity]) => ({
            productId,
            productQuantity,
        }));

        productSalesArrayRaw.sort((a, b) => b.productQuantity - a.productQuantity);

        const bestSellingProductIds = productSalesArrayRaw.map(item => item.productId);

        if (bestSellingProductIds.length > 0) {
            const bestSellingProducts = await models.Product.findAll({
            where: { id: bestSellingProductIds },
            raw: true,
            });

            productSalesArray = bestSellingProducts.map(product => {
            const productQuantity = productSales.get(product.id) || 0;
            return { ...product, productQuantity };
            });

            productSalesArray.sort((a, b) => b.productQuantity - a.productQuantity);
            productSalesArray = productSalesArray.slice(0, 4);
            for (const product of productSalesArray) {
                if (product.type == 'variable') {
                    const variations = await models.ProductVariation.findAll({
                        where: { parentProductId: product.id },
                        attributes: ['id', 'variationName', 'price']
                    });
                    product.variations = variations;
                }
            }
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
                BreadcategoryProducts: BreadcategoryProducts,
                KidscategoryProducts: finalProducts,
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

/**
 * Get Page Details By Page ID
 */
function getPageData(req, res) {
    const id = req.params.id;

    // Fetch page details by ID
    models.Page.findByPk(id, {
    }).then(result => {
        if (result) {
            // Convert result to JSON and extract Admin details
            let responseData = result.toJSON();
            // responseData.User = responseData.Admin;
            // delete responseData.Admin;

            // Send success response with page details
            res.status(200).json({
                success: true,
                message: "Page fetched successfully.",
                result: responseData
            });
        } else {
            // Send not found response if page not found
            res.status(404).json({
                success: false,
                message: "Page not found!"
            })
        }
    }).catch(error => {
        // Log error and send internal server error response
        console.error("Error fetching page:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong!",
            error: error.message,
        })
    });
}

//Update Page Data by Page ID
function updatePageData(req, res) {
    const id = req.params.id;
    const { pageHeading, pageContent, bannerImage } = req.body;

    // Validate input fields
    if (!pageHeading || !pageContent) {
        return res.status(400).json({
          success: false,
          message: "All pageHeading &  pageContent field are required.",
        });
      }


    // Fetch page details by ID
    models.Page.findByPk(id, {
    }).then(result => {
        if (result) {
            // Update page details
            models.Page.update({
                pageHeading: pageHeading,
                pageContent: pageContent,
                bannerImage: bannerImage || "default-banner.png",
            }, {            
                where: { id: id }
            }).then(() => {
                // Send success response
                res.status(200).json({
                    success: true,
                    message: "Page updated successfully.",
                    result: result
                });
            }).catch(error => {
                // Log error and send internal server error response
                console.error("Error updating page:", error);
                res.status(500).json({
                    success: false,
                    message: "Something went wrong!",
                    error: error.message,
                })
            });
        } else {
            // Send not found response if page not found
            res.status(404).json({
                success: false,
                message: "Page not found!"
            })
        }
    }).catch(error => {
        // Log error and send internal server error response        
        console.error("Error fetching page:", error);
        res.status(500).json({
            success: false,
            message: "Something went wrong!",
            error: error.message,
        })
    });
}

module.exports = {
    saveBanner: saveBanner,
    getAllBanner: getAllBanner,
    getHomeData: getHomeData,
    getPageData: getPageData,
    updatePageData: updatePageData
}