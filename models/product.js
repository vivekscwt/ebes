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
    }
  }
  Product.init({
    title: DataTypes.STRING,
    excerpt: DataTypes.TEXT,
    content: DataTypes.TEXT,
    priceRegular: DataTypes.FLOAT,
    priceOffer: DataTypes.FLOAT,
    isPublic:  {
      type: DataTypes.BOOLEAN,
      allowNull: false, // Set NOT NULL
      defaultValue: true, // Default value 1 (true)
    },
    productAuthor: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Product',
  });
  return Product;
};