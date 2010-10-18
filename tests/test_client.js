// :(
require.paths.unshift(__dirname +"/minitest");
require.paths.unshift(__dirname +"/../lib");

// we test that
var Client = require('spore').Client;

var minitest = require("minitest");
var assert   = require("assert");

minitest.setupListeners();

minitest.context("Create client with filename", function () {
    this.setup(function () {
        this.client = new Client(__dirname +'/fixtures/test.json');
    });

    this.assertion("client should have a public_timeline method", function (test) {
        assert.ok(this.client.public_timeline,
                  "clientWithFile should have a public_timeline method");
        test.finished();
  });
});

minitest.context('Create client with json object', function() {
    this.setup(function() {
        this.client = new Client({
            "base_url" : "http://api.twitter.com/1",
            "version" : "0.1",
            "methods" : {
                "public_timeline" : {
                    "optional_params" : [
                        "trim_user",
                        "include_entities"
                    ],
                    "required_params" : [
                        "format"
                    ],
                    "path" : "/statuses/public_timeline.:format",
                    "method" : "GET"
                },
            }
        });
    });

    this.assertion("client should have a public_timeline method", function(test) {

        assert.ok(this.client.public_timeline,
                  "client should have a public_timeline method");
        test.finished();
    });

    this.assertion("err if a required parameter is missing", function(test) {
        this.client.public_timeline({}, function(err, result) {
            assert.equal(result, null, 'result should be null');
            assert.equal(err, 'format param is required');
            test.finished();
        });
    });

    this.assertion("err if unknow param ", function(test) {
        this.client.public_timeline({format: 'json', unknowparam: 'foo'}, function(err, result) {
            assert.equal(result, null, 'result should be null');
            assert.equal(err, 'unknowparam param is unknow'); // very funny
            test.finished();
        });
    });

    this.assertion("call remote server", function(test) {
        this.client.httpClient = {
            createClient: function(port, host) {
                assert.equal(port, 80);
                assert.equal(host, 'api.twitter.com');
                return {
                    request: function(method, path, headers) {
                        assert.equal(method, 'GET');
                        assert.equal(path, '/statuses/public_timeline.json');
                        assert.equal(headers.host, 'api.twitter.com');
                        return {
                            _events: {},
                            on: function(name, callback) {
                                this._events[name] = callback;
                            },
                            end: function() {
                                var that = this;
                                setTimeout(function() {
                                    that._events.response({
                                         _events: {},
                                        on: function(name, callback){
                                            this._events[name] = callback;
                                            if (name == 'end')
                                            {
                                                var that = this;
                                                setTimeout(function() {
                                                    that._events.data('[{"place":null,');
                                                    that._events.data('"text": "node-spore is awesome"}, {}]');
                                                    that._events.end();
                                                }, 100);
                                            }
                                        }
                                    });
                                }, 1000);
                            }
                        };
                    }
                };
            }
        };
        this.client.public_timeline({format: 'json'}, function(err, result) {
            assert.equal(err, null, "err should be null");
            assert.equal('[{"place":null,"text": "node-spore is awesome"}, {}]' , result);
            test.finished();
        });
    });

    this.assertion("call with other parameter ", function(test) {
        this.client.httpClient = {
            createClient: function(port, host) {
                return {
                    request: function(method, path, headers) {
                        assert.equal(path, '/statuses/public_timeline.html?trim_user=1&include_entities=1');
                        return {
                            on: function() {},
                            end: function() {
                                test.finished();
                            }
                        };
                    }
                };
            }
        };
        this.client.public_timeline({format: 'html', 'trim_user': 1, 'include_entities': 1}, function(err, result) {});
    });
});
