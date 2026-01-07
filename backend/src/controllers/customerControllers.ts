import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. Müşteri Ekleme (POST)
export const createCustomer = async (req: Request, res: Response) => {
    try {
        const { name, phone, address } = req.body;

        // Basit validasyon
        if (!name || !phone) {
            return res.status(400).json({ error: 'İsim ve Telefon zorunludur!' });
        }

        const customer = await prisma.customer.create({
            data: { name, phone, address }
        });

        res.status(201).json(customer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Müşteri oluşturulurken hata çıktı.' });
    }
};

// 2. Müşterileri Listeleme (GET)
export const getCustomers = async (req: Request, res: Response) => {
    try {
        const customers = await prisma.customer.findMany({
            orderBy: { created_at: 'desc' } // En yeni en üstte
        });
        res.status(200).json(customers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Müşteriler getirilemedi.' });
    }
};