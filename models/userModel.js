module.exports = (sequelize, DataTypes) => {
    
const User = sequelize.define(
  'User',
  {
    // Model attributes are defined here
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    fname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lname: {
      type: DataTypes.STRING,
      // allowNull defaults to true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isCustomer: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
  },
  {
    
  },
);

return User; // Return the User model
}