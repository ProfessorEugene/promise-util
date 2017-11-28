/* eslint valid-typeof: 0 */
const assertThat = v => ({
  named: name => Object.assign(this, {
    and: (() => this),
    assert: (c, m) => this.and(c || (() => { throw new Error(m); })()),
    isDefined: () => this.assert(v !== null && v !== undefined, `${name} can not be null or undefined`),
    isArray: () => this.assert(this.isDefined() && Array.isArray(v), `${name} must be an array, not ${typeof v}`),
    isA: t => this.assert(this.isDefined() && t === typeof v, `${name} must be a ${t}, not ${typeof v}`),
    isGreaterOrEqualTo: n => this.assert(this.isA('number') && v >= n, `${name} must be greater or equal to ${n}`),
  }),
});
/**
 * Basic utilities for working with Promises
 */
class PromiseUtil {
  /**
   * Given an array of promise generating functions, execute promises in parallel batches of
   * configurable size.
   *
   * @param {object} options
   * @param {Array} options.promiseGenerators - required array of functions that return a promsie
   *                                            when called; only "limit" promises will be
   *                                            requested at atime
   * @param {number} [options.limit = 1]      - numeric limit of maximum number of promises that
   *                                            can be executed in parallel
   * @param {logger} [options.logger]         - a logging function, invoked with string messages
   * @param {progressCallback} [options.progressCallback] - a progress callback function.
   */
  static allLimit({
    promiseGenerators = (() => { throw new Error('promiseGenerators can not be null or undefined'); })(),
    limit = 1,
    logger = () => { },
    progressCallback = (nCompleted, nTotal, elapsedMs) => {
      logger(`Completed ${nCompleted} of ${nTotal} jobs (${Math.abs((nCompleted / nTotal) * 100)}%) in ${elapsedMs}ms [ETA ${(nTotal - nCompleted) * (nCompleted / elapsedMs)}ms]`);
    },
  }) {
    /* fast fail conditions before returning a promise */
    assertThat(promiseGenerators).named('promiseGenerators').isArray();
    assertThat(limit).named('limit').isGreaterOrEqualTo(1);
    assertThat(progressCallback).named('progressCAllback').isA('function');
    assertThat(logger).named('logger').isA('function');

    const startTime = new Date().time;

    /* return a promise! */
    return new Promise((resolve, reject) => {
      logger(`Preparing to execute ${promiseGenerators.length} promises with parallel limit ${limit}`);
      /* handle case of empty promise generators array */
      if (promiseGenerators.length === 0) {
        resolve([]);
        return;
      }
      /* make a copy of tasks to run */
      const pendingTasks = promiseGenerators.slice();
      /* create a results array */
      const results = [];
      /* keep a variable specifying whether execution has failed */
      let failed = false;
      /**
       * Function that runs a single fiber of execution
       * @param {string} name fiber name
       */
      const runFiber = (name) => {
        /* simple inFiber debug logging function */
        const fDebug = msg => logger(`[fiber-${name}] ${msg}`);
        /* handle no more tasks */
        if (pendingTasks.length === 0) {
          fDebug('Terminating due to no more promises');
          return;
        }
        /* select a task */
        const task = pendingTasks.shift();
        /* handle non-function task */
        if (typeof task !== 'function') {
          failed = true;
          fDebug('promsieGenerators contained a non-function');
          reject(new Error('promsieGenerators contained a non-function'));
        }
        /* handle other task failure */
        if (failed) {
          fDebug('Terminating due to failure');
          return;
        }
        /* execute pending task */
        task()
          .then((taskResult) => {
            fDebug('Promise completed successfully');
            results.push(taskResult);
            /* update results */
            progressCallback(results.length, promiseGenerators.length, (new Date().time)
             - startTime);
            /* check if all tasks have completed */
            if (results.length === promiseGenerators.length) {
              fDebug('All promises completed successfully');
              /* all tasks have been completed */
              resolve(results);
            } else {
              runFiber(name);
            }
          })
          .catch((taskError) => {
            failed = true;
            fDebug(`Promise threw error: ${taskError.message}`);
            reject(taskError);
          });
      };
      /* start up some fibers of execution */
      Array.from({ length: Math.min(limit, promiseGenerators.length) }, (v, idx) => {
        const fiberName = idx;
        logger(`Starting execution fiber ${fiberName}`);
        return runFiber(fiberName);
      });
    });
  }
}
module.exports = PromiseUtil;


/**
 * A debug logging function invoked with a message
 *
 * @callback logger
 * @param {string} message message to log
 */

/**
 * A progress callback invoked any time a promise completes.
 *
 * @callback progressCallback
 * @param {number} nCompleted number of promises already resolved
 * @param {number} nTotal total number of promises
 * @param {number} elapsedMs milliseconds elapsed since promise execution started
 */
