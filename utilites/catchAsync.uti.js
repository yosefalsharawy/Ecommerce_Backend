//catch async if it catches an error it will towards it for the errorHandel middlewatr
module.exports = (fun) => {
	return (req, res, next) => {
		fun(req, res, next).catch(next);
	};
};
