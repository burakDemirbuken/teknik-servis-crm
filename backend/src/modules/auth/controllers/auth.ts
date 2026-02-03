import { request, response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../../prisma.js";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET)
	throw new Error("JWT_SECRET is not defined in environment variables");

const registerSchema = z.object({
	name: z.string().min(3).max(30, 'Username must be between 3 and 30 characters'),
	email: z.string().email({ message: 'Invalid email address' }).max(100, 'Email must be at most 100 characters'),
	password: z.string().min(6).max(100, 'Password must be between 6 and 100 characters'),
});

export const register = async (req = request, res = response) => {
	try
	{
		const { name, email, password } = registerSchema.parse(req.body);

		const existingUser = await prisma.user.findUnique({
			where: { email },
		});

		if (existingUser)
			return res.status(400).json({ message: "Email already in use" });

		const hashedPassword = await bcrypt.hash(password, 10);

		const newUser = await prisma.user.create({
			data: {
				name,
				email,
				password: hashedPassword,
			},
		});

		const { password: _, ...userWithoutPassword } = newUser;

		res.status(201).json({
			message: "User registered successfully",
			user: userWithoutPassword
		});
	}
	catch (error)
	{
		if (error instanceof z.ZodError)
		{
			const errors = error.issues.map((err) => err.message);
			return res.status(400).json({ errors });
		}
		console.error("Registration error:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
}

const loginSchema = z.object({
	email: z.string().email({ message: 'Invalid email address' }).max(100, 'Email must be at most 100 characters'),
	password: z.string().min(6).max(100, 'Password must be between 6 and 100 characters'),
});

export const login = async (req = request, res = response) => {
	try
	{
		console.log("Login attempt with data:", req.body);
		const { email, password } = loginSchema.parse(req.body);

		const user = await prisma.user.findUnique({
			where: { email },
		});

		if (!user)
			return res.status(401).json({ message: "Invalid email or password" });

		const isPasswordValid = await bcrypt.compare(password, user.password);

		if (!isPasswordValid)
			return res.status(401).json({ message: "Invalid email or password" });

		const token = jwt.sign(
			{
				userId: user.id,
				email: user.email
			},
			JWT_SECRET,
			{
				expiresIn: "1h"
			}
		);

		const { password: _, ...userWithoutPassword } = user;

		res.status(200).json({
			message: "Login successful",
			token,
			user: userWithoutPassword
		});
	}
	catch (error)
	{
		if (error instanceof z.ZodError)
		{
			const errors = error.issues.map((err) => err.message);
			return res.status(400).json({ errors });
		}
		console.error("Login error:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
}