jEngine: $compile [![wercker status](https://app.wercker.com/status/5cf7af073a466325d96ad751d99761c5/s "wercker status")](https://app.wercker.com/project/bykey/5cf7af073a466325d96ad751d99761c5)
=============================
[![Bower version](https://badge.fury.io/bo/jstools-compile.svg)](http://badge.fury.io/bo/jstools-compile)
[![npm version](https://badge.fury.io/js/jstools-compile.svg)](http://badge.fury.io/js/jstools-compile)
[![Build Status](https://travis-ci.org/jstools/compile.svg?branch=master)](https://travis-ci.org/jstools/compile)
Installation
------------
```.sh
npm install jstools-compile --save
```
  or
```.sh
bower install jstools-compile --save
```
Usage
-----
```.js
var data = {
  foo: 'bar',
  crash: {
    test: 'dummy'
  },
  list: ['foo', 'bar', 'foobar'],
  map: {
    hi: 'all',
    bye: 'nobody'
  },
  template: 'sample',
  label: {
    cancel: 'cancel'
  }
};

$compile('$if{ foo === "bar" }gogogo{:}whoops{/}')(data)
// returns 'gogogo'

compile('$each{ item, key in map }[${foo}:${key}:${item}]{/}')(data);
// returns '[bar:hi:all][bar:bye:nobody]'
```
