if(process.env.NODE_ENV === 'production'){
	await import('@cmmn/service-worker/client');
}
const app = await import('./src/app.js');

export default app;