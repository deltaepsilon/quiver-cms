var Q = require('q');

module.exports = {
	async: function (cb) {
		var resolved,
			rejected,
			result,
			error,
			thenResolve,
			thenReject;

		if (!cb) {
			return Q.defer();
		}

		return {
			resolve: function (res) {
				result = res;
				resolved = true;

				if (typeof cb === 'function') {
					cb(null, result);
				}
				
				if (typeof thenResolve === 'function') {
					thenResolve(result);
				}
			},
			reject: function (res) {
				error = res;
				rejected = true;

				if (typeof cb === 'function') {
					cb(error);
				}
				
				if (typeof thenResolve === 'function') {
					thenResolve(result);
				}
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
			fulfilled: function (next) {
				return next(cb);
			}

		}
	}

};