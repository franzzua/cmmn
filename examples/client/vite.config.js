import react from '@vitejs/plugin-react-swc';

export default {
	plugins: [
		...react({
			devTarget: 'esnext',
			tsDecorators: true,

		}),
	],
};
