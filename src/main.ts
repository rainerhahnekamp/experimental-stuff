import "zone.js"
import "zone.js/testing"

import {getTestBed, TestBed} from '@angular/core/testing';
import {ClickComponent} from './app/click.component';
import {BrowserDynamicTestingModule, platformBrowserDynamicTesting} from '@angular/platform-browser-dynamic/testing';



getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
const fixture = TestBed.configureTestingModule({imports: [ClickComponent]}).createComponent(ClickComponent);
fixture.autoDetectChanges(true)
