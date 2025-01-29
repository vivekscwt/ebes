const Validator = require('fastest-validator');
const { Op } = require("sequelize");
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
                                    success: true,
                                    message: "Product created successfully",
                                    data: result,
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
        include: [models.ProductCategory, models.User]
    }).then(result => {
        if (result) {
            res.status(200).json({
                success: true,
                message: "Product fetched succesfully.",
                result: result
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

function index(req, res) {
    models.Product.findAll().then(result => {
        res.status(200).json({
            success: true,
            message: "Product fetched succesfully.",
            result: result
        });
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
                                    return res.status(200).json({
                                        success: true,
                                        message: "Product updated successfully",
                                        data: updatedProduct
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


//--For Product Category--//
const saveCategory = async (req, res) => {
    const { categoryName, categoryImage } = req.body;
  
    // Input validation schema
    const productCatSchema = {
      categoryName: { type: "string", optional: false, max: "100" },
    };
  
    const v = new Validator();
    const validationResponse = v.validate({ categoryName }, productCatSchema);
  
    // Check if validation failed
    if (validationResponse !== true) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationResponse,
      });
    }
  
    try {
      // Check if category already exists
      const existingCategory = await models.ProductCategory.findOne({ where: { categoryName } });
  
      if (existingCategory) {
        return res.status(409).json({
          success: false,
          message: "Category already exists!",
        });
      }
  
      // Create new category
      const newCategory = await models.ProductCategory.create({ categoryName,categoryImage});
  
      return res.status(201).json({
        success: true,
        message: "Category created successfully",
        data: {
          id: newCategory.id,
          categoryName: newCategory.categoryName,
          categoryImage: newCategory.categoryImage
        },
      });
    } catch (error) {
      console.error("Error while creating category:", error.message);
  
      return res.status(500).json({
        success: false,
        message: "An error occurred while creating the category.",
        error: error.message,
      });
    }
};

//--For Product Update Category--//

const updateCategory = async (req, res) => {
    const { categoryId, categoryName, categoryImage } = req.body;
  
    // Input validation schema
    const categorySchema = {
      categoryId: { type: "number", positive: true, integer: true, optional: false },
      categoryName: { type: "string", optional: false, max: "100" },
    };
  
    const v = new Validator();
    const validationResponse = v.validate({ categoryId, categoryName }, categorySchema);
  
    // Check if validation failed
    if (validationResponse !== true) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationResponse,
      });
    }
  
    try {
      // Fetch category by ID
      const category = await models.ProductCategory.findByPk(categoryId);
  
      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found!",
        });
      }
  
      // Check if another category with the same name exists
      const existingCategory = await models.ProductCategory.findOne({
        where: {
          categoryName,
          id: { [Op.ne]: categoryId }, // Exclude the current category from duplicate check
        },
      });
  
      if (existingCategory) {
        return res.status(409).json({
          success: false,
          message: "A category with this name already exists!",
        });
      }
  
      // Update the category name
      category.categoryName = categoryName;
      category.categoryImage = categoryImage
      await category.save();
  
      return res.status(200).json({
        success: true,
        message: "Category updated successfully",
        data: {
          id: category.id,
          categoryName: category.categoryName,
          categoryImage: category.categoryImage
        },
      });
    } catch (error) {
      console.error("Error while updating category:", error.message);
  
      return res.status(500).json({
        success: false,
        message: "An error occurred while updating the category.",
        error: error.message,
      });
    }
  };
//categoryListing

const categoryListing = async (req, res) => {
    try {
        const categories = await models.ProductCategory.findAll();

        return res.status(200).json({
            success: true,
            message: "Category listing fetched successfully.",
            result: categories
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong!",
            error: error.message // Show detailed error message
        });
    }
};





module.exports = {
    save: save,
    show: show,
    index: index,
    update: update,
    destroy: destroy,
    saveCategory: saveCategory,
    updateCategory: updateCategory,
    categoryListing: categoryListing
}