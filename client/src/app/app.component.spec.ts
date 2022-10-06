import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { AppComponent } from './app.component';

@Component({ template: '' })
class BlankComponent {}

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([
          { path: 'patients', component: BlankComponent, data: { title: 'Patients' } },
        ]),
      ],
      declarations: [AppComponent, BlankComponent],
    }).compileComponents();
  });

  it('sets the document title from route data', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    await TestBed.inject(Router).navigateByUrl('/patients');

    expect(TestBed.inject(Title).getTitle()).toBe('Patients | Healthcare Dashboard');
  });
});
