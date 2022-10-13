'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('medical_records', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      patient_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'patients', key: 'id' },
        onDelete: 'RESTRICT',
      },
      doctor_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'doctors', key: 'id' },
        onDelete: 'RESTRICT',
      },
      visit_date: { type: Sequelize.DATEONLY, allowNull: false },
      diagnosis: { type: Sequelize.STRING(255), allowNull: false },
      symptoms: { type: Sequelize.TEXT },
      prescription: { type: Sequelize.TEXT },
      notes: { type: Sequelize.TEXT },
      follow_up_date: { type: Sequelize.DATEONLY },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('medical_records', ['patient_id', 'visit_date']);
    await queryInterface.addIndex('medical_records', ['doctor_id']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('medical_records');
  },
};
