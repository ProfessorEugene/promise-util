const debug = require('debug')('PromiseUtil.test.js');
const { assert } = require('chai');
const PromiseUtil = require('../lib/PromiseUtil.js');
/* eslint no-return-assign: 0 */
describe('PromiseUtil tests', () => {
  describe('#allLimit', () => {
    describe('limit behavior', () => {
      it('returns empty result set for empty generators array', () => PromiseUtil.allLimit({ promiseGenerators: [] })
        .then((result) => {
          assert.isArray(result);
          assert.equal(result.length, 0);
        }));

      it('runs promises in serial', () => PromiseUtil
        .allLimit({
          promiseGenerators: Array.from({ length: 8 }).map((e, i) => () => Promise.resolve(i)),
          logger: debug,
        })
        .then((result) => {
          assert.deepEqual(result, [0, 1, 2, 3, 4, 5, 6, 7]);
        }));

      it('fails on any promise error', () => {
        let completed = 0;
        const mkPromise = () => () => new Promise(resolve => (completed += 1)
          && setTimeout(resolve, 125));
        /* put in a promise that fails */
        return PromiseUtil.allLimit({
          promiseGenerators: [mkPromise(), () => Promise.reject(new Error('test-rejected')), mkPromise()],
        })
          .then(() => {
            throw new Error('Promise should never complete!');
          })
          .catch((expectedError) => {
            /* verify error raised by one promise is propagated up */
            assert.equal(expectedError.message, 'test-rejected');
            /* verify last promsie is not started */
            assert.equal(1, completed);
          });
      });

      it('runs a maximum of limit jobs at a time', () => {
        let completedJobs = 0;
        let runningJobs = 0;
        let maxRunningJobs = 0;
        const mkPromise = () => () => new Promise((resolve) => {
          runningJobs += 1;
          if (runningJobs > maxRunningJobs) {
            maxRunningJobs = runningJobs;
          }
          setTimeout(() => {
            runningJobs -= 1;
            completedJobs += 1;
            resolve('ok');
          }, 1);
        });
        return PromiseUtil.allLimit({
          promiseGenerators: Array.from({ length: 10 }).map(mkPromise),
          limit: 3,
        })
          .then((result) => {
            assert.deepEqual(result, Array.from({ length: 10 }).map(() => 'ok'));
            assert.equal(completedJobs, 10);
            assert.equal(maxRunningJobs, 3);
          });
      });
    });

    describe('validation', () => {
      /* promiseGenerators */
      it('fails fast when promiseGenerators is undefined', () => {
        assert.throws(() => {
          PromiseUtil.allLimit({
            promiseGenerators: undefined,
          });
        }, 'promiseGenerators can not be null or undefined');
      });

      it('fails fast when promiseGenerators is null', () => {
        assert.throws(() => {
          PromiseUtil.allLimit({
            promiseGenerators: null,
          });
        }, 'promiseGenerators can not be null or undefined');
      });

      it('fails fast when promiseGenerators is an object instead of an array', () => {
        assert.throws(() => {
          PromiseUtil.allLimit({
            promiseGenerators: {},
          });
        }, 'promiseGenerators must be an array, not object');
      });

      /* limit */

      it('fails fast when limit is null', () => {
        assert.throws(() => {
          PromiseUtil.allLimit({
            promiseGenerators: [],
            limit: null,
          });
        }, 'limit can not be null or undefined');
      });

      it('fails fast when limit is an object instead of a number', () => {
        assert.throws(() => {
          PromiseUtil.allLimit({
            promiseGenerators: [],
            limit: {},
          });
        }, 'limit must be a number, not object');
      });

      /* logger */

      it('fails fast when logger is null', () => {
        assert.throws(() => {
          PromiseUtil.allLimit({
            promiseGenerators: [],
            logger: null,
          });
        }, 'logger can not be null or undefined');
      });

      it('fails fast when logger is an object not a function', () => {
        assert.throws(() => {
          PromiseUtil.allLimit({
            promiseGenerators: [],
            logger: {},
          });
        }, 'logger must be a function, not object');
      });
    });
  });
});
