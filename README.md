jEngine: $template [![wercker status](https://app.wercker.com/status/514973e1d34c9367cf40985a577c9c2a/s "wercker status")](https://app.wercker.com/project/bykey/514973e1d34c9367cf40985a577c9c2a)
=============================
[![Bower version](https://badge.fury.io/bo/jengine-template.svg)](http://badge.fury.io/bo/jengine-template)
[![npm version](https://badge.fury.io/js/jengine-template.svg)](http://badge.fury.io/js/jengine-template)
[![Build Status](https://travis-ci.org/jstools/template.svg?branch=master)](https://travis-ci.org/jstools/template)
Installation
------------
```.sh
npm install jengine-template --save
```
  or
```.sh
bower install jengine-template --save
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

$template.compile('$if{ foo === "bar" }gogogo{:}whoops{/}')(data)
// returns 'gogogo'

$template.compile('$each{ item, key in map }[${foo}:${key}:${item}]{/}')(data);
// returns '[bar:hi:all][bar:bye:nobody]'
```
