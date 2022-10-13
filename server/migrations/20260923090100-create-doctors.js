'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('doctors', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: {
        type: Sequelize.INTEGER,
        unique: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      first_name: { type: Sequelize.STRING(50), allowNull: false },
      last_name: { type: Sequelize.STRING(50), allowNull: false },
      email: { type: Sequelize.STRING(120), allowNull: false, unique: true },
      phone: { type: Sequelize.STRING(20), allowNull: false },
      specialization: { type: Sequelize.STRING(80), allowNull: false },
      department: { type: Sequelize.STRING(80), allowNull: false },
      license_number: { type: Sequelize.STRING(30), allowNull: false, unique: true },
      availability: { type: Sequelize.STRING(120) },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'ON_LEAVE', 'INACTIVE'),
        allowNull: false,
        defaultValue: 'ACTIVE',
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('doctors', ['last_name']);
    await queryInterface.addIndex('doctors', ['department']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('doctors');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_doctors_status"');
  },
};
