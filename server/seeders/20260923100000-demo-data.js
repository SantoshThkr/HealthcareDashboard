'use strict';

const bcrypt = require('bcrypt');

const DEMO_PASSWORD = 'Password123!';

function formatDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function daysFromToday(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

module.exports = {
  up: async (queryInterface) => {
    const now = new Date();
    const timestamps = { created_at: now, updated_at: now };
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

    const users = await queryInterface.bulkInsert(
      'users',
      [
        ['Morgan', 'Reyes', 'admin@example.com', 'ADMIN'],
        ['Sarah', 'Smith', 'doctor@example.com', 'DOCTOR'],
        ['James', 'Patel', 'doctor2@example.com', 'DOCTOR'],
        ['Emily', 'Clark', 'staff@example.com', 'STAFF'],
        ['Daniel', 'Brooks', 'staff2@example.com', 'STAFF'],
      ].map(([first_name, last_name, email, role]) => ({
        first_name,
        last_name,
        email,
        role,
        password_hash: passwordHash,
        is_active: true,
        ...timestamps,
      })),
      { returning: true }
    );
    const userId = (email) => users.find((user) => user.email === email).id;

    const doctors = await queryInterface.bulkInsert(
      'doctors',
      [
        {
          user_id: userId('doctor@example.com'),
          first_name: 'Sarah',
          last_name: 'Smith',
          email: 'sarah.smith@example.com',
          phone: '555-0100',
          specialization: 'Cardiology',
          department: 'Cardiology',
          license_number: 'DEMO-10001',
          availability: 'Mon-Fri, 09:00-17:00',
          status: 'ACTIVE',
        },
        {
          user_id: userId('doctor2@example.com'),
          first_name: 'James',
          last_name: 'Patel',
          email: 'james.patel@example.com',
          phone: '555-0101',
          specialization: 'Family Medicine',
          department: 'General Medicine',
          license_number: 'DEMO-10002',
          availability: 'Mon-Thu, 08:00-16:00',
          status: 'ACTIVE',
        },
        {
          user_id: null,
          first_name: 'Linda',
          last_name: 'Nguyen',
          email: 'linda.nguyen@example.com',
          phone: '555-0102',
          specialization: 'Pediatrics',
          department: 'Pediatrics',
          license_number: 'DEMO-10003',
          availability: 'Tue-Sat, 10:00-18:00',
          status: 'ON_LEAVE',
        },
      ].map((doctor) => ({ ...doctor, ...timestamps })),
      { returning: true }
    );
    const [smith, patel, nguyen] = doctors.map((doctor) => doctor.id);

    const patients = await queryInterface.bulkInsert(
      'patients',
      [
        ['John', 'Doe', '1984-03-12', 'MALE', smith],
        ['Jane', 'Roe', '1990-07-25', 'FEMALE', smith],
        ['Robert', 'Miles', '1958-11-02', 'MALE', smith],
        ['Olivia', 'Grant', '2012-01-19', 'FEMALE', nguyen],
        ['Liam', 'Turner', '1976-05-30', 'MALE', patel],
        ['Sophia', 'Bennett', '1995-09-14', 'FEMALE', patel],
        ['Noah', 'Foster', '1969-12-08', 'MALE', patel],
        ['Ava', 'Hughes', '2001-04-22', 'FEMALE', smith],
        ['Ethan', 'Price', '1988-08-03', 'MALE', null],
        ['Mia', 'Coleman', '1972-02-27', 'FEMALE', patel],
      ].map(([first_name, last_name, date_of_birth, gender, doctor_id], index) => ({
        first_name,
        last_name,
        date_of_birth,
        gender,
        doctor_id,
        phone: `555-02${String(index).padStart(2, '0')}`,
        email: `${first_name}.${last_name}@example.com`.toLowerCase(),
        address: `${100 + index * 7} Demo Street, Springfield`,
        emergency_contact_name: 'Demo Contact',
        emergency_contact_phone: `555-03${String(index).padStart(2, '0')}`,
        status: index === 8 ? 'INACTIVE' : 'ACTIVE',
        ...timestamps,
      })),
      { returning: true }
    );
    const patientId = (index) => patients[index].id;

    const appointments = await queryInterface.bulkInsert(
      'appointments',
      [
        [0, smith, 0, '09:00', 'Blood pressure follow-up', 'CONFIRMED'],
        [1, smith, 0, '10:30', 'Chest discomfort review', 'SCHEDULED'],
        [4, patel, 0, '11:00', 'Annual check-up', 'COMPLETED'],
        [5, patel, 0, '14:00', 'Persistent cough', 'SCHEDULED'],
        [2, smith, 1, '09:30', 'ECG results discussion', 'SCHEDULED'],
        [6, patel, 2, '13:00', 'Diabetes management', 'CONFIRMED'],
        [7, smith, 3, '15:00', 'Palpitations', 'SCHEDULED'],
        [9, patel, 5, '10:00', 'Medication review', 'SCHEDULED'],
        [0, smith, -14, '09:00', 'Initial consultation', 'COMPLETED'],
        [3, nguyen, -10, '11:30', 'Vaccination', 'COMPLETED'],
        [8, patel, -7, '16:00', 'Back pain', 'CANCELLED'],
        [5, patel, -3, '08:30', 'Flu symptoms', 'COMPLETED'],
      ].map(([patient, doctor_id, offset, time, reason, status]) => ({
        patient_id: patientId(patient),
        doctor_id,
        date: daysFromToday(offset),
        time,
        reason,
        status,
        notes: null,
        ...timestamps,
      })),
      { returning: true }
    );

    const records = await queryInterface.bulkInsert(
      'medical_records',
      [
        {
          patient_id: patientId(0),
          doctor_id: smith,
          visit_date: daysFromToday(-14),
          diagnosis: 'Demo: elevated blood pressure',
          symptoms: 'Occasional headaches',
          prescription: 'Demo prescription A',
          notes: 'Lifestyle changes discussed.',
          follow_up_date: daysFromToday(0),
        },
        {
          patient_id: patientId(3),
          doctor_id: nguyen,
          visit_date: daysFromToday(-10),
          diagnosis: 'Demo: routine immunisation',
          symptoms: null,
          prescription: null,
          notes: 'No adverse reaction observed.',
          follow_up_date: null,
        },
        {
          patient_id: patientId(4),
          doctor_id: patel,
          visit_date: daysFromToday(0),
          diagnosis: 'Demo: annual physical, no findings',
          symptoms: null,
          prescription: null,
          notes: 'Next check-up in 12 months.',
          follow_up_date: null,
        },
        {
          patient_id: patientId(5),
          doctor_id: patel,
          visit_date: daysFromToday(-3),
          diagnosis: 'Demo: seasonal influenza',
          symptoms: 'Fever, cough, fatigue',
          prescription: 'Demo prescription B',
          notes: 'Rest and fluids.',
          follow_up_date: daysFromToday(0),
        },
      ].map((record) => ({ ...record, ...timestamps })),
      { returning: true }
    );

    await queryInterface.bulkInsert(
      'audit_logs',
      [
        [userId('staff@example.com'), 'CREATE_PATIENT', 'Patient', patientId(9), 72],
        [userId('staff@example.com'), 'CREATE_APPOINTMENT', 'Appointment', appointments[0].id, 48],
        [userId('doctor2@example.com'), 'CREATE_MEDICAL_RECORD', 'MedicalRecord', records[3].id, 30],
        [userId('staff2@example.com'), 'UPDATE_PATIENT', 'Patient', patientId(2), 20],
        [userId('staff2@example.com'), 'CANCEL_APPOINTMENT', 'Appointment', appointments[10].id, 10],
        [userId('doctor2@example.com'), 'UPDATE_APPOINTMENT', 'Appointment', appointments[2].id, 2],
      ].map(([user_id, action, entity, entity_id, age]) => ({
        user_id,
        action,
        entity,
        entity_id,
        created_at: hoursAgo(age),
      }))
    );
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('audit_logs', null, {});
    await queryInterface.bulkDelete('medical_records', null, {});
    await queryInterface.bulkDelete('appointments', null, {});
    await queryInterface.bulkDelete('patients', null, {});
    await queryInterface.bulkDelete('doctors', null, {});
    await queryInterface.bulkDelete('users', null, {});
  },
};
