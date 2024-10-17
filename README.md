Risk

The approach is to override the test object. If Playwright would introduce certain methods to the test object, they would also be overriden. The main risk at the moment is that one of these methods have to be implemented and not nooped. This would require us to release a new version.

Potentially the test object might become invalid in the browser or cause some compilation error, due to the Angular CLI config.

We think this risk is acceptable, as the test object's methods are all nooped, so no code is executed and the error would be in the typing only. So what the user would have to do is to use an Angular CLI and Playwright which are compatible with each other in terms of TypeScript.
