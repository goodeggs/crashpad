# Crashpad

[Express](https://www.npmjs.com/package/express) middleware for [Boom][boom] errors

[![NPM version](http://img.shields.io/npm/v/crashpad.svg?style=flat-square)](https://www.npmjs.org/package/crashpad)
[![Build Status](http://img.shields.io/travis/goodeggs/crashpad.svg?style=flat-square)](https://travis-ci.org/goodeggs/crashpad)
[![MIT License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/goodeggs/crashpad/blob/master/LICENSE.md)

## Usage

Install this middleware and stop explicitly responding with errors from your
application code!

```
npm install crashpad
```

```javascript
var crashpad = require('crashpad');
var Boom = require('boom');

app.get('/error', function(req, res, next) {
  throw Boom.expectationFailed();
});

app.use(crashpad());
```

Crashpad will handle:

- Errors created by the Boom module. ([See Boom documentation for a list of
  these][boom].)
- Error objects that have an integer "status" or "statusCode" attribute.
- Generic error objects (will respond with 500).

Right now Crashpad just sends back JSON payloads. Eventually, we'll have support
for fancy rendered error pages! If you need something like that now, check out
[express-error-handler](https://github.com/ericelliott/express-error-handler).


## Contributing

Please follow our [Code of Conduct](https://github.com/goodeggs/crashpad/blob/master/CODE_OF_CONDUCT.md)
when contributing to this project.

```
$ git clone https://github.com/goodeggs/crashpad && cd crashpad
$ yarn install
$ yarn test
```

[@hapi/boom]: https://www.npmjs.com/package/@hapi/boom

## Releasing

To release a new version of this module, use yarn to bump the version
in `package.json` and create a git tag, then push. This will automatically
get published to the NPM registry via CI.

```sh
yarn version --new-version=<major|minor|patch|premajor|preminor|prepatch>
git push --follow-tags
```
