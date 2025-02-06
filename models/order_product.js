'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Order_Product extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Order_Product.hasMany(models.Order_History, {
        foreignKey: 'order_id',
        as: 'orderHistories', // alias to reference in the future
      });
    }
  }
  Order_Product.init({
    order_id: DataTypes.STRING,
    customerName: DataTypes.STRING,
    email: DataTypes.STRING,
    phone: DataTypes.STRING,
    total_amount: DataTypes.DECIMAL,
    payment_status: DataTypes.STRING,
    order_details: DataTypes.STRING,
    userId: DataTypes.INTEGER,
    order_pickup_time: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Order_Product',
    tableName: 'order_products'
  });
  return Order_Product;
};