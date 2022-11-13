import { Component, Input, OnInit } from '@angular/core';

import { LoadState } from '../../core/models/api.model';
import { MedicalRecord } from '../../core/models/medical-record.model';
import { AuthService } from '../../core/services/auth.service';
import { MedicalRecordService } from '../../core/services/medical-record.service';

@Component({
  selector: 'app-patient-records',
  templateUrl: './patient-records.component.html',
  styleUrls: ['./patient-records.component.scss'],
})
export class PatientRecordsComponent implements OnInit {
  @Input() patientId!: number;

  records: MedicalRecord[] = [];
  state: LoadState = 'loading';
  isDoctor = this.auth.hasRole('DOCTOR');
  doctorId = this.auth.currentUser?.doctorProfile?.id;

  constructor(private recordService: MedicalRecordService, private auth: AuthService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.state = 'loading';
    this.recordService.listForPatient(this.patientId).subscribe(
      (records) => {
        this.records = records;
        this.state = records.length ? 'loaded' : 'empty';
      },
      () => (this.state = 'error')
    );
  }
}
