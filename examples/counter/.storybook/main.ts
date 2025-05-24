import type { StorybookConfig } from '@storybook/html-vite';

import { join, dirname } from "path"
import { ecsstatic } from '@acab/ecsstatic/vite';

/**
* This function is used to resolve the absolute path of a package.
* It is needed in projects that use Yarn PnP or are set up within a monorepo.
*/
function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, 'package.json')))
}
const config: StorybookConfig = {
  "stories": [
    "../stories/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    getAbsolutePath('@storybook/addon-essentials'),
    getAbsolutePath('@storybook/addon-interactions')
  ],
  "framework": {
    "name": getAbsolutePath('@storybook/html-vite'),
    "options": {}
  },
  async viteFinal(config, { configType }) {
    const { mergeConfig } = await import('vite');
    return mergeConfig(config, {
      plugins: [
        ecsstatic(),
      ]
    });
  },
};
export default config;