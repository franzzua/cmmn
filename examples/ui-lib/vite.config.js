import react from '@vitejs/plugin-react-swc';
import { ecsstatic } from '@acab/ecsstatic/vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

export default {
	plugins: [
		...react({
			devTarget: 'esnext',
			tsDecorators: true,
			useAtYourOwnRisk_mutateSwcOptions(options){
				options.jsc.transform.decoratorVersion = "2022-03"
			}
		}),
		ecsstatic({
			classNamePrefix: 'web',
		}),
		cssInjectedByJsPlugin()
	],
};
