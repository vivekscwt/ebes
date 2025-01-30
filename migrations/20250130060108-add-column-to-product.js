'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Products', 'status', {
      type: Sequelize.STRING, // Column type: STRING
      allowNull: true,         // This column can be nullable
      defaultValue: 'active',  // Default value for new rows
    });

  },

  async down(queryInterface, Sequelize) {
    // Remove the columns in case of rollback
    await queryInterface.removeColumn('Products', 'status');
    await queryInterface.removeColumn('Products', 'productCategory');
    await queryInterface.removeColumn('Products', 'stockQuantity');
    // Remove other columns if any...
  }
};
