import {createVitePlugin} from 'unplugin'

export const hooksPlugin = createVitePlugin(target => ({
    name: target.packageJson.name + ':logger',
    ...target.hooks
}));
