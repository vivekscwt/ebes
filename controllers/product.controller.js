const Validator = require('fastest-validator');
const models = require('../models');

function save(req, res){
    const product = {
        title: req.body.title,
        excerpt: req.body.excerpt,
        content: req.body.content,
        priceRegular: req.body.priceRegular,
        priceOffer: req.body.priceOffer,
        productAuthor: req.userData.user
    }

    const schema = {
        title: {type:"string", optional: false, max: "200"},
        excerpt: {type: "text", optional: true, max: "500"},
        content: {type: "text", optional: false},
        priceRegular: {type: "number", optional: false},
        priceOffer: {type: "number", optional: true},
    }
    
    const v = new Validator();
    const validationResponse = v.validate(product, schema);

    if(validationResponse !== true){
        return res.status(400).json({
            message: "Validation failed",
            errors: validationResponse
        });
    }
    
    models.ProductCategory.findByPk(req.body.category_id).then(result => {
        if(result !== null){
            models.Product.create(product).then(result => {
                res.status(201).json({
                    message: "Product created successfully",
                    data: result
                });
            }).catch(error => {
                res.status(500).json({
                    message: "Something went wrong",
                    error: error
                });
            });
        }else{
            res.status(400).json({
                message: "Invalid Category ID"
            });
        }
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
            message: "Something went wrong!"
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
 
module.exports = {
    save: save,
    show: show,
    index: index,
    update: update,
    destroy: destroy
}