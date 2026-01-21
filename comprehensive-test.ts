// comprehensive-test.ts
// Çalıştırmak için: npx tsx comprehensive-test.ts

const BASE_URL = 'http://localhost:5000/api';

// --- TEST MOTORU ---
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    blue: "\x1b[36m",
    cyan: "\x1b[96m"
};

function printSection(title: string) {
    console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.cyan}${title}${colors.reset}`);
    console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
}

async function runTest(description: string, testFn: () => Promise<void>) {
    totalTests++;
    process.stdout.write(`${colors.blue}[TEST ${totalTests}]${colors.reset} ${description}... `);
    try {
        await testFn();
        console.log(`${colors.green}PASSED ✓${colors.reset}`);
        passedTests++;
    } catch (error: any) {
        console.log(`${colors.red}FAILED ✗${colors.reset}`);
        console.error(`${colors.red}    -> Hata Sebebi: ${error.message}${colors.reset}`);
        if (error.cause) console.error("    -> Detay:", JSON.stringify(error.cause));
        failedTests++;
    }
}

// İstek Yardımcısı
async function request(endpoint: string, method: string, body?: any, expectedStatus: number = 200) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
    });

    const data = await res.json().catch(() => ({}));

    if (res.status !== expectedStatus) {
        throw new Error(`Beklenen Status: ${expectedStatus}, Gelen: ${res.status}`, { cause: data });
    }
    return data;
}

// --- SENARYOLAR ---

async function main() {
    console.log(`\n${colors.yellow}🚀 GENİŞLETİLMİŞ KAPSAMLI API TEST SENARYOSU BAŞLIYOR...${colors.reset}\n`);

    let shelfId: number, shelfId2: number;
    let typeId: number, typeId2: number;
    let customerId: number, customerId2: number;
    let ticketId: number, ticketId2: number;
    let productId: number;
    const randomSuffix = Math.floor(Math.random() * 9999);

    // ========================================
    // BÖLÜM 1: RAF İŞLEMLERİ (SHELVES)
    // ========================================
    printSection("BÖLÜM 1: RAF İŞLEMLERİ (SHELVES)");
    
    await runTest("Raf Oluşturma (Normal)", async () => {
        const res = await request('/settings/shelves', 'POST', { zone: `Z${randomSuffix}`, row: 1 }, 201);
        shelfId = res.id;
        if (!res.zone || !res.row) throw new Error("Eksik alan döndü");
    });

    await runTest("İkinci Raf Oluşturma (Farklı Row)", async () => {
        const res = await request('/settings/shelves', 'POST', { zone: `Z${randomSuffix}`, row: 2 }, 201);
        shelfId2 = res.id;
    });

    await runTest("Aynı Rafı Tekrar Oluşturma (Duplicate - 409)", async () => {
        await request('/settings/shelves', 'POST', { zone: `Z${randomSuffix}`, row: 1 }, 409);
    });

    await runTest("Eksik Zone ile Raf Oluşturma (400)", async () => {
        await request('/settings/shelves', 'POST', { row: 1 }, 400);
    });

    await runTest("Eksik Row ile Raf Oluşturma (400)", async () => {
        await request('/settings/shelves', 'POST', { zone: "Zone-Bad" }, 400);
    });

    await runTest("Negatif Row ile Raf Oluşturma (400)", async () => {
        await request('/settings/shelves', 'POST', { zone: "Zone-X", row: -1 }, 400);
    });

    await runTest("Sıfır Row ile Raf Oluşturma (400)", async () => {
        await request('/settings/shelves', 'POST', { zone: "Zone-Y", row: 0 }, 400);
    });

    await runTest("Rafları Listeleme (GET)", async () => {
        const res = await request('/settings/shelves', 'GET', undefined, 200);
        if (!Array.isArray(res)) throw new Error("Array dönmedi");
        if (res.length < 2) throw new Error("En az 2 raf olmalı");
    });

    await runTest("Aynı Zone Farklı Row'larla Raf Oluşturma", async () => {
        const testZone = `Multi-${randomSuffix}`;
        for (let i = 1; i <= 3; i++) {
            await request('/settings/shelves', 'POST', { zone: testZone, row: i }, 201);
        }
    });

    // ========================================
    // BÖLÜM 2: ÜRÜN TİPİ İŞLEMLERİ
    // ========================================
    printSection("BÖLÜM 2: ÜRÜN TİPİ İŞLEMLERİ (PRODUCT TYPES)");

    await runTest("Ürün Tipi Oluşturma (Normal)", async () => {
        const res = await request('/settings/product-types', 'POST', { type: `Type-${randomSuffix}` }, 201);
        typeId = res.id;
        if (!res.type) throw new Error("Type alanı eksik");
    });

    await runTest("İkinci Ürün Tipi Oluşturma", async () => {
        const res = await request('/settings/product-types', 'POST', { type: `Type2-${randomSuffix}` }, 201);
        typeId2 = res.id;
    });

    await runTest("Boş Type ile Ürün Tipi Oluşturma (400)", async () => {
        await request('/settings/product-types', 'POST', { type: "" }, 400);
    });

    await runTest("Type Olmadan Ürün Tipi Oluşturma (400)", async () => {
        await request('/settings/product-types', 'POST', {}, 400);
    });

    await runTest("Ürün Tiplerini Listeleme (GET)", async () => {
        const res = await request('/settings/product-types', 'GET', undefined, 200);
        if (!Array.isArray(res)) throw new Error("Array dönmedi");
        if (res.length < 2) throw new Error("En az 2 tip olmalı");
    });

    await runTest("Whitespace Temizleme Testi", async () => {
        const res = await request('/settings/product-types', 'POST', { type: `   WS-${randomSuffix}   ` }, 201);
        if (res.type !== `WS-${randomSuffix}`) throw new Error("Whitespace temizlenmedi");
    });

    // ========================================
    // BÖLÜM 3: MÜŞTERİ İŞLEMLERİ
    // ========================================
    printSection("BÖLÜM 3: MÜŞTERİ İŞLEMLERİ (CUSTOMERS)");

    await runTest("Müşteri Oluşturma (Normal)", async () => {
        const res = await request('/customers', 'POST', {
            name: "Ali",
            surname: "Veli",
            phone: "5551112233"
        }, 201);
        customerId = res.id;
    });

    await runTest("İkinci Müşteri Oluşturma (Adresli)", async () => {
        const res = await request('/customers', 'POST', {
            name: "Ayşe",
            surname: "Yılmaz",
            phone: "5559998877",
            address: "Test Mahallesi, Test Sokak No:1"
        }, 201);
        customerId2 = res.id;
    });

    await runTest("İsimsiz Müşteri Oluşturma (400)", async () => {
        await request('/customers', 'POST', {
            surname: "Veli",
            phone: "5551112233"
        }, 400);
    });

    await runTest("Soyadsız Müşteri Oluşturma (400)", async () => {
        await request('/customers', 'POST', {
            name: "Mehmet",
            phone: "5551234567"
        }, 400);
    });

    await runTest("Telefonsuz Müşteri Oluşturma (400)", async () => {
        await request('/customers', 'POST', {
            name: "Fatma",
            surname: "Demir"
        }, 400);
    });

    await runTest("Müşterileri Listeleme (GET)", async () => {
        const res = await request('/customers', 'GET', undefined, 200);
        if (!Array.isArray(res)) throw new Error("Array dönmedi");
        if (res.length < 2) throw new Error("En az 2 müşteri olmalı");
    });

    await runTest("Türkçe Karakterlerle Müşteri Oluşturma", async () => {
        const res = await request('/customers', 'POST', {
            name: "Şükrü",
            surname: "Çağlar",
            phone: "5551234567",
            address: "İstanbul, Üsküdar"
        }, 201);
        if (!res.id) throw new Error("Türkçe karakter sorunu");
    });

    await runTest("Özel Karakterlerle Müşteri Oluşturma", async () => {
        const res = await request('/customers', 'POST', {
            name: "Ali-Can",
            surname: "Öz'çelik",
            phone: "5551234444",
            address: "Atatürk Cad. No:42/A"
        }, 201);
        if (!res.id) throw new Error("Müşteri oluşturulamadı");
    });

    // ========================================
    // BÖLÜM 4: FİŞ İŞLEMLERİ
    // ========================================
    printSection("BÖLÜM 4: FİŞ İŞLEMLERİ (TICKETS)");

    await runTest("Fiş Oluşturma (Normal)", async () => {
        const res = await request('/tickets', 'POST', {
            customerId: customerId,
            issue_description: "Test Arıza",
            products: [{
                productTypeId: typeId,
                shelfId: shelfId,
                model: "TestModel",
                brand: "TestBrand"
            }]
        }, 201);
        ticketId = res.id;
        productId = res.products[0].id;
    });

    await runTest("Çoklu Ürünlü Fiş Oluşturma", async () => {
        const res = await request('/tickets', 'POST', {
            customerId: customerId2,
            issue_description: "Ekran kırık, batarya şişmiş",
            products: [
                {
                    productTypeId: typeId,
                    shelfId: shelfId,
                    model: "iPhone 13",
                    brand: "Apple",
                    description: "Ekran değişimi gerekli"
                },
                {
                    productTypeId: typeId2,
                    shelfId: shelfId2,
                    model: "iPad Air",
                    brand: "Apple",
                    description: "Batarya değişimi"
                }
            ]
        }, 201);
        ticketId2 = res.id;
        if (res.products.length !== 2) throw new Error("2 ürün olmalıydı");
    });

    await runTest("Ürün Listesi Boş Fiş Oluşturma (400)", async () => {
        await request('/tickets', 'POST', {
            customerId: customerId,
            products: []
        }, 400);
    });

    await runTest("Model Olmadan Fiş Oluşturma (400)", async () => {
        await request('/tickets', 'POST', {
            customerId: customerId,
            products: [{
                productTypeId: typeId,
                shelfId: shelfId,
                brand: "TestBrand"
            }]
        }, 400);
    });

    await runTest("Brand Olmadan Fiş Oluşturma (400)", async () => {
        await request('/tickets', 'POST', {
            customerId: customerId,
            products: [{
                productTypeId: typeId,
                shelfId: shelfId,
                model: "TestModel"
            }]
        }, 400);
    });

    await runTest("Fişleri Listeleme (GET)", async () => {
        const res = await request('/tickets', 'GET', undefined, 200);
        if (!Array.isArray(res)) throw new Error("Array dönmedi");
        if (res.length < 2) throw new Error("En az 2 fiş olmalı");
        if (!res[0].customer || !res[0].products) {
            throw new Error("İlişkili veriler dönmedi");
        }
    });

    await runTest("Açıklama Olmadan Fiş Oluşturma", async () => {
        const res = await request('/tickets', 'POST', {
            customerId: customerId,
            products: [{
                productTypeId: typeId,
                shelfId: shelfId,
                model: "NoDesc",
                brand: "NoDesc"
            }]
        }, 201);
        if (!res.id) throw new Error("Fiş oluşmadı");
    });

    await runTest("10 Ürünlü Dev Fiş Oluşturma", async () => {
        const products = [];
        for (let i = 0; i < 10; i++) {
            products.push({
                productTypeId: i % 2 === 0 ? typeId : typeId2,
                shelfId: i % 2 === 0 ? shelfId : shelfId2,
                model: `Product-${i}`,
                brand: `Brand-${i}`,
                description: `Description ${i}`
            });
        }
        
        const res = await request('/tickets', 'POST', {
            customerId: customerId,
            issue_description: "10 ürünlü toplu tamir",
            products: products
        }, 201);
        
        if (res.products.length !== 10) throw new Error("10 ürün olmalıydı");
    });

    await runTest("Çok Uzun Açıklama ile Fiş", async () => {
        const longDesc = "A".repeat(1000);
        const res = await request('/tickets', 'POST', {
            customerId: customerId,
            issue_description: longDesc,
            products: [{
                productTypeId: typeId,
                shelfId: shelfId,
                model: "LongDesc",
                brand: "LongDesc"
            }]
        }, 201);
        if (res.issue_description.length !== 1000) throw new Error("Uzun açıklama kaydedilmedi");
    });

    // ========================================
    // BÖLÜM 5: ÜRÜN GÜNCELLEME İŞLEMLERİ
    // ========================================
    printSection("BÖLÜM 5: ÜRÜN GÜNCELLEME İŞLEMLERİ (PRODUCTS)");

    await runTest("Ürün Durumunu Güncelleme (IN_REPAIR)", async () => {
        await request(`/products/${productId}`, 'PATCH', { 
            status: 'IN_REPAIR',
            description: "Tamire başlandı"
        }, 200);
    });

    await runTest("Olmayan Ürünü Güncelleme (404)", async () => {
        await request(`/products/999999`, 'PATCH', { 
            status: 'IN_REPAIR'
        }, 404);
    });

    await runTest("Geçersiz Status Gönderme (400)", async () => {
        await request(`/products/${productId}`, 'PATCH', { 
            status: 'INVALID_STATUS'
        }, 400);
    });

    await runTest("Tüm Status'leri Test - RECEIVED", async () => {
        await request(`/products/${productId}`, 'PATCH', { status: 'RECEIVED' }, 200);
    });

    await runTest("Tüm Status'leri Test - WAITING_PARTS", async () => {
        await request(`/products/${productId}`, 'PATCH', { status: 'WAITING_PARTS' }, 200);
    });

    await runTest("Tüm Status'leri Test - COMPLETED", async () => {
        await request(`/products/${productId}`, 'PATCH', { status: 'COMPLETED' }, 200);
    });

    await runTest("Tüm Status'leri Test - DELIVERED", async () => {
        await request(`/products/${productId}`, 'PATCH', { status: 'DELIVERED' }, 200);
    });

    await runTest("Tüm Status'leri Test - CANCELLED", async () => {
        await request(`/products/${productId}`, 'PATCH', { status: 'CANCELLED' }, 200);
    });

    await runTest("Ürün Fiyatı Güncelleme", async () => {
        const res = await request(`/products/${productId}`, 'PATCH', { 
            price: 1500.50
        }, 200);
        if (Number(res.price) !== 1500.50) throw new Error("Fiyat güncellenmedi");
    });

    await runTest("Negatif Fiyat Güncelleme (400)", async () => {
        await request(`/products/${productId}`, 'PATCH', { 
            price: -100
        }, 400);
    });

    await runTest("Ürün Model ve Brand Güncelleme", async () => {
        const res = await request(`/products/${productId}`, 'PATCH', { 
            model: "Updated Model",
            brand: "Updated Brand"
        }, 200);
        if (res.model !== "Updated Model") throw new Error("Model güncellenmedi");
        if (res.brand !== "Updated Brand") throw new Error("Brand güncellenmedi");
    });

    await runTest("Çoklu Alan Güncelleme", async () => {
        const res = await request(`/products/${productId}`, 'PATCH', { 
            status: 'IN_REPAIR',
            description: "Yeni açıklama",
            price: 2000,
            model: "Final Model",
            brand: "Final Brand"
        }, 200);
        if (res.status !== 'IN_REPAIR') throw new Error("Status güncellenmedi");
    });

    // ========================================
    // BÖLÜM 6: FİŞ KAPATMA İŞLEMLERİ
    // ========================================
    printSection("BÖLÜM 6: FİŞ KAPATMA İŞLEMLERİ (CLOSE TICKETS)");

    await runTest("Negatif Fiyat ile Fiş Kapatma (400)", async () => {
        await request(`/tickets/${ticketId}/close`, 'PATCH', { 
            total_price: -500
        }, 400);
    });

    await runTest("Fiş Kapatma (Normal)", async () => {
        const res = await request(`/tickets/${ticketId}/close`, 'PATCH', { 
            total_price: 1500
        }, 200);
        if (!res.closed_at) throw new Error("closed_at set edilmeli");
        if (res.ticketStatus !== 'CLOSED') throw new Error("Status CLOSED olmalı");
    });

    await runTest("Sıfır Fiyatla Fiş Kapatma", async () => {
        const res = await request(`/tickets/${ticketId2}/close`, 'PATCH', { 
            total_price: 0
        }, 200);
        if (Number(res.total_price) !== 0) throw new Error("Fiyat 0 olmalıydı");
    });

    await runTest("Olmayan Fiş Kapatma (404)", async () => {
        await request(`/tickets/999999/close`, 'PATCH', { 
            total_price: 1000
        }, 404);
    });

    await runTest("Total Price Olmadan Kapatma (400)", async () => {
        const newTicket = await request('/tickets', 'POST', {
            customerId: customerId,
            products: [{
                productTypeId: typeId,
                shelfId: shelfId,
                model: "CloseTest",
                brand: "CloseTest"
            }]
        }, 201);
        
        await request(`/tickets/${newTicket.id}/close`, 'PATCH', {}, 400);
    });

    await runTest("Ondalıklı Fiyatla Fiş Kapatma", async () => {
        const decimalTicket = await request('/tickets', 'POST', {
            customerId: customerId,
            products: [{
                productTypeId: typeId,
                shelfId: shelfId,
                model: "Decimal",
                brand: "Decimal"
            }]
        }, 201);
        
        const res = await request(`/tickets/${decimalTicket.id}/close`, 'PATCH', { 
            total_price: 1234.56
        }, 200);
        if (Number(res.total_price) !== 1234.56) throw new Error("Ondalık fiyat hatalı");
    });

    // ========================================
    // BÖLÜM 7: STRES VE EDGE CASE TESTLERİ
    // ========================================
    printSection("BÖLÜM 7: STRES VE EDGE CASE TESTLERİ");

    await runTest("Concurrent Ürün Tipi Oluşturma", async () => {
        const promises = [];
        for (let i = 0; i < 5; i++) {
            promises.push(
                fetch(`${BASE_URL}/settings/product-types`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: `Concurrent-${randomSuffix}-${i}` })
                })
            );
        }
        const results = await Promise.all(promises);
        const successCount = results.filter(r => r.status === 201).length;
        if (successCount !== 5) throw new Error(`5 başarılı olmalıydı, ${successCount} oldu`);
    });

    await runTest("Boş String vs Null Testi", async () => {
        const res = await request('/tickets', 'POST', {
            customerId: customerId,
            issue_description: "",
            products: [{
                productTypeId: typeId,
                shelfId: shelfId,
                model: "EmptyDesc",
                brand: "EmptyDesc",
                description: ""
            }]
        }, 201);
        if (!res.id) throw new Error("Boş string kabul edilmeliydi");
    });

    // ========================================
    // RAPORLAMA
    // ========================================
    printSection("TEST SONUÇLARI");
    console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
    console.log(` TOPLAM TEST : ${totalTests}`);
    console.log(` ${colors.green}BAŞARILI    : ${passedTests}${colors.reset}`);
    
    if (failedTests > 0) {
        console.log(` ${colors.red}BAŞARISIZ   : ${failedTests}${colors.reset}`);
        console.log(` ${colors.yellow}BAŞARI ORANI: ${((passedTests / totalTests) * 100).toFixed(2)}%${colors.reset}`);
        console.log(`\n${colors.red}❌ BAZI TESTLER GEÇEMEDİ!${colors.reset}`);
        process.exit(1);
    } else {
        console.log(`\n${colors.green}✨ HARİKA! ${totalTests} TEST %100 BAŞARILI! ✨${colors.reset}`);
        process.exit(0);
    }
}

main();
