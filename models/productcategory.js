'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ProductCategory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      //ProductCategory.hasMany(models.ProductCategoryMap, { foreignKey: 'CategoryId' });
      ProductCategory.belongsToMany(models.Product, { through: 'ProductCategoryMap', foreignKey: 'categoryId' });
    }
  }
  ProductCategory.init({
    categoryName: DataTypes.STRING,
    categoryImage: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'ProductCategory',
  });
  return ProductCategory;
};