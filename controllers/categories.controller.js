const Validator = require('fastest-validator');
const { Op } = require("sequelize");
const models = require('../models');
const { QueryTypes } = require('sequelize');

//--For Product Category--//
const saveCategory = async (req, res) => {
  const { categoryName, categoryImage, AddOns } = req.body;

  // Input validation schema
  const productCatSchema = {
    categoryName: { type: "string", optional: false, max: "100" },
    AddOns: {
      type: "array",
      optional: true,
      items: {
        type: "object",
        props: {
          name: { type: "string", optional: false },
          price: { type: "number", optional: false }
        }
      }
    }
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
    const newCategory = await models.ProductCategory.create({ categoryName, categoryImage, AddOns: AddOns ? JSON.stringify(AddOns) : null });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      result: {
        id: newCategory.id,
        categoryName: newCategory.categoryName,
        categoryImage: newCategory.categoryImage,
        AddOns: newCategory.AddOns ? JSON.parse(newCategory.AddOns) : []
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
  const { categoryId, categoryName, categoryImage, AddOns } = req.body;

  // Input validation schema
  const categorySchema = {
    categoryId: { type: "number", positive: true, integer: true, optional: false },
    categoryName: { type: "string", optional: false, max: "100" },
    AddOns: {
      type: "array",
      optional: true,
      items: {
        type: "object",
        props: {
          name: { type: "string", optional: false },
          price: { type: "number", optional: false }
        }
      }
    }
  };

  const v = new Validator();
  const validationResponse = v.validate({ categoryId, categoryName, AddOns }, categorySchema);

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
        id: { [Op.ne]: categoryId },
      },
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: "A category with this name already exists!",
      });
    }

    // Update the category
    category.categoryName = categoryName;
    category.categoryImage = categoryImage;
    category.AddOns = AddOns ? JSON.stringify(AddOns) : null;

    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      result: {
        id: category.id,
        categoryName: category.categoryName,
        categoryImage: category.categoryImage,
        AddOns: category.AddOns ? JSON.parse(category.AddOns) : []
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
          where: {
            isPublic: true,
            status: 1
          },
          through: { attributes: [] },
          //attributes: ['id', 'title', 'priceRegular'] 
          required: false
        }
      ]
    });

    // Process categories to parse AddOns
    const processedCategories = categories.map(category => ({
      ...category.toJSON(),
      AddOns: category.AddOns ? JSON.parse(category.AddOns) : []
    }));


    return res.status(200).json({
      success: true,
      message: "Categories fetched successfully. Total Count: " + processedCategories.length,
      result: processedCategories
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong!",
      error: error.message // Show detailed error message
    });
  }
};


/**
 * Fetches products of a category by category id.
 */
const categoryProductListing = async (req, res) => {
  const categoryId = req.params.id;
  try {
    // Fetch category by id with included products
    const categories = await models.ProductCategory.findAll({
      where: { id: categoryId },
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
    return res.status(200).json({
      success: true,
      message: "Category fetched successfully.",
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
  try {
    const id = req.params.id;

    const deletedCategory = await models.ProductCategory.destroy({
      where: { id: id }
    });
    await models.ProductCategoryMap.update(
      { categoryId: null },
      { where: { categoryId: id } }
    );
    return res.status(200).json({
      success: true,
      message: `Category deleted successfully.`,
    });

  } catch (error) {
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
  categoryProductListing: categoryProductListing,
  destroy: destroy
}