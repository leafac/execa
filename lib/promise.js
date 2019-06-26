'use strict';
const mergePromiseProperty = (spawned, getPromise, property) => {
	Object.defineProperty(spawned, property, {
		value(...args) {
			return getPromise()[property](...args);
		},
		writable: true,
		enumerable: false,
		configurable: true
	});
};

// The return value is a mixin of `childProcess` and `Promise`
const mergePromise = (spawned, getPromise) => {
	mergePromiseProperty(spawned, getPromise, 'then');
	mergePromiseProperty(spawned, getPromise, 'catch');

	// TODO: Remove the `if`-guard when targeting Node.js 10
	if (Promise.prototype.finally) {
		mergePromiseProperty(spawned, getPromise, 'finally');
	}

	return spawned;
};

// Use promises instead of `child_process` events
const getSpawnedPromise = (spawned, context) => {
	return new Promise((resolve, reject) => {
		spawned.on('exit', (code, signal) => {
			if (context.timedOut) {
				reject(Object.assign(new Error('Timed out'), {code, signal}));
				return;
			}

			resolve({code, signal});
		});

		spawned.on('error', error => {
			reject(error);
		});

		if (spawned.stdin) {
			spawned.stdin.on('error', error => {
				reject(error);
			});
		}
	});
};

module.exports = {
	mergePromise,
	getSpawnedPromise
};
