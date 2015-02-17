var Q = require('q');

module.exports = {
	async: function (cb) {
		var resolved,
			rejected,
			result,
			error,
			thenResolve,
			thenReject,
			returned;

		if (!cb) {
			return Q.defer();
		}

		return {
			resolve: function (res) {
				result = res;
				

				if (!returned && typeof cb === 'function') {
					cb(null, result);
				}
				
				if (!returned && typeof thenResolve === 'function') {
					thenResolve(result);
				}

				returned = true;
			},
			reject: function (res) {
				error = res;
				
				if (!returned && typeof cb === 'function') {
					cb(error);
				}
				
				if (!returned && typeof thenResolve === 'function') {
					thenResolve(result);
				}

				returned = true;
			},
			promise: {
				then: function (resolve, reject) {
					thenResolve = resolve;
					thenReject = reject;

					if (rejected) {
						reject(error);
					} else if (resolved) {
						resolve(result);
					}
				}
			},
			fulfilled: {
				then: function (next) {
					return next(cb);
				}
			}

		}
	},

	scrubMissingAttributes: function (obj, options) {
		var scrub = function (objA) {
			var keys = Object.keys(objA),
				i = keys.length;

			while (i--) {
				if (objA[keys[i]] === null || typeof objA[keys[i]] === 'undefined') {
					delete objA[keys[i]];
				} else if (options.removeFunctions && typeof objA[keys[i]] === 'function') {
					delete objA[keys[i]];
				} else if (options.removeEmptyStrings && typeof objA[keys[i]] === 'string' && objA[keys[i]].length === 0) {
					delete objA[keys[i]];
				} else if (options.removeEmptyObjects && typeof objA[keys[i]] === 'object' && Object.keys(objA[keys[i]]).length === 0) {
					delete objA[keys[i]];
				} else if (typeof objA[keys[i]] === 'object') {
					scrub(objA[keys[i]]);
				}
			}


		};

		options = options || {};

		scrub(obj);

		return obj;
	}

};