'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Product.belongsTo(models.Admin, { foreignKey: 'productAuthor' });
      Product.belongsTo(models.User);
      Product.belongsToMany(models.ProductCategory, { through: 'ProductCategoryMap', foreignKey: 'productId'});
      Product.hasMany(models.ProductCategoryMap, { foreignKey: 'productId' });
      // association for variations
      Product.hasMany(models.ProductVariation, {
        foreignKey: 'parentProductId',
        as: 'variations'
      });
    }
  }
  Product.init({
    title: DataTypes.STRING,
    type: {
      type: DataTypes.ENUM('simple', 'variable'),
      defaultValue: 'simple'
    },
    excerpt: DataTypes.TEXT,
    content: DataTypes.TEXT,
    ProductAddOns: DataTypes.STRING,
    productImage: DataTypes.STRING,
    priceRegular: DataTypes.FLOAT,
    priceOffer: DataTypes.FLOAT,
    isPublic:  {
      type: DataTypes.BOOLEAN,
      allowNull: false, // Set NOT NULL
      defaultValue: true, // Default value 1 (true)
    },
    productAuthor: DataTypes.INTEGER,
    UserId: DataTypes.INTEGER,
    status: {
      type: DataTypes.INTEGER,
      defaultValue: 1, // Set default value to 1
    },
  }, {
    sequelize,
    modelName: 'Product',
    tableName: 'products',
  });
  return Product;
};