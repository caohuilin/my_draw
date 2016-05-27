var assert = require("chai").assert;
var app = require("../app");
var superagent = require('co-supertest');
const request = require("co-request");

function do_request() {
    return superagent(app.listen());
}

const debug = console.log.bind(console);
const api = do_request();

describe('Routes', function () {
    it('GET /v1', function *() {
        const res = yield api.get('/v1');
        assert.equal(res.text, 'API SERVER');
    });
    it('GET /v1/ping', function *() {
        const res = yield api.get('/v1/ping');
        assert.equal(res.body.code, 200);
    });
});


