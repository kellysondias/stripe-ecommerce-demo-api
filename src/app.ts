import express from "express";
import "dotenv/config";
import { handleCheckout } from "./controllers/controllers";
import { handlePriceCreation } from "./controllers/controllers";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const api = "/api/v1";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const app = express();

app.use((_, res, next) => {
	res.setHeader("Access-Control-Allow-Credentials", "true");
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader(
		"Access-Control-Allow-Methods",
		"GET,OPTIONS,PATCH,DELETE,POST,PUT",
	);
	res.setHeader(
		"Access-Control-Allow-Headers",
		"X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
	);
	next();
});

app.use(express.json());

app.options("*", (_, res) => {
	res.status(200).end();
});

app.post(`${api}/create-price`, handlePriceCreation);

app.post(`${api}/checkout`, handleCheckout);

export { app };
