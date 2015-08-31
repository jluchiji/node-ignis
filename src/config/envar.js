/**
 * config/envar.js
 *
 * @author  Denis-Luchkin-Zhou
 * @license MIT
 */

import Debug       from 'debug';
import Chalk       from 'chalk';

const  debug = Debug('ignis:config:envar');

/**
 * env(1)
 *
 * @description                Import specified environment variables into the
 *                             Ignis config.
 * @param          {fields}    Object whose keys are envar names, and values
 *                             are string descriptions of the parameter.
 */
export default function env(fields) {
  Object
    .keys(fields)
    .forEach(key => {
      if (typeof process.env[key] === 'undefined') {
        debug(`${Chalk.red('[missing]')} ${key}`);
        this.emit('config.missing', { name: key, description: fields[key] });
      } else {
        this.config(`env.${key}`, process.env[key]);
      }
    });
}
