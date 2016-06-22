var expect = require('chai').expect;
var setup  = require(__dirname + '/lib/setup');
var fs     = require('fs');
var objects     = null;
var states      = null;
var connected   = false;

describe('solarwetter: test adapter', function() {
    before('solarwetter: Start js-controller', function (_done) {
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

    it('solarwetter: wait', function (done) {
        this.timeout(5000);
        setTimeout(function () {
            done();
        }, 3000);
    });

    it('solarwetter: feeds to be parsed', function (done) {
        this.timeout(20000);
        states.getState('solarwetter.0.forecast.clearSky', function (err, fileName) {
            expect(err).to.be.not.ok;
            expect(fileName).to.be.ok;
            expect(fileName.ack).to.be.true;
            states.getState('solarwetter.0.forecast.realSky_min', function (err, fileName) {
                expect(err).to.be.not.ok;
                expect(fileName).to.be.ok;
                expect(fileName.ack).to.be.true;
                states.getState('solarwetter.0.forecast.realSky_max', function (err, fileName) {
                    expect(err).to.be.not.ok;
                    expect(fileName).to.be.ok;
                    expect(fileName.ack).to.be.true;
                    states.getState('solarwetter.0.forecast.Datum', function (err, fileName) {
                        expect(err).to.be.not.ok;
                        expect(fileName).to.be.ok;
                        expect(fileName.ack).to.be.true;
                        done();
                    });
                });
            });
        });
    });
    
    after('solarwetter: Stop js-controller', function (done) {
        this.timeout(5000);
        setup.stopController(function () {
            done();
        });
    });
});
