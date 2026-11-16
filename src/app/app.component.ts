import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CraFormComponent } from './components/cra-form/cra-form.component';

@Component({
  selector: 'app-root',
  template: '<app-cra-form />',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CraFormComponent]
})
export class AppComponent { }
