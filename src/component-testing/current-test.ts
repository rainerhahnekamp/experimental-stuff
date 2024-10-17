import { HttpClient } from "@angular/common/http";
import { HttpTestingController } from "@angular/common/http/testing";
import { ClickComponent, ClickCounter } from "../app/click.component";
import { TestBed } from "@angular/core/testing";

export const extractedFunctionsMap = {
  17: () => TestBed.inject(ClickCounter).counter,

};

export const renderComponentFunctionsMap = {
  10: [ClickComponent, { providers: [HttpClient, HttpTestingController] }],

};

window['testId'] = 'id_8pmheeao4_1729197506882';
