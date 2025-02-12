'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.hasMany( sequelize.define('Product'), { foreignKey: 'productAuthor' });
      //User.hasMany( sequelize.define('Order'));
    }
  }

  User.init(
    {
      fname: {
        type: DataTypes.STRING,
        allowNull: false, // Set NOT NULL
        defaultValue: '', // Provide a default value if required
      },
      lname: {
        type: DataTypes.STRING,
        allowNull: false, // Set NOT NULL
        defaultValue: '', // Provide a default value if required
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false, // Set NOT NULL
        unique: true, // Ensure emails are unique
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false, // Set NOT NULL
        unique: true, // Ensure phone numbers are unique
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false, // Set NOT NULL
      },
      otp: {
        type: DataTypes.STRING,
        allowNull: true, // Set NOT NULL
      },
      isCustomer: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        validate: {
          isBoolean(value) {
            if (typeof value !== 'boolean') {
              throw new Error('isCustomer must be a boolean value');
            }
          },
        },
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
    }
  );
  return User;
};