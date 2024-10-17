import {TestModuleMetadata} from '@angular/core/testing';

export const extractedFunctionsMap: Record<number, () => void> = {};

export const renderComponentFunctionsMap: Record<number, [new () => unknown, TestModuleMetadata]> = {};

window.testId = 'id';
