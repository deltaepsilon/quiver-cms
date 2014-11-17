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
				

				if (!resolved && typeof cb === 'function') {
					cb(null, result);
				}
				
				if (!resolved && typeof thenResolve === 'function') {
					thenResolve(result);
				}

				resolved = true;
			},
			reject: function (res) {
				error = res;
				
				if (!rejected && typeof cb === 'function') {
					cb(error);
				}
				
				if (!rejected && typeof thenResolve === 'function') {
					thenResolve(result);
				}

				rejected = true;
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