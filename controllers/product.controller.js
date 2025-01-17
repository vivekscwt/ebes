const Validator = require('fastest-validator');
const models = require('../models');

function save(req, res){
    const product = {
        title: req.body.title,
        excerpt: req.body.excerpt,
        content: req.body.content,
        productImage: req.body.productImage,
        priceRegular: req.body.priceRegular,
        priceOffer: req.body.priceOffer,
        productAuthor: req.userData.userId
    }

    const schema = {
        title: {type:"string", optional: false, max: "200"},
        excerpt: {type: "string", optional: true, max: "500"},
        content: {type: "string", optional: false},
        productImage: {type: "string", optional: true},
        priceRegular: {type: "number", optional: false},
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

    if(validationResponse !== true){
        return res.status(400).json({
            message: "Validation failed",
            errors: validationResponse
        });
    }
    
    // Check if category exists before creating product
    // models.ProductCategory.findByPk(req.body.category_id)
    // .then((category) => {
    //     if (!category) {
    //         return res.status(400).json({
    //             message: "Invalid Category ID",
    //         });
    //     }

    //     // Create product
    //     models.Product.create(product)
    //         .then((result) => {
    //             res.status(201).json({
    //                 message: "Product created successfully",
    //                 data: result,
    //             });
    //         })
    //         .catch((error) => {
    //             res.status(500).json({
    //                 message: "Something went wrong",
    //                 error: error.message, // Return the error message
    //             });
    //         });
    // })
    // .catch((error) => {
    //     res.status(500).json({
    //         message: "Failed to fetch category",
    //         error: error.message, // Return the error message
    //     });
    // });

    // Directly create product (bypassing category check)
    models.Product.create(product)
    .then((result) => {
        res.status(201).json({
            message: "Product created successfully",
            data: result,
        });
    })
    .catch((error) => {
        res.status(500).json({
            message: "Something went wrong",
            error: error.message, // Return the error message
        });
    });
}

function show(req, res){
    const id = req.params.id;

    models.Product.findByPk(id, {
        include:[models.ProductCategory, models.User]
    }).then(result => {
        if(result){
            res.status(200).json(result);
        }else{
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

function index(req, res){
    models.Product.findAll().then(result => {
        res.status(200).json(result);
    }).catch(error => {
        res.status(500).json({
            message: "Something went wrong!"
        });
    });
}

function update(req, res){
    const id = req.params.id;
    const updatedProduct = {
        title: req.body.title,
        excerpt: req.body.excerpt,
        content: req.body.content,
        priceRegular: req.body.priceRegular,
        priceOffer: req.body.priceOffer,
    }
    
    const userId =  req.userData.user;

    const schema = {
        title: {type:"string", optional: false, max: "200"},
        excerpt: {type: "text", optional: true, max: "500"},
        content: {type: "text", optional: false},
        priceRegular: {type: "number", optional: false},
        priceOffer: {type: "number", optional: true},
    }
    
    const v = new Validator();
    const validationResponse = v.validate(updatedProduct, schema);

    if(validationResponse !== true){
        return res.status(400).json({
            message: "Validation failed",
            errors: validationResponse
        });
    }

    models.ProductCategory.findByPk(req.body.category_id).then(result => {
        if(result !== null){
            models.Product.update(updatedProduct, {where: {id:id, userId: userId}}).then(result => {
                res.status(200).json({
                    message: "Product updated successfully",
                    data: updatedProduct
                });
            }).catch(error => {
                res.status(200).json({
                    message: "Something went wrong",
                    error: error
                });
            })
        }else{
            res.status(400).json({
                message: "Invalid Category ID"
            });
        }
    });
}

function destroy(req, res){
    const id = req.params.id;
    const userId =  req.userData.user;

    models.Product.destroy({where:{id:id, userId:userId}}).then(result => {
        res.status(200).json({
            message: "Product deleted successfully"
        });
    }).catch(error => {
        res.status(200).json({
            message: "Something went wrong",
            error: error
        });
    });
}


//--For Product Category--//
function saveCategory(req, res){
    const productCat = {
        categoryName: req.body.categoryName
    }

    const productCatSchema = {
        categoryName: {type:"string", optional: false, max: "100"}
    };

    const v = new Validator();
    const validationResponse = v.validate(productCat, productCatSchema);

    if(validationResponse !== true){
        return res.status(400).json({
            message: "Validation failed",
            errors: validationResponse
        });
    }

    //Check if category already exists
    models.ProductCategory.findOne({ where: { categoryName:req.body.categoryName } })
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