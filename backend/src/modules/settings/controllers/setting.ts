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

export const updateProductType = async (req = request, res = response) => {
	try {
		const { id } = req.params;
		if (!id) return res.status(400).json({ message: "Product type ID is required" });

		const validateData = productTypeSchema.parse(req.body);

		// Check for duplicate
		const existing = await prisma.productType.findFirst({
			where: { type: validateData.type, NOT: { id: Number(id) } }
		});
		if (existing) {
			return res.status(409).json({ message: "Bu ürün tipi adı zaten kullanılıyor." });
		}

		const updated = await prisma.productType.update({
			where: { id: Number(id) },
			data: { type: validateData.type },
		});
		return res.status(200).json(updated);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return res.status(400).json({ errors: error.issues.map((e) => e.message) });
		}
		if ((error as any).code === 'P2025') {
			return res.status(404).json({ message: "Ürün tipi bulunamadı." });
		}
		console.error("Error updating product type:", error);
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
		const shelves = await prisma.shelf.findMany({
			where: { isVirtual: false },
			orderBy: [{ zone: "asc" }, { row: "asc" }]
		});

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

export const updateShelf = async (req = request, res = response) => {
	try {
		const { id } = req.params;
		if (!id) return res.status(400).json({ message: "Shelf ID is required" });

		const validateData = shelfSchema.parse(req.body);

		// Prevent editing virtual shelf
		const shelf = await prisma.shelf.findUnique({ where: { id: Number(id) } });
		if (shelf?.isVirtual) {
			return res.status(403).json({ message: "Sanal raf düzenlenemez." });
		}

		// Check for duplicate zone+row
		const existing = await prisma.shelf.findFirst({
			where: {
				zone: validateData.zone,
				row: validateData.row,
				NOT: { id: Number(id) }
			}
		});
		if (existing) {
			return res.status(409).json({ message: `"${validateData.zone}-${validateData.row}" rafı zaten mevcut.` });
		}

		const updated = await prisma.shelf.update({
			where: { id: Number(id) },
			data: { zone: validateData.zone, row: validateData.row },
		});
		return res.status(200).json(updated);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return res.status(400).json({ errors: error.issues.map((e) => e.message) });
		}
		if ((error as any).code === 'P2025') {
			return res.status(404).json({ message: "Raf bulunamadı." });
		}
		console.error("Error updating shelf:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
};

export const deleteProductType = async (req = request, res = response) => {
	try {
		const { id } = req.params;
		if (!id) return res.status(400).json({ message: "Product type ID is required" });

		// Check if any products reference this type
		const productsCount = await prisma.product.count({
			where: { productTypeId: Number(id) }
		});

		if (productsCount > 0) {
			return res.status(409).json({ message: `Bu \u00fcr\u00fcn tipine ba\u011fl\u0131 ${productsCount} \u00fcr\u00fcn var. \u00d6nce \u00fcr\u00fcnleri silin veya tipini de\u011fi\u015ftirin.` });
		}

		await prisma.productType.delete({ where: { id: Number(id) } });
		return res.status(200).json({ message: "Product type deleted" });
	} catch (error) {
		if ((error as any).code === 'P2025') {
			return res.status(404).json({ message: "Product type not found" });
		}
		console.error("Error deleting product type:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
};

export const deleteShelf = async (req = request, res = response) => {
	try {
		const { id } = req.params;
		if (!id) return res.status(400).json({ message: "Shelf ID is required" });

		// Prevent deleting virtual shelf
		const shelf = await prisma.shelf.findUnique({ where: { id: Number(id) } });
		if (shelf?.isVirtual) {
			return res.status(403).json({ message: "Sanal raf silinemez." });
		}

		// Check if any products reference this shelf
		const productsCount = await prisma.product.count({
			where: { shelfId: Number(id) }
		});

		if (productsCount > 0) {
			return res.status(409).json({ message: `Bu rafta ${productsCount} \u00fcr\u00fcn var. \u00d6nce \u00fcr\u00fcnleri ba\u015fka rafa ta\u015f\u0131y\u0131n.` });
		}

		await prisma.shelf.delete({ where: { id: Number(id) } });
		return res.status(200).json({ message: "Shelf deleted" });
	} catch (error) {
		if ((error as any).code === 'P2025') {
			return res.status(404).json({ message: "Shelf not found" });
		}
		console.error("Error deleting shelf:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
};

export const getShelfInventory = async (req = request, res = response) => {
	try {
		const shelves = await prisma.shelf.findMany({
			where: { isVirtual: false },
			orderBy: [{ zone: "asc" }, { row: "asc" }],
			include: {
				products: {
					where: {
						status: { notIn: ['DELIVERED', 'CANCELLED'] }
					},
					include: {
						productType: true,
						ticket: {
							include: { customer: true }
						}
					},
					orderBy: { receivedDate: 'desc' }
				}
			}
		});

		return res.status(200).json(shelves);
	} catch (error) {
		console.error("Error fetching shelf inventory:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
};