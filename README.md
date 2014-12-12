# Crashpad

[Express](https://www.npmjs.com/package/express) middleware for [Boom](https://www.npmjs.com/package/boom) errors

[![NPM version](http://img.shields.io/npm/v/crashpad.svg?style=flat-square)](https://www.npmjs.org/package/crashpad)
[![Build Status](http://img.shields.io/travis/goodeggs/crashpad.svg?style=flat-square)](https://travis-ci.org/goodeggs/crashpad)
[![MIT License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/goodeggs/crashpad/blob/master/LICENSE.md)

## Usage

```
npm install crashpad
```

```javascript
var crashpad = require('crashpad');
app.use(crashpad());
```

## Contributing

Please follow our [Code of Conduct](https://github.com/goodeggs/crashpad/blob/master/CODE_OF_CONDUCT.md)
when contributing to this project.

```
$ git clone https://github.com/goodeggs/crashpad && cd crashpad
$ npm install
$ npm test
```
