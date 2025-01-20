const Validator = require('fastest-validator');
const models = require('../models');
const { QueryTypes } = require('sequelize');

function save(req, res) {
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
    models.Product.create(product)
        .then((result) => {
            return models.ProductCategory.findOne({ where: { id: req.body.productCategory } })
                .then((categoryExists) => {
                    if (categoryExists) {
                        models.sequelize.query(
                            "INSERT INTO ProductCategoryMaps (productId, CategoryId, createdAt, updatedAt) VALUES (:productId, :CategoryId, :createdAt, :updatedAt)", {
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
                                    message: "Product and category created successfully",
                                    data: result,
                                });
                            })
                    } else {
                        res.status(400).json({
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
        include: [models.ProductCategory, models.User]
    }).then(result => {
        if (result) {
            res.status(200).json(result);
        } else {
            res.status(404).json({
                message: "Product not found!"
            })
        }
    }).catch(error => {
        res.status(500).json({
            message: "Something went wrong!",
            error: error.message,
        })
    });
}

function index(req, res) {
    models.Product.findAll().then(result => {
        res.status(200).json(result);
    }).catch(error => {
        res.status(500).json({
            message: "Something went wrong!"
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
                                `UPDATE ProductCategoryMaps 
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
                                    res.status(200).json({
                                        message: "Product updated successfully",
                                        data: updatedProduct
                                    });
                                })
                        } else {
                            res.status(400).json({
                                message: "Category does not exist",
                            });
                        }
                    }).catch(error => {
                        res.status(200).json({
                            message: "Something went wrong",
                            error: error
                        });
                    })
            })
        } else {
            res.status(400).json({
                message: "Category does not exist."
            });
        }
    });
}

function destroy(req, res) {
    console.log("destroyyy");

    const id = req.params.id;
    const userId = req.userData.userId;
    console.log("id",id);
    console.log("userId",userId);

    models.Product.update(
            { 
              status: 'inActive',
            },
            { 
              where: { 
                id: id, 
                productAuthor: userId 
              } 
            }
          ).then(result => {
        models.sequelize.query(
            "DELETE FROM ProductCategoryMaps WHERE productId = :productId", 
            {
                replacements: {
                    productId: id 
                },
                type: QueryTypes.DELETE
        }).then(() => {
                res.status(200).json({
                    message: "Product deleted successfully"
                });
            })
    }).catch(error => {
        console.log("error", error);

        res.status(200).json({
            message: "Something went wrong",
            error: error
        });
    });
}


//--For Product Category--//
function saveCategory(req, res) {
    const productCat = {
        categoryName: req.body.categoryName
    }

    const productCatSchema = {
        categoryName: { type: "string", optional: false, max: "100" }
    };

    const v = new Validator();
    const validationResponse = v.validate(productCat, productCatSchema);

    if (validationResponse !== true) {
        return res.status(400).json({
            message: "Validation failed",
            errors: validationResponse
        });
    }

    //Check if category already exists
    models.ProductCategory.findOne({ where: { categoryName: req.body.categoryName } })
        .then((categoryExists) => {
            if (categoryExists) {
                return res.status(409).json({
                    success: false,
                    message: "categoryName is already exist!",
                });
            }

            return models.ProductCategory.create(productCat);
        })
        .then((newproductCat) => {
            res.status(201).json({
                success: true,
                message: "Category created successfully",
                data: {
                    id: newproductCat.id,
                    categoryName: newproductCat.categoryName,
                },
            });
        })
        .catch((error) => {
            console.error("Error in user registration:", error.message);
            res.status(500).json({
                success: false,
                message: "Something went wrong!",
                error: error.message,
            });
        });
}

module.exports = {
    save: save,
    show: show,
    index: index,
    update: update,
    destroy: destroy,
    saveCategory: saveCategory
}