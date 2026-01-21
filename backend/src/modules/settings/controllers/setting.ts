import { request, response } from "express";
import { z } from "zod";
import prisma from "../../../prisma.js";

const productTypeSchema = z.object({
	type: z.string().min(1, "type is required").trim(),
});

export const createProductType = async (req = request, res = response) => {
	try
	{
			const validateData = productTypeSchema.parse(req.body);

			// Check for duplicate type
			const existingType = await prisma.productType.findUnique({
				where: { type: validateData.type }
			});

			if (existingType) {
				return res.status(409).json({ message: "Product type already exists" });
			}

			const newProductType = await prisma.productType.create({
				data: validateData,
			});

			return res.status(201).json(newProductType);
	}
	catch (error)
	{
		if (error instanceof z.ZodError) {
			const errors = error.issues.map((err) => err.message);
			return res.status(400).json({ errors });
		}
		console.error("Error creating product type:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
};

export const getProductTypes = async (req = request, res = response) => {
	try
	{
		const productTypes = await prisma.productType.findMany({ orderBy: { type: "asc" } });

		return res.status(200).json(productTypes);
	}
	catch (error)
	{
		if (error instanceof z.ZodError) {
			const errors = error.issues.map((err) => err.message);
			return res.status(400).json({ errors });
		}
		console.error("Error fetching product types:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
};

const shelfSchema = z.object({
	zone: z.string().min(1, "zone is required").trim(),
	row: z.number().min(1, "row must be at least 1"),
});

export const createShelf = async (req = request, res = response) => {
	try
	{
		const validateData = shelfSchema.parse(req.body);

		// Check for duplicate shelf
		const existingShelf = await prisma.shelf.findUnique({
			where: {
				zone_row: {
					zone: validateData.zone,
					row: validateData.row
				}
			}
		});

		if (existingShelf) {
			return res.status(409).json({ message: "Shelf already exists" });
		}

		const newShelf = await prisma.shelf.create({
			data: validateData,
		});

		return res.status(201).json(newShelf);
	}
	catch (error)
	{
		if (error instanceof z.ZodError) {
			const errors = error.issues.map((err) => err.message);
			return res.status(400).json({ errors });
		}
		return res.status(500).json({ message: "Internal server error" });
	}
};

export const getShelves = async (req = request, res = response) => {
	try
	{
		const shelves = await prisma.shelf.findMany({ orderBy: [{ zone: "asc" }, { row: "asc" }] });

		return res.status(200).json(shelves);
	}
	catch (error)
	{
		if (error instanceof z.ZodError) {
			const errors = error.issues.map((err) => err.message);
			return res.status(400).json({ errors });
		}
		console.error("Error fetching shelves:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
};