'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('ProductCategories', 'categoryImage', {
      type: Sequelize.STRING,
      allowNull: true, // Adjust if you want this to be non-nullable
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('ProductCategories', 'categoryImage');
  }
};
