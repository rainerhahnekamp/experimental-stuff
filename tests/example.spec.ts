import {expect} from '@playwright/test';
import "@angular/compiler"
import {HttpClient} from '@angular/common/http';
import {HttpTestingController} from '@angular/common/http/testing';
import {test} from './test';
import {ClickComponent} from '../src/app/click.component';
import {TestBed} from '@angular/core/testing';

test.describe('ClickComponent', () => {
  test('should click', async ({page, runInBrowser, renderComponent}) => {
    await renderComponent(ClickComponent, {providers: [HttpClient, HttpTestingController]});

    await page.goto('http://localhost:4200');
    await page.getByRole('button', {name: 'Click me!'}).click();
    await expect(page.getByText('You clicked me')).toBeVisible()
  });

  test('should click and count', async ({page, renderComponent, runInBrowser}) => {
    await runInBrowser(() => TestBed.configureTestingModule({
      imports: [ClickComponent],
    }).createComponent(ClickComponent))

    await page.goto('http://localhost:4200');
    await page.getByRole('button', {name: 'Click me!'}).click();
    await expect(page.getByText('You clicked me')).toBeVisible()
  })
})
