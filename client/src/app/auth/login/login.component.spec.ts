import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { SharedModule } from '../../shared/shared.module';
import { makeUser } from '../../testing/test-data';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let auth: jasmine.SpyObj<AuthService>;
  let router: Router;
  let queryParams: Record<string, string>;

  beforeEach(async () => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'isLoggedIn']);
    auth.isLoggedIn.and.returnValue(false);
    queryParams = {};

    await TestBed.configureTestingModule({
      imports: [SharedModule, NoopAnimationsModule, RouterTestingModule],
      declarations: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: auth },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              get queryParamMap() {
                return convertToParamMap(queryParams);
              },
            },
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl');
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function fill(email: string, password: string): void {
    component.form.setValue({ email, password });
  }

  function submit(): void {
    fixture.debugElement.query(By.css('form')).triggerEventHandler('ngSubmit', null);
    fixture.detectChanges();
  }

  it('renders labelled email and password fields', () => {
    const labels = fixture.debugElement
      .queryAll(By.css('mat-label'))
      .map((l) => l.nativeElement.textContent);
    expect(labels).toEqual(['Email', 'Password']);
  });

  it('shows validation errors and does not call the API for an invalid form', () => {
    fill('not-an-email', '');
    submit();

    const errors = fixture.debugElement
      .queryAll(By.css('mat-error'))
      .map((e) => e.nativeElement.textContent.trim());
    expect(errors).toContain('Enter a valid email');
    expect(errors).toContain('Password is required');
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('signs in and navigates to the return url', () => {
    queryParams = { returnUrl: '/patients' };
    auth.login.and.returnValue(of(makeUser()));
    fill('admin@example.com', 'Password123!');

    submit();

    expect(auth.login).toHaveBeenCalledWith('admin@example.com', 'Password123!');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/patients');
  });

  it('shows the API error message when sign in fails', () => {
    auth.login.and.returnValue(throwError({ status: 401, message: 'Invalid email or password' }));
    fill('admin@example.com', 'wrong-password1');

    submit();

    const alert = fixture.debugElement.query(By.css('[role="alert"]'));
    expect(alert.nativeElement.textContent).toContain('Invalid email or password');
    expect(component.submitting).toBeFalse();
  });

  it('disables the submit button while signing in', () => {
    component.submitting = true;
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('button[type="submit"]'));
    expect(button.nativeElement.disabled).toBeTrue();
    expect(button.nativeElement.textContent).toContain('Signing in...');
  });
});
