'use strict';

const logger = require('koa-logger');
const router = require('koa-router');
const serve = require('koa-static');
const parse = require('co-body');
const app = require('koa')();
const request = require("co-request");
const _ = require('lodash');
const session = require('koa-session');
const crypto = require('crypto');
const co = require('co');
const fs = require('co-fs');
const koaBody = require('koa-body')();
const tcomb = require('tcomb');
const util = require('util');

const debug = console.log.bind(console);


app.keys = ['fsfgfsdgdsfgsdfsb'];
app.use(logger());

app.use(serve(__dirname + '/../../build/public'));
app.use(session(app));

// TODO mock 用户
app.use(function*(next){
  this.session.username = 'chl';
  yield next
});

const api = new router({prefix: '/v1'});

function JsonError(error, message) {
   Error.captureStackTrace(this, error || this);
   this.message = message;
   this.error = error;
}

util.inherits(JsonError, Error);

api.all('*', function*(next){
  try {
    yield* next;
  } catch(e) {
    if (e instanceof JsonError){
      const error = e.error || 'UnknowError';
      const message = e.message || '服务器错误';
      this.body = {
        'error': error,
        'message': message
      };
    }else{
      this.throw(e);
    }
  }
})

api.get('/', function*() {
  this.body = "API SERVER";
});

api.get('/ping', function*() {
  this.body = {'code': 200};
});


app.use(api.routes()).use(api.allowedMethods());

module.exports = Object.assign(app, {});
