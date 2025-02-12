'use strict';

const bcryptjs = require('bcryptjs');

async function hashPassword(password) {
  const salt = await bcryptjs.genSalt(10);
  return bcryptjs.hash(password, salt);
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const password = await hashPassword("vivek@scwebtech.com");

    // Check if an admin user already exists
    const adminExists = await queryInterface.rawSelect(
      'Admins',
      {
        where: { email: "vivek@scwebtech.com" },
      },
      ['id']
    );

    if (!adminExists) {
      // Insert the default admin user
      return queryInterface.bulkInsert('Admins', [
        {
          fname: "Vivek",
          lname: "Roy",
          email: "vivek@scwebtech.com",
          phone: "9883204289",
          password: password,
          userType: "admin",
          otp: "",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the default admin user if needed
    return queryInterface.bulkDelete('Admins', {
      email: "vivek@scwebtech.com",
    });
  },
};
