import react from '@vitejs/plugin-react-swc';

export default env => {
	return ({
		plugins: [
			// ...react({
			// 	devTarget: 'esnext',
			// 	tsDecorators: true,
			// 	useAtYourOwnRisk_mutateSwcOptions(options) {
			// 		options.jsc.transform.decoratorVersion = "2022-03"
			// 	}
			// }),
		],
	});
};
