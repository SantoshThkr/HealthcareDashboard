'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('patients', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      first_name: { type: Sequelize.STRING(50), allowNull: false },
      last_name: { type: Sequelize.STRING(50), allowNull: false },
      date_of_birth: { type: Sequelize.DATEONLY, allowNull: false },
      gender: { type: Sequelize.ENUM('MALE', 'FEMALE', 'OTHER'), allowNull: false },
      phone: { type: Sequelize.STRING(20), allowNull: false },
      email: { type: Sequelize.STRING(120) },
      address: { type: Sequelize.STRING(255) },
      emergency_contact_name: { type: Sequelize.STRING(100) },
      emergency_contact_phone: { type: Sequelize.STRING(20) },
      doctor_id: {
        type: Sequelize.INTEGER,
        references: { model: 'doctors', key: 'id' },
        onDelete: 'SET NULL',
      },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'INACTIVE'),
        allowNull: false,
        defaultValue: 'ACTIVE',
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('patients', ['last_name', 'first_name']);
    await queryInterface.addIndex('patients', ['doctor_id']);
    await queryInterface.addIndex('patients', ['status']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('patients');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_patients_gender"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_patients_status"');
  },
};
