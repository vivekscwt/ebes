const Validator = require('fastest-validator');
const { Op } = require("sequelize");
const models = require('../models');
const { QueryTypes } = require('sequelize');

async function save(req, res) {
    const product = {
        title: req.body.title,
        excerpt: req.body.excerpt,
        content: req.body.content,
        productImage: req.body.productImage,
        priceRegular: req.body.priceRegular,
        priceOffer: req.body.priceOffer,
        productAuthor: req.userData.userId,
    }

    const schema = {
        title: { type: "string", optional: false, max: "200" },
        excerpt: { type: "string", optional: true, max: "500" },
        content: { type: "string", optional: false },
        productImage: { type: "string", optional: true },
        priceRegular: { type: "number", optional: false },
        productCategory: { type: "number", optional: true },
        priceOffer: {
            type: "number",
            optional: true,
            custom: (value, errors, schema, field, parent) => {
                // Ensure priceOffer is less than priceRegular
                if (value !== undefined && parent.priceRegular !== undefined) {
                    // Check if priceOffer is greater than or equal to priceRegular
                    if (value >= parent.priceRegular) {
                        errors.push({
                            type: "priceOfferGreater",
                            actual: value,
                            field
                        });
                    }
                }
                return value;
            },
        },
    };

    // Custom messages for errors
    const messages = {
        priceOfferGreater: "Price offer ({actual}) must be less than price regular.",
    };

    const v = new Validator({ messages });
    const validationResponse = v.validate(product, schema);

    if (validationResponse !== true) {
        return res.status(400).json({
            message: "Validation failed",
            errors: validationResponse
        });
    }
    const existingProduct = await models.Product.findOne({ where: { title: req.body.title } });

    if (existingProduct) {
        return res.status(409).json({
            success: false,
            message: "Product already exists!",
        });
    }
    models.Product.create(product)
        .then((result) => {
            return models.ProductCategory.findOne({ where: { id: req.body.productCategory } })
                .then((categoryExists) => {
                    if (categoryExists) {
                        models.sequelize.query(
                            "INSERT INTO productcategorymaps (productId, CategoryId, createdAt, updatedAt) VALUES (:productId, :CategoryId, :createdAt, :updatedAt)", {
                            replacements: {
                                productId: result.dataValues.id,
                                CategoryId: req.body.productCategory,
                                createdAt: new Date(),
                                updatedAt: new Date()
                            },
                            type: QueryTypes.INSERT
                        })
                            .then(() => {
                                res.status(201).json({
                                    success: true,
                                    message: "Product created successfully",
                                    result: result,
                                });
                            })
                    } else {
                        res.status(400).json({
                            success: false,
                            message: "Category does not exist.",
                        });
                    }
                });
        })
        .catch((error) => {
            res.status(500).json({
                message: "Something went wrong",
                error: error.message,
            });
        });

}

function show(req, res) {
    const id = req.params.id;

    models.Product.findByPk(id, {
        include: [
            {
                model: models.ProductCategory,
                attributes: ['id', 'categoryName'], 
                through: { attributes: [] } 
            },
            {
                model: models.Admin, 
                attributes: ['id', 'fname', 'lname', 'email']
            }
        ]
        // include: [models.ProductCategory, models.User]
    }).then(result => {
        if (result) {
            let responseData = result.toJSON();
            responseData.User = responseData.Admin;
            delete responseData.Admin;

            res.status(200).json({
                success: true,
                message: "Product fetched successfully.",
                result: responseData
            });
        } else {
            res.status(404).json({
                success: false,
                message: "Product not found!"
            })
        }
    }).catch(error => {
        res.status(500).json({
            success: false,
            message: "Something went wrong!",
            error: error.message,
        })
    });
}

// function index(req, res) {
//     models.Product.findAll().then(result => {
//         res.status(200).json({
//             success: true,
//             message: "Product fetched succesfully.",
//             result: result
//         });
//     }).catch(error => {
//         res.status(500).json({
//             message: "Something went wrong!"
//         });
//     });
// }
function index(req, res) {
    models.Product.findAll({
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
        order: [['createdAt', 'DESC']] // Orders by latest created product first
    })
    .then(result => {
        res.status(200).json({
            success: true,
            message: "Products fetched successfully.",
            result: result
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


function update(req, res) {
    const id = req.params.id;
    const updatedProduct = {
        title: req.body.title,
        excerpt: req.body.excerpt,
        content: req.body.content,
        priceRegular: req.body.priceRegular,
        priceOffer: req.body.priceOffer,
        isPublic: req.body.isPublic,
        productImage: req.body.productImage,
    }

    const userId = req.userData.userId;

    const schema = {
        title: { type: "string", optional: false, max: "200" },
        excerpt: { type: "string", optional: true, max: "500" },
        content: { type: "string", optional: false },
        priceRegular: { type: "number", optional: false },
        priceOffer: { type: "number", optional: true },
        productCategory: { type: "number", optional: true },
    }

    const v = new Validator();
    const validationResponse = v.validate(updatedProduct, schema);

    if (validationResponse !== true) {
        return res.status(400).json({
            message: "Validation failed",
            errors: validationResponse
        });
    }

    models.ProductCategory.findByPk(req.body.category_id).then(result => {

        if (result !== null) {
            models.Product.update(updatedProduct, { where: { id: id, productAuthor: userId } }).then(result => {

                return models.ProductCategory.findOne({ where: { id: req.body.category_id } })
                    .then((categoryExists) => {
                        if (categoryExists) {
                            models.sequelize.query(
                                `UPDATE productcategorymaps 
                         SET CategoryId = :CategoryId, updatedAt = :updatedAt 
                         WHERE productId = :productId`,
                                {
                                    replacements: {
                                        productId: id,
                                        CategoryId: req.body.category_id,
                                        updatedAt: new Date()
                                    },
                                    type: QueryTypes.UPDATE
                                })
                                .then(() => {
                                    return res.status(200).json({
                                        success: true,
                                        message: "Product updated successfully",
                                        result: updatedProduct
                                    });
                                })
                        } else {
                           return res.status(400).json({
                                success: false,
                                message: "Category does not exist",
                            });
                        }
                    }).catch(error => {
                        return res.status(200).json({
                            success: false,
                            message: "Something went wrong",
                            error: error
                        });
                    })
            })
        } else {
            return res.status(400).json({
                success: false,
                message: "Category does not exist."
            });
        }
    });
}

function destroy(req, res) {
    const id = req.params.id;
    const userId = req.userData.userId;

    models.Product.update(
            { 
              status: 0,
            },
            { 
              where: { 
                id: id, 
                // productAuthor: userId 
              } 
            }
          ).then(result => {
        models.sequelize.query(
            "DELETE FROM productcategorymaps WHERE productId = :productId", 
            {
                replacements: {
                    productId: id 
                },
                type: QueryTypes.DELETE
        }).then(() => {
                res.status(200).json({
                    success: true,
                    message: "Product deleted successfully"
                });
            })
    }).catch(error => {
        console.log("error", error);

        res.status(200).json({
            success: false,
            message: "Something went wrong",
            error: error
        });
    });
}






module.exports = {
    save: save,
    show: show,
    index: index,
    update: update,
    destroy: destroy
}