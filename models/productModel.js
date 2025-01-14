module.exports = (sequelize, DataTypes) => {

const Product = sequelize.define(
  'Product',
  {
    // Model attributes are defined here
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    excerpt: {
      type: DataTypes.TEXT('long'),
    },
    content: {
      type: DataTypes.TEXT('long'),
    },
    priceRegular: {
      type: DataTypes.FLOAT, // Use FLOAT for numeric prices
      allowNull: false,
    },
    priceOffer: {
      type: DataTypes.FLOAT,
      allowNull: true, // Allow null for products without offers
    },
    isPublic: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    productAuthor: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    
  },
);

return Product; // Return the Product model
}