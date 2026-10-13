import { libConfig } from '@cmmn/tools/vite';
import { ecsstatic } from '@acab/ecsstatic/vite';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default libConfig(import.meta.dirname, {
	plugins: [ecsstatic({ classNamePrefix: 'web' }), cssInjectedByJsPlugin()],
});
