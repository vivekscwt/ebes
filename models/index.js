const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_SERVER_DATABASE,
    process.env.DB_SERVER_USER,
    process.env.DB_SERVER_PASSWORD,
    {
      host: process.env.DB_SERVER_HOST,
      logging: false,
      dialect: 'mysql',
    }
  );

try {
  sequelize.authenticate();
  console.log('Connection has been established successfully.');
} catch (error) {
  console.error('Unable to connect to the database:', error);
}

const db = {}
db.Sequelize=Sequelize;
db.sequelize=sequelize;

// Import models
db.Product = require('./productModel')(sequelize, DataTypes);
db.User = require('./userModel')(sequelize, DataTypes);

// Define associations
if (db.Product && db.User) {
  db.Product.belongsTo(db.User, { foreignKey: 'productAuthor', as: 'author' });
  db.User.hasMany(db.Product, { foreignKey: 'productAuthor', as: 'products' });
} else {
  console.error('One or more models are not defined properly.');
}

// Sync database
db.sequelize.sync({ alter: true });
//db.sequelize.sync({ force: true });

module.exports = db;