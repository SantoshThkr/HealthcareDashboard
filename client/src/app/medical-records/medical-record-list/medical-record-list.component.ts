import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { merge, of, Subject } from 'rxjs';
import { catchError, debounceTime, startWith, switchMap, takeUntil, tap } from 'rxjs/operators';

import { LoadState } from '../../core/models/api.model';
import { MedicalRecord } from '../../core/models/medical-record.model';
import { AuthService } from '../../core/services/auth.service';
import { MedicalRecordService } from '../../core/services/medical-record.service';

@Component({
  selector: 'app-medical-record-list',
  templateUrl: './medical-record-list.component.html',
})
export class MedicalRecordListComponent implements AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  columns = ['visitDate', 'patient', 'diagnosis', 'doctor', 'followUpDate', 'actions'];
  isDoctor = this.auth.hasRole('DOCTOR');
  doctorId = this.auth.currentUser?.doctorProfile?.id;
  records: MedicalRecord[] = [];
  total = 0;
  state: LoadState = 'loading';

  filters = this.fb.group({ search: [''] });

  private reload$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private recordService: MedicalRecordService,
    private auth: AuthService
  ) {}

  ngAfterViewInit(): void {
    const filterChanges = this.filters.valueChanges.pipe(
      debounceTime(300),
      tap(() => (this.paginator.pageIndex = 0))
    );

    merge(filterChanges, this.paginator.page, this.reload$)
      .pipe(
        startWith(null),
        tap(() => (this.state = 'loading')),
        switchMap(() =>
          this.recordService
            .list({
              ...this.filters.value,
              page: this.paginator.pageIndex + 1,
              pageSize: this.paginator.pageSize,
            })
            .pipe(catchError(() => of(null)))
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((page) => {
        if (!page) {
          this.state = 'error';
          return;
        }
        this.records = page.items;
        this.total = page.total;
        this.state = page.items.length ? 'loaded' : 'empty';
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  reload(): void {
    this.reload$.next();
  }
}
