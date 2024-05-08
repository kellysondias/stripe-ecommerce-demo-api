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
				const {
					name,
					description,
					price: productPrice,
					image,
				} = product;
				const unit_amount = productPrice * 100;

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

		if (!line_items)
			res.status(StatusCodes.BAD_REQUEST).send("Bad request");

		if (!session)
			res.status(StatusCodes.NOT_FOUND).send("Not found");

		res.status(StatusCodes.OK).json(session);
	} catch (error) {
		console.log(error);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			status: StatusCodes.INTERNAL_SERVER_ERROR,
			message: `Something went wrong: '${(error as any).message}'`,
		});
	}
}
