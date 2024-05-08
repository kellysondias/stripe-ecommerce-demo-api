import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { stripe } from "../app";

interface Product {
	name: string;
	image: string;
	description: string;
	price: number;
}

export async function handlePriceCreation(
	{ body }: Request,
	res: Response,
) {
	try {
		const prices = await Promise.all(
			body.map(async (product: Product) => {
				const { name, description, price, image } = product;
				const unit_amount = Number((price * 100).toFixed(0));

				const { id: newProductId } =
					await stripe.products.create({
						name,
						images: [image],
						description,
					});

				const { id: priceId } = await stripe.prices.create({
					product: newProductId,
					unit_amount,
					currency: "usd",
				});

				return priceId;
			}),
		);

		res.json({ prices });
	} catch (error) {
		console.error(error);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			status: StatusCodes.INTERNAL_SERVER_ERROR,
			message: `Something went wrong: '${(error as any).message}'`,
		});
	}
}

export async function handleCheckout(req: Request, res: Response) {
	const { body: line_items } = req;

	try {
		const session = await stripe.checkout.sessions.create({
			payment_method_types: ["card"],
			currency: "usd",
			line_items,
			mode: "payment",
			success_url: "http://localhost:3000/success",
			cancel_url: "http://localhost:3000/canceled",
		});

		if (!line_items || line_items.length === 0)
			res.status(StatusCodes.BAD_REQUEST).send("Bad request");

		if (!session)
			res.status(StatusCodes.NOT_FOUND).send("Not found");

		res.status(StatusCodes.OK).json(session);
	} catch (error) {
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			status: StatusCodes.INTERNAL_SERVER_ERROR,
			message: `Something went wrong: '${(error as any).message}'`,
		});
	}
}

const style = {
	body: "bg-gray-800 h-screen",
	text: "text-white",
	container: "flex flex-col justify-center items-center h-screen",
	link: "text-teal-700 hover:text-teal-500",
	heading: "text-3xl",
};

export async function showSuccessPage(_: Request, res: Response) {
	const html = `
	<!DOCTYPE html>
	<html>
	  <head>
		<title>Stripe Ecommerce - Sucess</title>
		<script src="https://cdn.tailwindcss.com"></script>
	  </head>
	  <body class="${style.body}">
		<div class="${style.container} ${style.text}"><h1 class="${style.heading}">Success</h1>
		<p>Thank you for trying this demo!</p>
		<p>No real money was charged.</p>
		<p>See more web apps like this in <a href="https://portfolio-kellysondias.vercel.app/" class="${style.link}">my portfolio</a>.</p></div>
	  </body>
	</html>
  `;
	res.status(StatusCodes.OK).send(html);
}

export async function showCanceledPage(_: Request, res: Response) {
	const html = `
	<!DOCTYPE html>
	<html>
	  <head>
		<title>Stripe Ecommerce - Sucess</title>
		<script src="https://cdn.tailwindcss.com"></script>
	  </head>
	  <body class="${style.body}">
		<div class="${style.container} ${style.text}">
			<h1 class="${style.heading}">Canceled</h1>
			<p>Something went wrong with your transaction</p>
			<p>No real money was charged.</p>
			<p>See more web apps like this in <a href="https://portfolio-kellysondias.vercel.app/" class="${style.link}">my portfolio</a>.</p>
		</div>
	  </body>
	</html>
  `;
	res.status(StatusCodes.OK).send(html);
}
