import { HttpClient } from "@angular/common/http";
import { HttpTestingController } from "@angular/common/http/testing";
import { ClickComponent, ClickCounter } from "../app/click.component";
import { TestBed } from "@angular/core/testing";

export const extractedFunctionsMap = {
  18: () => {
    const a = 1;
    var b = 2;
    console.log(a + b);
},

  24: () => TestBed.inject(ClickCounter).counter,

};

export const renderComponentFunctionsMap = {
  10: [ClickComponent, { providers: [HttpClient, HttpTestingController] }],

};

window['testId'] = 'id_tsoheqmfi_1729453672582';
