'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Stordetail extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Stordetail.init({
    Address: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Stordetail',
    tableName: 'stordetails',
  });
  return Stordetail;
};