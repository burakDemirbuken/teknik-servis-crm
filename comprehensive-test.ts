/**
 * KAPSAMLI API TEST SÜİTİ
 * Teknik Servis CRM - A'dan Z'ye Test
 * 
 * Çalıştırmak için: npx tsx comprehensive-test.ts
 */

const BASE_URL = 'http://localhost:5000/api';
const testEmail = `test${Date.now()}@test.com`;
const testPassword = 'Test123!';

let authToken: string = '';
let adminToken: string = '';
let createdUserId: number = 0;
let createdCustomerId: number = 0;
let createdTicketId: number = 0;
let createdProductTypeId: number = 0;
let createdShelfId: number = 0;

interface TestResult {
  category: string;
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

const results: TestResult[] = [];
let currentCategory = '';

// ============================================
// YARDIMCI FONKSİYONLAR
// ============================================

function setCategory(name: string) {
  currentCategory = name;
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`📁 ${name}`);
  console.log('─'.repeat(50));
}

async function test(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    const duration = Date.now() - start;
    results.push({ category: currentCategory, name, passed: true, message: '✅', duration });
    console.log(`  ✅ ${name} (${duration}ms)`);
  } catch (error: any) {
    const duration = Date.now() - start;
    results.push({ category: currentCategory, name, passed: false, message: error.message, duration });
    console.log(`  ❌ ${name}`);
    console.log(`     └─ ${error.message}`);
  }
}

function expect(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

async function request(endpoint: string, options: RequestInit = {}) {
  const headers: any = { 'Content-Type': 'application/json', ...options.headers };
  
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

async function authRequest(endpoint: string, options: RequestInit = {}, token?: string) {
  const useToken = token || authToken;
  return request(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${useToken}`
    }
  });
}

// ============================================
// 1. HEALTH CHECK
// ============================================

async function healthCheckTests() {
  setCategory('1. HEALTH CHECK');

  await test('API çalışıyor mu?', async () => {
    const response = await fetch(`${BASE_URL.replace('/api', '')}/health`);
    expect(response.status === 200, `Status: ${response.status}`);
  });

  await test('Ana endpoint erişilebilir', async () => {
    const response = await fetch(BASE_URL.replace('/api', ''));
    expect(response.status === 200, `Status: ${response.status}`);
  });
}

// ============================================
// 2. AUTH TESTLERİ
// ============================================

async function authTests() {
  setCategory('2. AUTH SİSTEMİ');

  // Register Tests
  await test('Yeni kullanıcı kaydı', async () => {
    const { response, data } = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: 'Test User'
      })
    });

    expect(response.status === 201, `Status: ${response.status}, Body: ${JSON.stringify(data)}`);
    expect(data.user !== undefined, 'User objesi dönmeli');
    expect(data.user.password === undefined, 'Password response\'da olmamalı');
    createdUserId = data.user.id;
  });

  await test('Aynı email ile tekrar kayıt (hata)', async () => {
    const { response } = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: 'Duplicate'
      })
    });

    expect(response.status === 400, `Status 400 olmalı: ${response.status}`);
  });

  await test('Eksik alanlarla kayıt (hata)', async () => {
    const { response } = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'partial@test.com' })
    });

    expect(response.status >= 400, `Status 4xx olmalı: ${response.status}`);
  });

  await test('Geçersiz email formatı (hata)', async () => {
    const { response } = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid-email',
        password: testPassword,
        name: 'Invalid'
      })
    });

    expect(response.status >= 400, `Status 4xx olmalı: ${response.status}`);
  });

  // Login Tests
  await test('Başarılı login', async () => {
    const { response, data } = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });

    expect(response.status === 200, `Status: ${response.status}`);
    expect(data.token !== undefined, 'Token dönmeli');
    expect(data.token.length > 50, 'Token yeterince uzun olmalı');
    authToken = data.token;
  });

  await test('Yanlış şifre ile login (hata)', async () => {
    const { response } = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: 'wrong-password'
      })
    });

    expect(response.status === 401, `Status 401 olmalı: ${response.status}`);
  });

  await test('Olmayan kullanıcı ile login (hata)', async () => {
    const { response } = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'nonexistent@test.com',
        password: testPassword
      })
    });

    expect(response.status === 401, `Status 401 olmalı: ${response.status}`);
  });

  await test('Admin login', async () => {
    const { response, data } = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@servis.com',
        password: 'admin123'
      })
    });

    expect(response.status === 200, `Status: ${response.status}`);
    adminToken = data.token;
  });

  await test('Token formatı (JWT)', async () => {
    const parts = authToken.split('.');
    expect(parts.length === 3, 'JWT 3 parçadan oluşmalı');
  });

  await test('Token payload doğru', async () => {
    const parts = authToken.split('.');
    const payload = JSON.parse(atob(parts[1]));
    expect(payload.userId !== undefined, 'userId olmalı');
    expect(payload.email === testEmail, 'Email eşleşmeli');
  });
}

// ============================================
// 3. ROUTE PROTECTION TESTLERİ
// ============================================

async function routeProtectionTests() {
  setCategory('3. ROUTE PROTECTION');

  await test('Token olmadan customers erişimi (401)', async () => {
    const { response } = await request('/customers');
    expect(response.status === 401, `Status 401 olmalı: ${response.status}`);
  });

  await test('Token olmadan tickets erişimi (401)', async () => {
    const { response } = await request('/tickets');
    expect(response.status === 401, `Status 401 olmalı: ${response.status}`);
  });

  await test('Token olmadan settings erişimi (401)', async () => {
    const { response } = await request('/settings/product-types');
    expect(response.status === 401, `Status 401 olmalı: ${response.status}`);
  });

  await test('Geçersiz token ile erişim (401)', async () => {
    const { response } = await authRequest('/customers', {}, 'invalid-token');
    expect(response.status === 401, `Status 401 olmalı: ${response.status}`);
  });

  await test('Bozuk JWT ile erişim (401)', async () => {
    const { response } = await authRequest('/customers', {}, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.invalid');
    expect(response.status === 401, `Status 401 olmalı: ${response.status}`);
  });

  await test('Geçerli token ile customers erişimi (200)', async () => {
    const { response } = await authRequest('/customers');
    expect(response.status === 200, `Status 200 olmalı: ${response.status}`);
  });

  await test('Auth endpoint\'leri public (register)', async () => {
    const { response } = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: `public${Date.now()}@test.com`,
        password: testPassword,
        name: 'Public Test'
      })
    });
    expect(response.status === 201, 'Register public olmalı');
  });
}

// ============================================
// 4. SETTINGS (ProductType & Shelf) TESTLERİ
// ============================================

async function settingsTests() {
  setCategory('4. SETTINGS (ProductType & Shelf)');

  // ProductType Tests
  await test('ProductType oluştur', async () => {
    const { response, data } = await authRequest('/settings/product-types', {
      method: 'POST',
      body: JSON.stringify({ type: `TestType${Date.now()}` })
    });

    expect(response.status === 201, `Status: ${response.status}, Body: ${JSON.stringify(data)}`);
    createdProductTypeId = data.id;
  });

  await test('ProductType listele', async () => {
    const { response, data } = await authRequest('/settings/product-types');
    expect(response.status === 200, `Status: ${response.status}`);
    expect(Array.isArray(data), 'Array dönmeli');
  });

  await test('Aynı isimle ProductType (hata)', async () => {
    const uniqueType = `UniqueType${Date.now()}`;
    await authRequest('/settings/product-types', {
      method: 'POST',
      body: JSON.stringify({ type: uniqueType })
    });

    const { response } = await authRequest('/settings/product-types', {
      method: 'POST',
      body: JSON.stringify({ type: uniqueType })
    });

    expect(response.status >= 400, 'Duplicate hata vermeli');
  });

  // Shelf Tests
  await test('Shelf oluştur', async () => {
    const zone = `Zone${Date.now()}`;
    const { response, data } = await authRequest('/settings/shelves', {
      method: 'POST',
      body: JSON.stringify({ zone, row: 1 })
    });

    expect(response.status === 201, `Status: ${response.status}, Body: ${JSON.stringify(data)}`);
    createdShelfId = data.id;
  });

  await test('Shelf listele', async () => {
    const { response, data } = await authRequest('/settings/shelves');
    expect(response.status === 200, `Status: ${response.status}`);
    expect(Array.isArray(data), 'Array dönmeli');
  });
}

// ============================================
// 5. CUSTOMER TESTLERİ
// ============================================

async function customerTests() {
  setCategory('5. CUSTOMER CRUD');

  await test('Customer oluştur', async () => {
    const { response, data } = await authRequest('/customers', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Ahmet',
        surname: 'Yılmaz',
        phone: '555-0123',
        address: 'İstanbul'
      })
    });

    expect(response.status === 201, `Status: ${response.status}, Body: ${JSON.stringify(data)}`);
    expect(data.id !== undefined, 'Customer ID dönmeli');
    createdCustomerId = data.id;
  });

  await test('Customer audit trail kontrolü', async () => {
    const { response, data } = await authRequest(`/customers`);
    const customer = data.find((c: any) => c.id === createdCustomerId);
    
    expect(customer !== undefined, 'Customer bulunmalı');
    expect(customer.created_by !== undefined, 'created_by olmalı');
    expect(customer.creator !== undefined, 'creator relation olmalı');
  });

  await test('Customer listele', async () => {
    const { response, data } = await authRequest('/customers');
    expect(response.status === 200, `Status: ${response.status}`);
    expect(Array.isArray(data), 'Array dönmeli');
    expect(data.length > 0, 'En az 1 customer olmalı');
  });

  await test('Eksik alanlarla customer oluştur (hata)', async () => {
    const { response } = await authRequest('/customers', {
      method: 'POST',
      body: JSON.stringify({ name: 'Only Name' })
    });

    expect(response.status >= 400, 'Validation hatası olmalı');
  });

  await test('Customer güncelle', async () => {
    const { response, data } = await authRequest(`/customers/${createdCustomerId}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Ahmet Updated',
        surname: 'Yılmaz',
        phone: '555-9999'
      })
    });

    expect(response.status === 200, `Status: ${response.status}`);
  });
}

// ============================================
// 6. TICKET TESTLERİ
// ============================================

async function ticketTests() {
  setCategory('6. TICKET CRUD');

  await test('Ticket oluştur', async () => {
    const { response, data } = await authRequest('/tickets', {
      method: 'POST',
      body: JSON.stringify({
        customerId: createdCustomerId,
        issue_description: 'Ekran kırık',
        products: [{
          productTypeId: createdProductTypeId,
          shelfId: createdShelfId,
          model: 'iPhone 15',
          brand: 'Apple',
          price: 500,
          description: 'Ekran değişimi gerekli'
        }]
      })
    });

    expect(response.status === 201, `Status: ${response.status}, Body: ${JSON.stringify(data)}`);
    expect(data.id !== undefined, 'Ticket ID dönmeli');
    expect(data.products.length > 0, 'Products dönmeli');
    createdTicketId = data.id;
  });

  await test('Ticket audit trail kontrolü', async () => {
    const { response, data } = await authRequest('/tickets');
    const ticket = data.find((t: any) => t.id === createdTicketId);
    
    expect(ticket !== undefined, 'Ticket bulunmalı');
    expect(ticket.created_by !== undefined, 'created_by olmalı');
  });

  await test('Ticket listele', async () => {
    const { response, data } = await authRequest('/tickets');
    expect(response.status === 200, `Status: ${response.status}`);
    expect(Array.isArray(data), 'Array dönmeli');
    expect(data.length > 0, 'En az 1 ticket olmalı');
  });

  await test('Ticket customer relation kontrolü', async () => {
    const { response, data } = await authRequest('/tickets');
    const ticket = data.find((t: any) => t.id === createdTicketId);
    expect(ticket.customer !== undefined, 'Customer relation olmalı');
    expect(ticket.customer.id === createdCustomerId, 'Customer ID eşleşmeli');
  });

  await test('Ticket kapat', async () => {
    const { response, data } = await authRequest(`/tickets/${createdTicketId}/close`, {
      method: 'PUT',
      body: JSON.stringify({ total_price: 750 })
    });

    expect(response.status === 200, `Status: ${response.status}`);
    expect(data.ticketStatus === 'CLOSED', 'Status CLOSED olmalı');
    expect(data.closed_at !== null, 'closed_at dolu olmalı');
  });

  await test('Olmayan customer ile ticket (hata)', async () => {
    const { response } = await authRequest('/tickets', {
      method: 'POST',
      body: JSON.stringify({
        customerId: 999999,
        issue_description: 'Test',
        products: [{
          productTypeId: createdProductTypeId,
          shelfId: createdShelfId,
          model: 'Test',
          brand: 'Test'
        }]
      })
    });

    expect(response.status >= 400, 'Hata dönmeli');
  });

  await test('Ürünsüz ticket (hata)', async () => {
    const { response } = await authRequest('/tickets', {
      method: 'POST',
      body: JSON.stringify({
        customerId: createdCustomerId,
        issue_description: 'Test',
        products: []
      })
    });

    expect(response.status >= 400, 'En az 1 ürün gerekli');
  });
}

// ============================================
// 7. PRODUCT TESTLERİ
// ============================================

async function productTests() {
  setCategory('7. PRODUCT İŞLEMLERİ');

  await test('Product listele', async () => {
    const { response, data } = await authRequest('/products');
    expect(response.status === 200, `Status: ${response.status}`);
    expect(Array.isArray(data), 'Array dönmeli');
  });

  await test('Product durumu güncelle', async () => {
    // Önce bir product bul
    const { data: products } = await authRequest('/products');
    if (products.length > 0) {
      const productId = products[0].id;
      const { response } = await authRequest(`/products/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'IN_REPAIR' })
      });
      expect(response.status === 200, `Status: ${response.status}`);
    }
  });
}

// ============================================
// 8. EDGE CASE TESTLERİ
// ============================================

async function edgeCaseTests() {
  setCategory('8. EDGE CASES');

  await test('Olmayan endpoint (404)', async () => {
    const { response } = await authRequest('/nonexistent-endpoint');
    expect(response.status === 404, `Status 404 olmalı: ${response.status}`);
  });

  await test('Geçersiz JSON body', async () => {
    const response = await fetch(`${BASE_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: '{"invalid json'
    });
    expect(response.status >= 400, 'Bad request olmalı');
  });

  await test('Çok uzun string (500+ karakter)', async () => {
    const longName = 'a'.repeat(500);
    const { response } = await authRequest('/customers', {
      method: 'POST',
      body: JSON.stringify({
        name: longName,
        surname: 'Test',
        phone: '555-0000'
      })
    });
    // Kabul edilebilir veya reddedilebilir
    expect(response.status === 201 || response.status >= 400, `Response: ${response.status}`);
  });

  await test('SQL Injection denemesi', async () => {
    const { response } = await authRequest('/customers', {
      method: 'POST',
      body: JSON.stringify({
        name: "'; DROP TABLE customers; --",
        surname: 'Hacker',
        phone: '555-0000'
      })
    });
    // Prisma SQL injection koruması var, crash olmamalı
    expect(response.status !== 500 || response.status === 201, 'SQL injection crash yaratmamalı');
  });

  await test('XSS denemesi', async () => {
    const { response } = await authRequest('/customers', {
      method: 'POST',
      body: JSON.stringify({
        name: '<script>alert("xss")</script>',
        surname: 'XSS',
        phone: '555-0000'
      })
    });
    expect(response.status === 201 || response.status >= 400, 'XSS ya kabul edilmeli ya reddedilmeli');
  });

  await test('Unicode karakterler', async () => {
    const { response, data } = await authRequest('/customers', {
      method: 'POST',
      body: JSON.stringify({
        name: '日本語テスト',
        surname: 'Тест',
        phone: '555-0000',
        address: '🏠 Emoji Adres 中文'
      })
    });
    expect(response.status === 201, 'Unicode desteklenmeli');
  });

  await test('Negatif fiyat', async () => {
    const { response } = await authRequest('/tickets', {
      method: 'POST',
      body: JSON.stringify({
        customerId: createdCustomerId,
        issue_description: 'Test',
        products: [{
          productTypeId: createdProductTypeId,
          shelfId: createdShelfId,
          model: 'Test',
          brand: 'Test',
          price: -100
        }]
      })
    });
    // Negatif fiyat kabul edilmemeli idealde
    console.log(`     └─ Info: Negatif fiyat ${response.status === 201 ? 'kabul edildi (düzelt!)' : 'reddedildi ✓'}`);
  });
}

// ============================================
// 9. PERFORMANS TESTLERİ
// ============================================

async function performanceTests() {
  setCategory('9. PERFORMANS');

  await test('Login response süresi < 3000ms', async () => {
    const start = Date.now();
    await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });
    const duration = Date.now() - start;
    expect(duration < 3000, `${duration}ms sürdü`);
    console.log(`     └─ Süre: ${duration}ms`);
  });

  await test('Customer listesi < 3000ms', async () => {
    const start = Date.now();
    await authRequest('/customers');
    const duration = Date.now() - start;
    expect(duration < 3000, `${duration}ms sürdü`);
    console.log(`     └─ Süre: ${duration}ms`);
  });

  await test('10 ardışık istek', async () => {
    const start = Date.now();
    for (let i = 0; i < 10; i++) {
      await authRequest('/customers');
    }
    const duration = Date.now() - start;
    const avg = duration / 10;
    console.log(`     └─ Toplam: ${duration}ms, Ortalama: ${avg.toFixed(0)}ms`);
  });
}

// ============================================
// 10. LOGGER TESTİ
// ============================================

async function loggerTests() {
  setCategory('10. LOGGER & MIDDLEWARE');

  await test('Logger çalışıyor (istek yapıldığında log)', async () => {
    // Bu test sadece isteğin başarılı olduğunu doğrular
    // Log çıktısı container loglarında görülür
    const { response } = await authRequest('/customers');
    expect(response.status === 200, 'İstek başarılı olmalı');
    console.log(`     └─ Info: Log çıktısı için: make log-backend`);
  });
}

// ============================================
// SONUÇ RAPORU
// ============================================

function printReport() {
  console.log('\n' + '═'.repeat(50));
  console.log('📊 TEST RAPORU');
  console.log('═'.repeat(50));

  const categories = [...new Set(results.map(r => r.category))];
  
  categories.forEach(category => {
    const categoryResults = results.filter(r => r.category === category);
    const passed = categoryResults.filter(r => r.passed).length;
    const total = categoryResults.length;
    const icon = passed === total ? '✅' : passed > total * 0.7 ? '⚠️' : '❌';
    
    console.log(`\n${icon} ${category}: ${passed}/${total}`);
  });

  const totalPassed = results.filter(r => r.passed).length;
  const totalTests = results.length;
  const percentage = Math.round((totalPassed / totalTests) * 100);

  console.log('\n' + '═'.repeat(50));
  console.log(`\n🎯 TOPLAM: ${totalPassed}/${totalTests} (${percentage}%)`);
  console.log('═'.repeat(50));

  if (percentage === 100) {
    console.log('\n🎉 MÜKEMMEL! Tüm testler geçti!\n');
  } else if (percentage >= 90) {
    console.log('\n✅ ÇOK İYİ! Küçük düzeltmeler gerekli.\n');
  } else if (percentage >= 70) {
    console.log('\n⚠️ İYİ! Bazı testler başarısız.\n');
  } else {
    console.log('\n❌ DİKKAT! Önemli sorunlar var.\n');
  }

  // Başarısız testleri listele
  const failed = results.filter(r => !r.passed);
  if (failed.length > 0) {
    console.log('❌ BAŞARISIZ TESTLER:');
    console.log('─'.repeat(50));
    failed.forEach(f => {
      console.log(`  • [${f.category}] ${f.name}`);
      console.log(`    └─ ${f.message}`);
    });
    console.log('');
  }

  // İstatistikler
  const totalDuration = results.reduce((acc, r) => acc + r.duration, 0);
  console.log('📈 İSTATİSTİKLER:');
  console.log('─'.repeat(50));
  console.log(`  • Toplam test: ${totalTests}`);
  console.log(`  • Başarılı: ${totalPassed}`);
  console.log(`  • Başarısız: ${failed.length}`);
  console.log(`  • Toplam süre: ${totalDuration}ms`);
  console.log(`  • Ortalama süre: ${Math.round(totalDuration / totalTests)}ms`);
  console.log('');
}

// ============================================
// ANA FONKSİYON
// ============================================

async function runAllTests() {
  console.log('\n' + '═'.repeat(50));
  console.log('🧪 KAPSAMLI API TEST SÜİTİ');
  console.log('═'.repeat(50));
  console.log(`📧 Test User: ${testEmail}`);
  console.log(`🌐 API URL: ${BASE_URL}`);
  console.log(`📅 Tarih: ${new Date().toLocaleString('tr-TR')}`);

  try {
    // Testleri sırayla çalıştır
    await healthCheckTests();
    await authTests();
    await routeProtectionTests();
    await settingsTests();
    await customerTests();
    await ticketTests();
    await productTests();
    await edgeCaseTests();
    await performanceTests();
    await loggerTests();
    
  } catch (error: any) {
    console.log(`\n💥 KRİTİK HATA: ${error.message}`);
    console.log(error.stack);
  }

  printReport();
}

// Çalıştır
runAllTests();
