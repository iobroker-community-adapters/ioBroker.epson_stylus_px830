var expect = require('chai').expect;
var setup  = require(__dirname + '/lib/setup');
var fs     = require('fs');
var objects     = null;
var states      = null;
var connected   = false;

describe('epson_stylus_px830: test adapter', function() {
    before('epson_stylus_px830: Start js-controller', function (_done) {
        this.timeout(600000); // because of first install from npm

        setup.setupController(function () {
            var config = setup.getAdapterConfig();
            // enable adapter
            config.common.enabled  = true;
            config.common.loglevel = 'debug';

            setup.setAdapterConfig(config.common, config.native);

            setup.startController(function (_objects, _states) {
                objects = _objects;
                states  = _states;
                _done();
            });
        });
    });

    it('epson_stylus_px830: wait', function (done) {
        this.timeout(5000);
        setTimeout(function () {
            done();
        }, 3000);
    });

    it('epson_stylus_px830: feeds to be parsed', function (done) {
        this.timeout(20000);
        states.getState('epson_stylus_px830.0.ip', function (err, fileName) {
            expect(err).to.be.not.ok;
            expect(fileName).to.be.ok;
            expect(fileName.ack).to.be.true;
            states.getState('epson_stylus_px830.0.inks.black.level', function (err, fileName) {
                expect(err).to.be.not.ok;
                expect(fileName).to.be.ok;
                expect(fileName.ack).to.be.true;
                states.getState('epson_stylus_px830.0.inks.cyan.cartridge', function (err, fileName) {
                    expect(err).to.be.not.ok;
                    expect(fileName).to.be.ok;
                    expect(fileName.ack).to.be.true;
                    states.getState('epson_stylus_px830.0.UNREACH', function (err, fileName) {
                        expect(err).to.be.not.ok;
                        expect(fileName).to.be.ok;
                        expect(fileName.ack).to.be.true;
                        done();
                    });
                });
            });
        });
    });
    
    after('epson_stylus_px830: Stop js-controller', function (done) {
        this.timeout(5000);
        setup.stopController(function () {
            done();
        });
    });
});
