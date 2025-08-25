const Validator = require('fastest-validator');
const { Op } = require("sequelize");
const models = require('../models');
const { QueryTypes } = require('sequelize');

// async function save(req, res) {
//     const product = {
//         title: req.body.title,
//         excerpt: req.body.excerpt,
//         content: req.body.content,
//         productImage: req.body.productImage || 'default-image.png',
//         priceRegular: req.body.priceRegular,
//         priceOffer: req.body.priceOffer,
//         productAuthor: req.userData.userId,
//     }

//     const schema = {
//         title: { type: "string", optional: false, max: "200" },
//         excerpt: { type: "string", optional: true, max: "500" },
//         content: { type: "string", optional: false },
//         productImage: { type: "string", optional: true },
//         priceRegular: { type: "number", optional: false },
//         productCategory: { type: "number", optional: true },
//         priceOffer: {
//             type: "number",
//             optional: true,
//             custom: (value, errors, schema, field, parent) => {
//                 // Ensure priceOffer is less than priceRegular
//                 if (value !== undefined && parent.priceRegular !== undefined) {
//                     // Check if priceOffer is greater than or equal to priceRegular
//                     if (value >= parent.priceRegular) {
//                         errors.push({
//                             type: "priceOfferGreater",
//                             actual: value,
//                             field
//                         });
//                     }
//                 }
//                 return value;
//             },
//         },
//     };

//     // Custom messages for errors
//     const messages = {
//         priceOfferGreater: "Price offer ({actual}) must be less than price regular.",
//     };

//     const v = new Validator({ messages });
//     const validationResponse = v.validate(product, schema);

//     if (validationResponse !== true) {
//         return res.status(400).json({
//             message: "Validation failed",
//             errors: validationResponse
//         });
//     }
//     const existingProduct = await models.Product.findOne({ where: { title: req.body.title } });

//     if (existingProduct) {
//         return res.status(409).json({
//             success: false,
//             message: "Product already exists!",
//         });
//     }
//     models.Product.create(product)
//         .then((result) => {
//             return models.ProductCategory.findOne({ where: { id: req.body.productCategory } })
//                 .then((categoryExists) => {
//                     if (categoryExists) {
//                         models.sequelize.query(
//                             "INSERT INTO productcategorymaps (productId, CategoryId, createdAt, updatedAt) VALUES (:productId, :CategoryId, :createdAt, :updatedAt)", {
//                             replacements: {
//                                 productId: result.dataValues.id,
//                                 CategoryId: req.body.productCategory,
//                                 createdAt: new Date(),
//                                 updatedAt: new Date()
//                             },
//                             type: QueryTypes.INSERT
//                         })
//                             .then(() => {
//                                 res.status(201).json({
//                                     success: true,
//                                     message: "Product created successfully",
//                                     result: result,
//                                 });
//                             })
//                     } else {
//                         res.status(400).json({
//                             success: false,
//                             message: "Category does not exist.",
//                         });
//                     }
//                 });
//         })
//         .catch((error) => {
//             res.status(500).json({
//                 message: "Something went wrong",
//                 error: error.message,
//             });
//         });

// }

async function save(req, res) {
    // Base product data
    const product = {
        title: req.body.title,
        type: req.body.type, // 'simple' or 'variable'
        excerpt: req.body.excerpt,
        content: req.body.content,
        ProductAddOns: JSON.stringify(req.body.ProductAddOns) || null,
        // ProductAddOns: req.body.ProductAddOns || null, 
        productImage: req.body.productImage || 'default-image.png',
        priceRegular: req.body.priceRegular || null,
        priceOffer: req.body.priceOffer || null,
        productAuthor: req.userData.userId,
    };

    // Updated validation schema
    // 1. Remove variations from schema entirely
    const schema = {
        title: { type: "string", optional: false, max: "200" },
        type: {
            type: "enum",
            values: ["simple", "variable"],
            optional: false
        },
        excerpt: { type: "string", optional: true, max: "500" },
        content: { type: "string", optional: false },
        ProductAddOns: { type: "array", optional: true },
        // ProductAddOns: { type: "object", optional: true },
        productImage: { type: "string", optional: true },
        priceRegular: {
            type: "number",
            optional: true,
            custom: (value, errors, schema, field, parent) => {
                if (value !== undefined && value !== null) {
                    if (value <= 0) {
                        errors.push({
                            type: "priceRegularInvalid",
                            actual: value,
                            field
                        });
                    }
                    if (parent.type === 'simple' && parent.priceOffer !== undefined && parent.priceOffer !== null) {
                        if (value === undefined || value === null) {
                            errors.push({
                                type: "priceRegularRequiredWithOffer",
                                field
                            });
                        }
                    }
                }
                return value;
            }
        },
        priceOffer: {
            type: "number",
            optional: true,
            custom: (value, errors, schema, field, parent) => {
                if (value !== undefined && value !== null) {
                    if (parent.type === 'simple' && parent.priceRegular !== undefined && value >= parent.priceRegular) {
                        errors.push({
                            type: "priceOfferGreater",
                            actual: value,
                            field
                        });
                    }
                    if (value <= 0) {
                        errors.push({
                            type: "priceOfferInvalid",
                            actual: value,
                            field
                        });
                    }
                }
                return value;
            }
        },
        productCategory: { type: "number", optional: true },
    };


    const messages = {
        priceOfferGreater: "Price offer ({actual}) must be less than price regular.",
        priceRegularInvalid: "Price regular must be a positive number (got {actual}).",
        priceRegularRequiredWithOffer: "Price regular is required when price offer is provided.",
        priceOfferInvalid: "Price offer must be a positive number (got {actual}).",
        variatonsRequired: "Variations are required for variable products.",
        variationPriceInvalid: "Variation price must be a positive number (got {actual})."
    };

    const v = new Validator({ messages });
    const validationResponse = v.validate({ ...product, ...req.body }, schema);

    if (validationResponse !== true) {
        return res.status(400).json({
            message: "Validation failed",
            errors: validationResponse
        });
    }
    // Manual variations check for 'variable' type
    if (req.body.type === 'variable') {
        const variations = req.body.variations;
        if (!Array.isArray(variations) || variations.length === 0) {
            return res.status(400).json({
                message: "Validation failed",
                errors: [{
                    field: "variations",
                    type: "variationsRequired",
                    message: "Variations are required for variable products."
                }]
            });
        }

        // Optional: validate each variation
        for (let [index, variation] of variations.entries()) {
            if (!variation.variation_name || typeof variation.variation_name !== 'string') {
                return res.status(400).json({
                    message: "Validation failed",
                    errors: [{
                        field: `variations[${index}].variation_name`,
                        message: "Variation name is required and must be a string."
                    }]
                });
            }
            if (
                typeof variation.variation_price !== 'number' ||
                variation.variation_price <= 0
            ) {
                return res.status(400).json({
                    message: "Validation failed",
                    errors: [{
                        field: `variations[${index}].variation_price`,
                        message: "Variation price must be a positive number."
                    }]
                });
            }
        }
    }

    try {
        // Check if product already exists
        const existingProduct = await models.Product.findOne({ where: { title: req.body.title } });
        if (existingProduct) {
            return res.status(409).json({
                success: false,
                message: "Product already exists!",
            });
        }

        // Start transaction
        const result = await models.sequelize.transaction(async (t) => {
            // Create main product
            const createdProduct = await models.Product.create(product, { transaction: t });

            // If variable product, create variations
            if (product.type === 'variable' && req.body.variations) {
                const variations = req.body.variations.map(variation => ({
                    parentProductId: createdProduct.id,
                    variationName: variation.variation_name,
                    price: variation.variation_price
                }));

                await models.ProductVariation.bulkCreate(variations, { transaction: t });
            }

            // Associate with category if provided
            if (req.body.productCategory) {
                const categoryExists = await models.ProductCategory.findByPk(req.body.productCategory, { transaction: t });
                if (!categoryExists) {
                    throw new Error("Category does not exist.");
                }

                // Use the model's create method instead of raw query
                await models.ProductCategoryMap.create({
                    productId: createdProduct.id,
                    categoryId: req.body.productCategory,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }, { transaction: t });
            }

            return createdProduct;
        });

        // If we got here, everything succeeded
        res.status(201).json({
            success: true,
            message: "Product created successfully",
            result: {
                ...result.toJSON(),
                ProductAddOns: product.ProductAddOns ? JSON.parse(product.ProductAddOns) : [],
                variations: product.type === 'variable' ? req.body.variations : undefined
            },
        });

    } catch (error) {
        res.status(500).json({
            message: "Something went wrong",
            error: error.message,
        });
    }
}

async function show(req, res) {
    const id = req.params.id;

    try {
        const product = await models.Product.findByPk(id, {
            include: [
                {
                    model: models.ProductCategory,
                    attributes: ['id', 'categoryName', 'AddOns'],
                    through: { attributes: [] }
                },
                {
                    model: models.Admin,
                    attributes: ['id', 'fname', 'lname', 'email']
                }
            ]
        });
        
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found!"
            });
        }

        let responseData = product.toJSON();
        responseData.User = responseData.Admin;
        delete responseData.Admin;
        
        // Parse ProductAddOns
        responseData.ProductAddOns = responseData.ProductAddOns
            ? JSON.parse(responseData.ProductAddOns)
            : [];

        // Parse AddOns for each product category
        if (responseData.ProductCategories && responseData.ProductCategories.length > 0) {
            responseData.ProductCategories = responseData.ProductCategories.map(category => {
                return {
                    ...category,
                    AddOns: category.AddOns ? JSON.parse(category.AddOns) : []
                };
            });
        }

        // If product is variable type, fetch variations
        if (responseData.type === 'variable') {
            const variations = await models.ProductVariation.findAll({
                where: { parentProductId: id },
                attributes: ['id', 'variationName', 'price']
            });
            responseData.variations = variations;
        }

        res.status(200).json({
            success: true,
            message: "Product fetched successfully.",
            result: responseData
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrong!",
            error: error.message,
        });
    }
}

// This function is intended to search for products based on a keyword.
function searchProduct(req, res) {
    const keyword = req.params.keyword;

    if (!keyword) {
        return res.status(400).json({
            success: false,
            message: "Please provide a search keyword"
        });
    }

    models.Product.findAll({
        where: {
            status: 1,
            title: {
                [models.Sequelize.Op.like]: `%${keyword}%` // Case-insensitive partial match
            }
        },
        include: [
            {
                model: models.ProductCategory,
                attributes: ['id', 'categoryName', 'categoryImage'],
                through: { attributes: [] }
            },
            {
                model: models.Admin,
                attributes: ['id', 'fname', 'lname', 'email']
            }
        ],
        order: [['createdAt', 'DESC']]
    })
        .then(results => {
            // Transform the results to match your show function's format
            const transformedResults = results.map(product => {
                const productJson = product.toJSON();
                if (productJson.Admin) {
                    productJson.User = productJson.Admin;
                    delete productJson.Admin;
                }
                return productJson;
            });

            res.status(200).json({
                success: true,
                message: results.length > 0
                    ? "Products found successfully. Total products: " + results.length
                    : "No products found matching your search.",
                result: transformedResults
            });
        })
        .catch(error => {
            res.status(500).json({
                success: false,
                message: "Something went wrong!",
                error: error.message
            });
        });
}

async function index(req, res) {
    try {
        const products = await models.Product.findAll({
            where: {
                status: 1
            },
            include: [
                {
                    model: models.ProductCategory,
                    attributes: ['id', 'categoryName', 'categoryImage'],
                    through: { attributes: [] }
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        // Get variations for all variable products in one query
        const variableProductIds = products
            .filter(product => product.type === 'variable')
            .map(product => product.id);

        const variations = variableProductIds.length > 0
            ? await models.ProductVariation.findAll({
                where: { parentProductId: variableProductIds },
                attributes: ['id', 'parentProductId', 'variationName', 'price']
            })
            : [];

        // Map variations to their products
        const variationsMap = variations.reduce((map, variation) => {
            if (!map[variation.parentProductId]) {
                map[variation.parentProductId] = [];
            }
            map[variation.parentProductId].push(variation);
            return map;
        }, {});

        // Prepare response data
        const responseData = products.map(product => {
            const productJson = product.toJSON();

            // Parse ProductAddOns
            productJson.ProductAddOns = productJson.ProductAddOns
                ? JSON.parse(productJson.ProductAddOns)
                : [];

            // Add variations if product is variable
            if (product.type === 'variable') {
                productJson.variations = variationsMap[product.id] || [];
            }

            return productJson;
        });

        res.status(200).json({
            success: true,
            message: "Products fetched successfully. Total products: " + responseData.length,
            result: responseData
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrong!",
            error: error.message
        });
    }
}

/**
 * Function to update a product
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function update(req, res) {
    const id = req.params.id;
    const userId = req.userData.userId;

    // Parse ProductAddOns safely (can come as string or array)
    let productAddOns = req.body.ProductAddOns;
    if (typeof productAddOns === 'string') {
        try {
            productAddOns = JSON.parse(productAddOns);
        } catch (e) {
            return res.status(400).json({
                message: "Validation failed",
                errors: [{
                    field: "ProductAddOns",
                    message: "Invalid JSON in ProductAddOns"
                }]
            });
        }
    }

    if (!Array.isArray(productAddOns)) {
        return res.status(400).json({
            message: "Validation failed",
            errors: [{
                field: "ProductAddOns",
                type: "array",
                message: "ProductAddOns must be an array.",
                actual: productAddOns
            }]
        });
    }

    const updatedProduct = {
        title: req.body.title,
        excerpt: req.body.excerpt,
        content: req.body.content,
        ProductAddOns: productAddOns.length ? JSON.stringify(productAddOns) : null,
        priceRegular: req.body.priceRegular || null,
        priceOffer: req.body.priceOffer || null,
        isPublic: req.body.isPublic,
        productImage: req.body.productImage,
        type: req.body.type, // Important: include this,
    };

    // Basic validation
    const schema = {
        title: { type: "string", optional: false, max: "200" },
        excerpt: { type: "string", optional: true, max: "500" },
        content: { type: "string", optional: false },
        ProductAddOns: { type: "array", optional: true },
        priceRegular: {
            type: "number",
            optional: true,
            custom: (value, errors, schema, field, parent) => {
                if (value !== undefined && value !== null) {
                    if (value <= 0) {
                        errors.push({
                            type: "priceRegularInvalid",
                            actual: value,
                            field
                        });
                    }
                    if (parent.type === 'simple' && parent.priceOffer !== undefined && parent.priceOffer !== null) {
                        if (value === undefined || value === null) {
                            errors.push({
                                type: "priceRegularRequiredWithOffer",
                                field
                            });
                        }
                    }
                }
                return value;
            }
        },
        priceOffer: {
            type: "number",
            optional: true,
            custom: (value, errors, schema, field, parent) => {
                if (value !== undefined && parent.priceRegular !== undefined && value >= parent.priceRegular) {
                    errors.push({ type: "priceOfferGreater", actual: value, field });
                }
                return value;
            }
        },
        type: {
            type: "enum",
            values: ["simple", "variable"],
            optional: false
        },
        productCategory: { type: "number", optional: true },
    };

    const v = new Validator({
        messages: {
            priceOfferGreater: "Price offer ({actual}) must be less than price regular.",
            ProductAddOns: "ProductAddOns must be an array."
        }
    });

    const validationResponse = v.validate({
        ...updatedProduct,
        ProductAddOns: productAddOns
    }, schema);

    if (validationResponse !== true) {
        return res.status(400).json({
            message: "Validation failed",
            errors: validationResponse
        });
    }

    // Manual validation for variable product variations
    if (updatedProduct.type === 'variable') {
        if (!Array.isArray(req.body.variations) || req.body.variations.length === 0) {
            return res.status(400).json({
                message: "Validation failed",
                errors: [{
                    field: "variations",
                    message: "Variations are required for variable products."
                }]
            });
        }

        for (let [index, variation] of req.body.variations.entries()) {
            if (!variation.variation_name || typeof variation.variation_name !== 'string') {
                return res.status(400).json({
                    message: "Validation failed",
                    errors: [{
                        field: `variations[${index}].variation_name`,
                        message: "Variation name is required and must be a string."
                    }]
                });
            }
            if (typeof variation.variation_price !== 'number' || variation.variation_price <= 0) {
                return res.status(400).json({
                    message: "Validation failed",
                    errors: [{
                        field: `variations[${index}].variation_price`,
                        message: "Variation price must be a positive number."
                    }]
                });
            }
        }
    }

    try {
        await models.sequelize.transaction(async (t) => {
            // Check if product exists and is owned by the current user
            const product = await models.Product.findOne({ where: { id, productAuthor: userId }, transaction: t });
            if (!product) {
                throw new Error("Product not found or unauthorized.");
            }

            // Update main product
            await models.Product.update(updatedProduct, { where: { id }, transaction: t });

            // Handle variations
            if (updatedProduct.type === 'variable') {
                // Delete existing variations
                await models.ProductVariation.destroy({ where: { parentProductId: id }, transaction: t });

                // Insert new variations
                const newVariations = req.body.variations.map(v => ({
                    parentProductId: id,
                    variationName: v.variation_name,
                    price: v.variation_price
                }));

                await models.ProductVariation.bulkCreate(newVariations, { transaction: t });
            }

            // Handle category update
            if (req.body.category_id) {
                const category = await models.ProductCategory.findByPk(req.body.category_id, { transaction: t });
                if (!category) throw new Error("Category does not exist.");

                await models.sequelize.query(
                    `UPDATE productcategorymaps SET CategoryId = :CategoryId, updatedAt = :updatedAt WHERE productId = :productId`,
                    {
                        replacements: {
                            productId: id,
                            CategoryId: req.body.category_id,
                            updatedAt: new Date()
                        },
                        transaction: t,
                        type: QueryTypes.UPDATE
                    }
                );
            }
        });

        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            result: {
                ...updatedProduct,
                ProductAddOns: productAddOns,
                variations: updatedProduct.type === 'variable' ? req.body.variations : undefined
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message
        });
    }
}


async function destroy(req, res) {
    const id = req.params.id;
    const userId = req.userData.userId;

    try {
        // Step 1: Fetch product
        const product = await models.Product.findOne({
            where: { id /*, productAuthor: userId */ }
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }

        // Step 2: Start transaction
        await models.sequelize.transaction(async (t) => {

            // Step 3: If variable, delete variations
            if (product.type === 'variable') {
                await models.ProductVariation.destroy({
                    where: { parentProductId: id },
                    transaction: t
                });
            }

            // Step 4: Soft delete product
            await models.Product.update(
                { status: 0 },
                { where: { id }, transaction: t }
            );

            // Step 5: Delete category mapping
            await models.sequelize.query(
                "DELETE FROM productcategorymaps WHERE productId = :productId",
                {
                    replacements: { productId: id },
                    type: QueryTypes.DELETE,
                    transaction: t
                }
            );
        });

        // Final response
        return res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });

    } catch (error) {
        console.error("error", error);
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message
        });
    }
}







module.exports = {
    save: save,
    show: show,
    index: index,
    update: update,
    destroy: destroy,
    searchProduct: searchProduct
}