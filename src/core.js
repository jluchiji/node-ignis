/**
 * core.js
 *
 * @author  Denis Luchkin-Zhou <denis@ricepo.com>
 * @license MIT
 */

import _           from 'lodash';
import Debug       from 'debug';
import Express     from 'express';
import Bluebird    from 'bluebird';
import Monologue   from 'monologue.js';

import Symbol      from './util/symbols';

const debug = Debug('ignis:core');

/*!
 * Export symbols used by Ignis class.
 */
const init = Symbol('Ignis::core::init');
const exts = Symbol('Ignis::core::exts');


/**
 * IgnisApp
 *
 * @description Ignis application class.
 */
export default class Ignis extends Monologue {

  constructor() {
    super();

    /* Set to keep track of applied initializers */
    this[init]      = new Set();

    /* Ignis application middleware management */
    this.factories  = [ ];

    /* Startup sequence root promise */
    this.startup    = Bluebird.resolve();

    /* Root express router */
    this.root       = Express();

    this.init();
  }


  /**
   * init(0)
   *
   * @description              Runs all initializers that have not been run on
   *                           this Ignis instance.
   */
  init() {
    Ignis[init].forEach(fn => {
      if (this[init].has(fn)) { return; }
      this[init].add(fn);
      fn.call(this);
    });
  }


  /**
   * wait(1)
   *
   * @access         public
   * @description                Makes Ignis wait for the promise before starting.
   * @param          {action}    Function to call and wait for.
   * @returns        {Ignis}     Ignis instance for further chaining.
   */
  wait(action) {
    debug(`Ignis::wait()`);
    if (typeof action === 'function') {
      this.startup = this.startup.then(i => action.call(this, this.root));
    } else {
      throw new Error('Cannot wait on non-function objects.');
    }
    return this;
  }


  /**
   * listen(1)
   *
   * @description                Creates an Express.js application, mounts the
   *                             root router and listens for connections on the
   *                             specified port.
   * @param          {port}      [Optional] Port to listen on (default: PORT)
   * @returns        {promise}   Rejects when an error occurs.
   */
  listen(port) {
    debug('Ignis::listen()');
    if (typeof port !== 'number') { port = Number(process.env.PORT); }
    this.wait(i =>
      Bluebird.fromNode((done) => {
        this.root.listen(port, done);
      })
      .tap(i => debug('Ignis::listen(): Ignis up and ready'))
    );
    return this.startup;
  }


  /**
   * use(1)
   *
   * @access         public
   * @description                Make Ignis use the extension.
   * @param          {fn}        Function exported by the extension module.
   * @returns        {Ignis}     Ignis class for further chaining.
   */
  use(fn) { Ignis.use.call(this, fn); }

}


/*!
 * Initializers: these are called every time an Ignis instance is created.
 */
Ignis[init] = [ ];


/*!
 * Extensions: tracks which extensions are already attached to the Ignis.
 */
Ignis[exts] = new Set();


/**
 * init(1)
 *
 * @description                Pushes the initializer callback into the Ignis
 *                             initializer stack.
 * @param          {fn}        Initializer function to push.
 */
Ignis.init = function(fn) {
  Ignis[init].push(fn);
};


/**
 * use(1)
 *
 * @access         public
 * @description                Make Ignis use the extension.
 * @param          {fn}        Function exported by the extension module.
 * @returns        {Ignis}     Ignis class for further chaining.
 */
Ignis.use = function(fn) {
  /* Handle ES6 modules with multiple exports */
  if (_.isObject(fn) && _.isFunction(fn.default)) { fn = fn.default; }
  /* No-op if this extension is already attached */
  if (Ignis[exts].has(fn)) { return Ignis; }
  Ignis[exts].add(fn);
  fn(Ignis);
  if (this !== Ignis) { this.init(); }
};
