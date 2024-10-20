import { expect } from '@playwright/test';
import "@angular/compiler"
import { HttpClient } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { test } from './test';
import { ClickComponent, ClickCounter } from '../src/app/click.component';
import { TestBed } from '@angular/core/testing';

test.describe('ClickComponent', () => {
  test('should click', async ({ page, runInBrowser, renderComponent }) => {
    await renderComponent(ClickComponent, { providers: [HttpClient, HttpTestingController] });

    await page.getByRole('button').click();
    await expect(page.getByText('You clicked me!')).toBeVisible()

    await page.getByRole('button').click();
    await page.getByRole('button').click();

    await runInBrowser(() => {
      const a = 1
      var b = 2
      console.log(a + b)
    })

    const counter = await runInBrowser(() => TestBed.inject(ClickCounter).counter)

    expect(counter).toBe(3)

  });
})
