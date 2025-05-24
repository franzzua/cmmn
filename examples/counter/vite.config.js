import { ecsstatic } from '@acab/ecsstatic/vite';

export default env => {
	return ({
		plugins: [
			ecsstatic(),
		],
	});
};
