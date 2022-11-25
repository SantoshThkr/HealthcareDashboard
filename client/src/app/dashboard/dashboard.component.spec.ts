import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { DashboardService } from '../core/services/dashboard.service';
import { SharedModule } from '../shared/shared.module';
import { makeSummary } from '../testing/test-data';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let dashboardService: jasmine.SpyObj<DashboardService>;

  beforeEach(async () => {
    dashboardService = jasmine.createSpyObj<DashboardService>('DashboardService', [
      'getSummary',
      'getRecentActivity',
    ]);
    dashboardService.getRecentActivity.and.returnValue(
      of([
        {
          id: 1,
          action: 'CREATE_PATIENT',
          entity: 'Patient',
          entityId: 3,
          createdAt: '2021-09-14T10:00:00.000Z',
          description: 'Emily Clark registered a new patient',
        },
      ])
    );

    await TestBed.configureTestingModule({
      imports: [SharedModule, NoopAnimationsModule, RouterTestingModule],
      declarations: [DashboardComponent],
      providers: [{ provide: DashboardService, useValue: dashboardService }],
    }).compileComponents();
  });

  function create(): void {
    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
  }

  it('shows the statistic cards', () => {
    dashboardService.getSummary.and.returnValue(of(makeSummary()));
    create();

    const cards = fixture.debugElement
      .queryAll(By.css('.stat'))
      .map((c) => c.nativeElement.textContent);
    expect(cards.length).toBe(5);
    expect(cards[0]).toContain('10');
    expect(cards[0]).toContain('Total Patients');
    expect(cards[4]).toContain('Completed Appointments');
  });

  it("lists today's appointments and recent activity", () => {
    dashboardService.getSummary.and.returnValue(of(makeSummary()));
    create();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('John Doe');
    expect(text).toContain('Emily Clark registered a new patient');
    expect(text).toContain('No upcoming appointments.');
  });

  it('shows an error state and retries', () => {
    dashboardService.getSummary.and.returnValue(throwError({ status: 500, message: 'boom' }));
    create();

    expect(fixture.nativeElement.textContent).toContain('Unable to load the dashboard.');

    dashboardService.getSummary.and.returnValue(of(makeSummary()));
    fixture.debugElement.query(By.css('app-page-state button')).nativeElement.click();
    fixture.detectChanges();

    expect(fixture.debugElement.queryAll(By.css('.stat')).length).toBe(5);
  });
});
