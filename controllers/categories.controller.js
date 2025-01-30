const Validator = require('fastest-validator');
const { Op } = require("sequelize");
const models = require('../models');
const { QueryTypes } = require('sequelize');

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
        result: {
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
        result: {
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
        const categories = await models.ProductCategory.findAll({
            include: [
                {
                    model: models.Product,
                    through: { attributes: [] }, 
                    //attributes: ['id', 'title', 'priceRegular'] 
                }
            ]
        });
        

        return res.status(200).json({
            success: true,
            message: "Categories fetched successfully.",
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

async function destroy(req, res) {
  try{
    const id = req.params.id;

      const deletedCategory = await models.ProductCategory.destroy({
        where: { id: id } 
      });
      await models.ProductCategoryMap.update(
        { categoryId: null }, 
        { where: {categoryId: id} }
      );
      return res.status(200).json({
        success: true,
        message: `Category deleted successfully.`,
      });

    }catch(error){
      console.error(error);
      return res.status(500).json({
          success: false,
          message: "Something went wrong!",
      });
    }
}


module.exports = {
    saveCategory: saveCategory,
    updateCategory: updateCategory,
    categoryListing: categoryListing,
    destroy: destroy
}