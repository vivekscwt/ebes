'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('products', 'type', {
      type: Sequelize.ENUM('simple', 'variable'),
      defaultValue: 'simple'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('products', 'type', {
      type: Sequelize.STRING
    });
  }
};