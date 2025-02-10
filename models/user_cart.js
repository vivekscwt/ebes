'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User_cart extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  User_cart.init({
    user_id: DataTypes.INTEGER,
    cart_products: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'User_cart',
    tableName: 'user_carts',
  });
  return User_cart;
};