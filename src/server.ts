import { app } from "./app";

const port = process.env.PORT || 3000;

const start = async () => {
	app.listen(port, async () => {
		console.log(`👋 Server running on localhost:${port}...`);
	});
};

start();
