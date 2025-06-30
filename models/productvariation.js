// productvariation.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ProductVariation extends Model {
    static associate(models) {
      ProductVariation.belongsTo(models.Product, {
        foreignKey: 'parentProductId',
        as: 'parentProduct'
      });
    }
  }
  
  ProductVariation.init({
    parentProductId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    variationName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'ProductVariation',
    tableName: 'product_variations'
  });
  
  return ProductVariation;
};