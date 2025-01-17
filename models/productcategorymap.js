'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ProductCategoryMap extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      ProductCategoryMap.belongsTo(models.Product, { foreignKey: 'productId' });
      ProductCategoryMap.belongsTo(models.ProductCategory, { foreignKey: 'CategoryId' });
    }
  }
  ProductCategoryMap.init({
    productId: DataTypes.INTEGER,
    CategoryId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'ProductCategoryMap',
  });
  return ProductCategoryMap;
};