# Chevre Domain Library for Node.js

[![npm (scoped)](https://img.shields.io/npm/v/@toei-jp/chevre-domain.svg)](https://www.npmjs.com/package/@toei-jp/chevre-domain)
[![CircleCI](https://circleci.com/gh/toei-jp/chevre-domain.svg?style=svg)](https://circleci.com/gh/toei-jp/chevre-domain)
[![Coverage Status](https://coveralls.io/repos/github/toei-jp/chevre-domain/badge.svg?branch=master)](https://coveralls.io/github/toei-jp/chevre-domain?branch=master)
[![Dependency Status](https://img.shields.io/david/toei-jp/chevre-domain.svg)](https://david-dm.org/toei-jp/chevre-domain)
[![Known Vulnerabilities](https://snyk.io/test/github/toei-jp/chevre-domain/badge.svg?targetFile=package.json)](https://snyk.io/test/github/toei-jp/chevre-domain?targetFile=package.json)
[![npm](https://img.shields.io/npm/dm/@toei-jp/chevre-domain.svg)](https://nodei.co/npm/@toei-jp/chevre-domain/)

Chevre座席予約システムのドメインモデルをNode.jsで使いやすいようにまとめたパッケージです。

## Table of contents

* [Usage](#usage)
* [Code Samples](#code-samples)
* [License](#license)

## Usage

```shell
npm install --save @toei-jp/chevre-domain
```

```Javascript
const chevre = require("@toei-jp/chevre-domain");
```

前提として、mongooseでdefault connectionを確保することと、redis情報をセットすることが必要。

* mongoose default connection

```Javascript
chevre.mongoose.connect();
```

### Environment variables

| Name    | Required | Value           | Purpose |
| ------- | -------- | --------------- | ------- |
| `DEBUG` | false    | chevre-domain:* | Debug   |

## Code Samples

Code sample are [here](https://github.com/toei-jp/chevre-domain/tree/master/example).

## License

ISC
