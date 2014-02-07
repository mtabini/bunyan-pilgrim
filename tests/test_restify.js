'use strict';

// var async = require('async');
var bunyan = require('bunyan');
var expect = require('chai').expect;
var request = require('request');
var restify = require('restify');

var Pilgrim = require('../lib');

var MemoryStream = require('./fixtures/memorystream');

var baseUrl;
var server;

var clientErrorStream;
var serverErrorStream;

describe('The Pilgrim log stream', function() {
  clientErrorStream = new MemoryStream();
  serverErrorStream = new MemoryStream();

  before(function(done) {
    var logger = bunyan.createLogger({
      name: 'Pilgrim Test',
      streams: [
        {
          level: 'info',
          stream: new Pilgrim({
            from: 400,
            to: 499,
            stream: clientErrorStream,
            ignore: [401]
          })
        },
        {
          level: 'info',
          stream: new Pilgrim({
            from: 500,
            to: 599,
            stream: serverErrorStream
          })
        }
      ]
    });

    server = restify.createServer({
      log: logger,
    });

    server.get('/:statusCode', function(req, res, next) {
      res.send(parseInt(req.params.statusCode));
      next();
    });

    server.on('after', restify.auditLogger({ log : logger , body : false }));

    server.listen(0, function() {
      logger.info('Server listening on %s', server.url);

      var address = server.address();

      baseUrl = 'http://' + address.address + ':' + address.port + '/';

      done();
    });
  });

  it('should compartmentalize logs by status code (1)', function(done) {
    clientErrorStream.reset();
    serverErrorStream.reset();

    request(baseUrl + '404', function(err, res, body) {
      expect(err).to.be.null;
      expect(res.statusCode).to.equal(404);

      expect(clientErrorStream.bufferedData).to.have.length(1);
      expect(serverErrorStream.bufferedData).to.have.length(0);

      done();
    });
  });

  it('should compartmentalize logs by status code (2)', function(done) {
    clientErrorStream.reset();
    serverErrorStream.reset();

    request(baseUrl + '500', function(err, res, body) {
      expect(err).to.be.null;
      expect(res.statusCode).to.equal(500);

      expect(clientErrorStream.bufferedData).to.have.length(0);
      expect(serverErrorStream.bufferedData).to.have.length(1);

      done();
    });
  });

  it('should ignore logs that fall outside the status codes specified in the config', function(done) {
    clientErrorStream.reset();
    serverErrorStream.reset();

    request(baseUrl + '200', function(err, res, body) {
      expect(err).to.be.null;
      expect(res.statusCode).to.equal(200);

      expect(clientErrorStream.bufferedData).to.have.length(0);
      expect(serverErrorStream.bufferedData).to.have.length(0);

      done();
    });
  });

  it('should allow specific status codes, even if they fall within the codes specified in the config', function(done) {
    clientErrorStream.reset();
    serverErrorStream.reset();

    request(baseUrl + '401', function(err, res, body) {
      expect(err).to.be.null;
      expect(res.statusCode).to.equal(401);

      expect(clientErrorStream.bufferedData).to.have.length(0);
      expect(serverErrorStream.bufferedData).to.have.length(0);

      done();
    });
  });

  after(function(done) {
    server.close(done);
  });

});