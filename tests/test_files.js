'use strict';

var async = require('async');
var bunyan = require('bunyan');
var expect = require('chai').expect;
var fs = require('fs');
var request = require('request');
var restify = require('restify');
var tmp = require('tmp');

var Pilgrim = require('../lib');

var MemoryStream = require('./fixtures/memorystream');

var baseUrl;
var server;

var clientErrorLogPath;
var serverErrorLogPath;

describe('The Pilgrim log stream', function() {

  before(function(done) {
    tmp.setGracefulCleanup();

    async.parallel(
      {
        clientErrorStream: tmp.file,
        serverErrorStream: tmp.file
      },

      function(err, streams) {
        clientErrorLogPath = streams.clientErrorStream[0];
        serverErrorLogPath = streams.serverErrorStream[0];

        var logger = bunyan.createLogger({
          name: 'Pilgrim Test',
          streams: [
            {
              level: 'info',
              stream: new Pilgrim({
                from: 400,
                to: 499,
                stream: streams.clientErrorStream[0],
                ignore: [401]
              })
            },
            {
              level: 'info',
              stream: new Pilgrim({
                from: 500,
                to: 599,
                stream: streams.serverErrorStream[0]
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
      }
    )
  });

  it('should properly save to file', function(done) {
    request(baseUrl + '404', function(err, res, body) {
      expect(err).to.be.null;
      expect(res.statusCode).to.equal(404);

      var streamData = fs.readFileSync(clientErrorLogPath).toString();

      streamData = JSON.parse(streamData);

      expect(streamData).to.be.an('object');
      expect(streamData).to.include.key('res');
      expect(streamData.res).to.be.an('object');
      expect(streamData.res).to.include.key('statusCode');
      expect(streamData.res.statusCode).to.equal(404);

      streamData = fs.readFileSync(serverErrorLogPath).toString();

      expect(streamData).to.have.length(0);

      done();
    });
  });

  after(function(done) {
    server.close(done);
  });

});