'use strict';

var events = require('events');
var fs = require('fs');
var util = require('util');

var EventEmitter = events.EventEmitter;

function Pilgrim(config) {
  ['from', 'to', 'stream'].forEach(function(key) {
    if (!config[key]) throw new Error('Missing `' + key + '` from pilgrim configuration hash');  
  });

  this.minStatusCode = parseInt(config.from);
  this.maxStatusCode = parseInt(config.to);

  // If the stream is a string, we take it to be the path to a file, for
  // which we open a stream

  if (typeof config.stream == 'string') {
    this.stream = fs.createWriteStream(config.stream, { flags : 'a', encoding: 'utf8' });
    this.stream.on('error', this.emitError.bind(this));
  } else {
    this.stream = config.stream;
  }

  this.ignoreMap = {};

  if (config.ignore) {
    if (!util.isArray(config.ignore)) throw new Error('The `ignore` configuration parameter must be an array of numeric values');

    config.ignore.forEach(function(statusCode) {
      statusCode = parseInt(statusCode);

      if (statusCode < this.minStatusCode || statusCode > this.maxStatusCode) {
        throw new Error('Ignore value `' + statusCode + '` falls outside the min/max for this pilgrim');
      }

      this.ignoreMap[statusCode] = 1;
    }, this);
  }

  this.writeable = true;
}

util.inherits(Pilgrim, EventEmitter);

Pilgrim.prototype.write = function (record) {
  if (!this.writeable) return;

  var entry = JSON.parse(record);

  var statusCode = entry.res ? entry.res.statusCode : 0;

  if (statusCode >= this.minStatusCode && statusCode <= this.maxStatusCode && !this.ignoreMap[statusCode]) {
    this.stream.write(record);
  }
};

Pilgrim.prototype.end = function () {
  this.writeable = false;
  this.stream.end();
};

Pilgrim.prototype.destroy = function () {
  this.writable = false;
  this.stream.destroy();
};

Pilgrim.prototype.destroySoon = function () {
  this.writeable = false;
  this.stream.destroySoon();
};

Pilgrim.prototype.emitError = function(err) {
  this.emit('error', err);
}

module.exports = Pilgrim;