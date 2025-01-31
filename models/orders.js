'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Orders extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Orders.init({
    order_id: DataTypes.STRING,
    payment_status: DataTypes.STRING,
    transaction_id: DataTypes.STRING,
    order_details: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Orders',
  });
  return Orders;
};