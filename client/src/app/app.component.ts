import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';

const APP_NAME = 'Healthcare Dashboard';

@Component({
  selector: 'app-root',
  template: '<router-outlet></router-outlet>',
})
export class AppComponent implements OnInit, OnDestroy {
  private subscription?: Subscription;

  constructor(private router: Router, private route: ActivatedRoute, private title: Title) {}

  ngOnInit(): void {
    this.subscription = this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {
          let child = this.route.firstChild;
          let pageTitle: string | undefined;
          while (child) {
            pageTitle = child.snapshot.data.title || pageTitle;
            child = child.firstChild;
          }
          return pageTitle;
        })
      )
      .subscribe((pageTitle) => {
        this.title.setTitle(pageTitle ? `${pageTitle} | ${APP_NAME}` : APP_NAME);
      });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
