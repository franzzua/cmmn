import react from '@vitejs/plugin-react-swc';
import { ecsstatic } from '@acab/ecsstatic/vite';

export default env => {
	return ({
		plugins: [
			...react({
				devTarget: 'esnext',
				tsDecorators: true,
				useAtYourOwnRisk_mutateSwcOptions(options) {
					options.jsc.transform.decoratorVersion = "2022-03"
				}
			}),
			ecsstatic({
				classNamePrefix: 'ec'
			}),
		],
	});
};
