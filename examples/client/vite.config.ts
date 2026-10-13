import { appConfig } from '@cmmn/tools/vite';
import { ecsstatic } from '@acab/ecsstatic/vite';

export default appConfig(import.meta.dirname, './src/index.html', {
	plugins: [ecsstatic({ classNamePrefix: 'ec' })],
});
