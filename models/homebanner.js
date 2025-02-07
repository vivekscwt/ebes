'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class HomeBanner extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  HomeBanner.init({
    heading: DataTypes.TEXT,
    content: DataTypes.TEXT,
    image: DataTypes.TEXT,
    order: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'HomeBanner',
    tableName: 'homebanners',
  });
  return HomeBanner;
};