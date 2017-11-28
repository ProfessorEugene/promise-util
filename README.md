# promise-util #

Simplistic, dependency-less js package with basic utilities for working with promises.
Largely obviated by es6 [async/await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function), and [async-promises](https://www.npmjs.com/package/async-promises)

## Usage ##

### Installing ###

Update ```package.json``` to include the following dependencies:

```
    "promise-util": "ProfessorEugene/promise-util#promise-util-1.0.0",
```

or install via npm

```
npm install ProfessorEugene/promise-util
```
### API ###

Complete API documentation is available [here](https://professoreugene.github.io/promise-util/)

### Example: Run promises in batches of X ###

```
const PromiseUtil = require('promise-util');
const promise = result => new Promise(r => setTimeout(() => r(result)));
PromiseUtil.allLimit({
  promiseGenerators: [
    () => promise('a'),
    () => promise('b'),
    () => promise('c')
    ],
  limit: 2,
})
  .then((results) => {
    /* results will be ['a', 'b', 'c'] */
  })
  .catch((error) => {
    /* error will be thrown when *any* promsie fails */
  });
```

## Building ##
* ```npm install``` - installs dependencies
* ```npm run lint``` - runs eslint
* ```npm run test``` - runs tests
* ```npm run jsdoc``` - runs jsdoc
* ```npm run release``` - performs a release [lint/test/jsdoc/release]
