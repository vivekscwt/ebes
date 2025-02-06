'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Order_History extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Order_History.belongsTo(models.Order_Product, {
        foreignKey: 'order_id',
        as: 'orderProduct',  // alias to reference in the future
      });
    }
  }
  Order_History.init({
    order_id: DataTypes.STRING,
    transactionId: DataTypes.STRING,
    customerName: DataTypes.STRING,
    email: DataTypes.STRING,
    total: DataTypes.DECIMAL,
    paymentMethod: DataTypes.STRING,
    cardNumber: DataTypes.STRING,
    purchaseDate: DataTypes.DATE,
    tokenId: DataTypes.INTEGER,
    userId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Order_History',
    tableName: 'order_histories'
  });
  return Order_History;
};