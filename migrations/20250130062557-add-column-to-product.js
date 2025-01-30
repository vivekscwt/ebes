'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
      await queryInterface.addColumn('Products', 'UserId', {
        type: Sequelize.INTEGER, // Column type: STRING
        allowNull: true,         // This column can be nullabl // Default value for new rows
      });
  },


  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Products', 'UserId', {   // This column can be nullabl // Default value for new rows
    });
  }
}