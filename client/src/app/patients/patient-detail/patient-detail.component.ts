import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { ApiError, LoadState } from '../../core/models/api.model';
import { Patient } from '../../core/models/patient.model';
import { AuthService } from '../../core/services/auth.service';
import { PatientService } from '../../core/services/patient.service';

@Component({
  selector: 'app-patient-detail',
  templateUrl: './patient-detail.component.html',
  styleUrls: ['./patient-detail.component.scss'],
})
export class PatientDetailComponent implements OnInit {
  patientId!: number;
  patient?: Patient;
  state: LoadState = 'loading';
  errorText = 'Unable to load this patient.';
  canEdit = this.auth.hasRole('ADMIN', 'STAFF');
  canViewRecords = this.auth.hasRole('ADMIN', 'DOCTOR');
  selectedTab = 0;

  constructor(
    private route: ActivatedRoute,
    private patientService: PatientService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.patientId = Number(this.route.snapshot.paramMap.get('id'));
    this.selectedTab = this.canViewRecords && this.route.snapshot.fragment === 'records' ? 2 : 0;
    this.load();
  }

  load(): void {
    this.state = 'loading';
    this.patientService.get(this.patientId).subscribe(
      (patient) => {
        this.patient = patient;
        this.state = 'loaded';
      },
      (err: ApiError) => {
        this.errorText = err.status === 404 || err.status === 403 ? err.message : this.errorText;
        this.state = 'error';
      }
    );
  }
}
