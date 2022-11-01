import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { LoadState } from '../../../core/models/api.model';

@Component({
  selector: 'app-page-state',
  templateUrl: './page-state.component.html',
  styleUrls: ['./page-state.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageStateComponent {
  @Input() state: LoadState = 'loading';
  @Input() loadingText = 'Loading...';
  @Input() emptyText = 'Nothing to show.';
  @Input() errorText = 'Unable to load data.';
  @Output() retry = new EventEmitter<void>();
}
