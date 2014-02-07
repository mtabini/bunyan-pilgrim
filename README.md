bunyan-pilgrim
==============

Pilgrim is a logging stream for [trentm](https://github.com/trentm)'s [node-bunyan](https://github.com/trentm/node-bunyan) module designed to work in conjunction with [mcavage](https://github.com/mcavage)'s [node-restify](https://github.com/mcavage/node-restify) server.

It allows you to direct a specific range of status codes to individual log files. For example, you can easily separate all client errors (4xx) from server errors (5xx) and successful requests (2xx) into a separate file for each category.

You can also ignore specific error codes, giving you greater control over your logging operations.

## Installation

```javascript
npm install bunyan-pilgrim
```

## Usage

```javascript

var bunyan = require('bunyan');
var Pilgrim = require('bunyan-pilgrim');

var logger = bunyan.createLogger({
  name: 'Pilgrim Test',
  streams: [
    {
      level: 'info',
      stream: new Pilgrim({
        from: 400,
        to: 499,
        stream: '/var/log/app-client-errors.log',
        ignore: [401]
      })
    },
    {
      level: 'info',
      stream: new Pilgrim({
        from: 500,
        to: 599,
        stream: '/var/log/app-server-errors.log'
      })
    }
  ]
});

server = restify.createServer({
  log: logger,
});
```

## Configuration

Each Pilgrim is configured with a hash that includes the following:

- `from`: the first status code that must be captured in this log
- `to`: the last status code that msut be captured in this log
- `stream`: either a string containing the path of the log file, or an instance of [Stream.Writable](http://nodejs.org/api/stream.html#stream_class_stream_writable).
- `ignore`: an optional array of status codes that fall between `from` and `to` but should be ignored anyway.

## Contributing

Contributions are welcome… particularly if accompanied by a unit test.

