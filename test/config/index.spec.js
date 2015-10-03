/**
 * test/config/index.spec.js
 *
 * @author  Denis Luchkin-Zhou <denis@ricepo.com>
 * @license MIT
 */
/* jshint -W030 */

var Sinon          = require('sinon');
var Chai           = require('chai');
var Bluebird       = require('bluebird');

Chai.use(require('chai-as-promised'));
var expect         = Chai.expect;

var Ignis          = require('../../lib/core');
var target         = require('../../lib/config/index');

describe('config(2)', function() {

  beforeEach(function() {
    this.ignis = new Ignis();
  });

  it('should mount to a namespace', function() {
    this.ignis.use(target);
    return this.ignis.startup.then(() => {
      expect(this.ignis.config).to.be.a('function').and.equal(target.config);
    });
  });

  it('should get/set the config value', function() {
    this.ignis.config('foo', 'bar');
    var result = this.ignis.config('foo');

    expect(result).to.equal('bar');
  });

  it('should support get/set with deep paths', function() {
    this.ignis.config('a.b.c.bar', 'foo');
    var result = this.ignis.config('a');

    expect(result).to.deep.equal({ b: { c: { bar: 'foo' } } });
  });

  it('should throw when getting an undefined config', function() {
    expect(i => {
      this.ignis.config('foo');
    }).to.throw('Config option \'foo\' is not defined.');
  });

  it('should emit events when config values change', function() {

    this.ignis.emit = Sinon.spy(this.ignis.emit);

    this.ignis.config('foo', 'bar');
    expect(this.ignis.emit).to.be.calledOnce;
    expect(this.ignis.emit).to.be.calledWith('config.set');

    this.ignis.config('foo', 'test');
    expect(this.ignis.emit).to.be.calledTwice;
    expect(this.ignis.emit).to.be.calledWith('config.modified');

  });

  it('should substiture envars', function() {
    const config = { test: '$NODE_ENV' };
    this.ignis.config('foo', config);

    const result = this.ignis.config('foo.test');
    expect(result).to.equal(process.env.NODE_ENV);
  });

  it('should throw on missing envars', function() {
    const config = { test: '$NO_SUCH_VAR' };

    expect(() => this.ignis.config('foo', config)).to.throw('Missing envar: NO_SUCH_VAR');
  });

});
