if(process.env.NODE_ENV === 'production'){
	await import('@cmmn/service-worker/client');
}
export default await import("./app");
