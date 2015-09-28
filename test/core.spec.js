/**
 * test/ignis.spec.js
 *
 * @author  Denis Luchkin-Zhou <denis@ricepo.com>
 * @license MIT
 */
/* jshint -W030 */

const Sinon          = require('sinon');
const Chai           = require('chai');
const Bluebird       = require('bluebird');

Chai.use(require('chai-as-promised'));
const expect         = Chai.expect;

const Ignis          = require('../lib/core');

describe('Ignis Class', function() {

  describe('constructor(1)', function() {

    it('should create a new Ignis instance', function() {
      const ignis = new Ignis();
      expect(ignis).to.be.an.instanceOf(Ignis);

      const ignis2 = Ignis();
      expect(ignis2).to.be.an.instanceOf(Ignis).and.not.to.equal(ignis);
    });

    it('should get the global instance', function() {
      const instance = Ignis();
      expect(instance).to.be.an.instanceOf(Ignis);

      const instance2 = Ignis();
      expect(instance2).to.be.an.instanceOf(Ignis).and.to.equal(instance);

      const another = Ignis(null);
      expect(another).to.be.an.instanceOf(Ignis).and.not.to.equal(instance);

      const created = new Ignis();
      const yetAnother = Ignis(created);
      expect(yetAnother).to.be.an.instanceOf(Ignis).and.to.equal(created);
    });

  });

  describe('use(1)', function() {

    const callback = Sinon.spy();

    it('should attach the extension', function() {
      Ignis.use(callback);
      expect(callback).to.be.calledOnce.and.calledWith(Ignis);
    });

    it('should not attach an extension that is already attached', function() {
      Ignis.use(callback);
      expect(callback).to.be.calledOnce;
    });

    it('should handle ES6 modules required from CommonJS', function() {
      const extension = { __esModule: true, default: Sinon.spy() };
      Ignis.use(extension);
      expect(extension.default).to.be.calledOnce;
    });

    it('should proxy instance use() to static use()', function() {
      const extension = Sinon.spy(function(i) {
        expect(this).not.to.be.null;
        expect(i).to.equal(Ignis);
      });

      const ignis = new Ignis();
      ignis.use(extension);
    });

    it('should be able to auto load peer modules', function() {
      const ignis = new Ignis();
      ignis.use('no-op');
    });

    it('should forward arguments to the extension function', function() {
      const extension = Sinon.spy();
      const argument = 'test';

      Ignis.use(extension, argument);
      expect(extension).to.be.calledOnce.and.calledWith(Ignis, argument);
    });

  });

  describe('init(0)', function() {

    it('should run every initializer exactly once', function() {
      const fn0 = Sinon.spy();
      const fn1 = Sinon.spy();

      Ignis.init(fn0);
      Ignis.init(fn1);

      const instance = new Ignis();
      expect(fn0).to.be.calledOnce;
      expect(fn1).to.be.calledOnce;

      instance.init();
      expect(fn0).to.be.calledOnce;
      expect(fn1).to.be.calledOnce;
    });

  });

  describe('wait(1)', function() {

    beforeEach(function() {
      this.ignis = new Ignis();
    });

    it('should wait on a promised function', function() {
      const promise1 = Bluebird.delay(20);
      const promise2 = Bluebird.delay(30);

      const action1 = Sinon.spy(() => promise1);
      const action2 = Sinon.spy(() => {
        expect(promise1.isFulfilled()).to.equal(true);
        return promise2;
      });
      const action3 = Sinon.spy(() => {
        expect(promise2.isFulfilled()).to.equal(true);
        return true;
      });

      this.ignis.wait(action1).wait(action2).wait(action3);
      return expect(this.ignis.startup).to.be.fulfilled.then(() => {
        expect(action1).to.be.calledOnce;
        expect(action2).to.be.calledOnce;
        expect(action3).to.be.calledOnce;
        expect(action1).to.be.calledBefore(action2);
      });
    });

    it('should wait on a sync functon', function() {
      const action1 = Sinon.spy(() => 123);
      const action2 = Sinon.spy(() => 456);

      this.ignis.wait(action1).wait(action2);
      return expect(this.ignis.startup).to.be.fulfilled.then(() => {
        expect(action1).to.be.calledOnce;
        expect(action2).to.be.calledOnce;
        expect(action1).to.be.calledBefore(action2);
      });
    });

    it('should wait on a mix of sync and promised functions', function() {
      const promise = Bluebird.delay(30);

      const action1 = Sinon.spy(() => promise);
      const action2 = Sinon.spy(() => {
        expect(promise.isFulfilled()).to.equal(true);
        return true;
      });

      this.ignis.wait(action1).wait(action2);
      return expect(this.ignis.startup).to.be.fulfilled.then(() => {
        expect(action1).to.be.calledOnce;
        expect(action2).to.be.calledOnce;
        expect(action1).to.be.calledBefore(action2);
      });
    });

    it('should throw when waiting on a non-function', function() {
      expect(() => {
        this.ignis.wait(null);
      }).to.throw('Cannot wait on non-function objects.');
    });
  });

  describe('listen(1)', function() {

    beforeEach(function() {
      this.ignis = new Ignis();
      this.ignis.root = {
        listen: Sinon.spy(function(port, cb) {
          if (port === 1111) { cb(new Error('fail')); }
          process.nextTick(cb);
        })
      };
    });

    it('should start listening for connections', function() {
      process.env.PORT = 9999;
      return this.ignis.listen(123).then(() => {
        expect(this.ignis.root.listen).to.be.calledOnce;
        expect(this.ignis.root.listen).to.be.calledWith(123);
      });
    });

    it('should use PORT enconst when no port is specified', function() {
      process.env.PORT = 9999;
      return this.ignis.listen().then(() => {
        expect(this.ignis.root.listen).to.be.calledOnce;
        expect(this.ignis.root.listen).to.be.calledWith(9999);
      });
    });

    it('should correctly capture errors', function() {
      process.env.PORT = 9999;
      const promise = this.ignis.listen(1111);
      expect(promise).to.be.rejectedWith('fail');
    });

  });

});
