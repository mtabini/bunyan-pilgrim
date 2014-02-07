'use strict';

var util = require('util');

var Stream = require('stream');

var MemoryStream = function MemoryStream (argument) {
  this.reset();
  Stream.Writable.call(this);
}

util.inherits(MemoryStream, Stream.Writable);

MemoryStream.prototype._write = function writeToMemory(chunk, encoding, cb) {
  this.bufferedData.push(chunk.toString('utf8'));
}

MemoryStream.prototype.reset = function clearMemoryStream() {
  this.bufferedData = [];
}

module.exports = MemoryStream;