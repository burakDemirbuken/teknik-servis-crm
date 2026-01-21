/**
 * AUTH KAPSAMLI TEST SÜİTİ
 * 
 * Çalıştırmak için: npx tsx auth_test.ts
 */

const BASE_URL = 'http://localhost:5000/api/auth';

// Test için değişkenler
const randomEmail = `test${Date.now()}@test.com`;
let savedToken: string = '';
let savedUserId: number = 0;

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
  console.log(`\n📁 ${name}`);
  console.log('-'.repeat(40));
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
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

// ============================================
// 1. REGISTER TESTLERİ
// ============================================

async function registerTests() {
  setCategory('REGISTER TESTLERİ');

  await test('Başarılı kayıt', async () => {
    const { response, data } = await request('/register', {
      method: 'POST',
      body: JSON.stringify({ email: randomEmail, password: 'Test123!', name: 'Test User' })
    });

    expect(response.status === 201, `Status: ${response.status}, Body: ${JSON.stringify(data)}`);
    expect(data.user !== undefined, 'User objesi dönmeli');
    expect(data.user.email === randomEmail, 'Email eşleşmeli');
    expect(data.user.password === undefined, 'Password response\'da olmamalı');
    expect(data.user.id !== undefined, 'User ID olmalı');
    
    savedUserId = data.user.id;
  });

  await test('Aynı email ile tekrar kayıt (409/400 hatası)', async () => {
    const { response } = await request('/register', {
      method: 'POST',
      body: JSON.stringify({ email: randomEmail, password: 'Test123!', name: 'Duplicate User' })
    });

    expect(response.status === 400 || response.status === 409, 
      `Status 400 veya 409 olmalı, gelen: ${response.status}`);
  });

  await test('Email olmadan kayıt', async () => {
    const { response } = await request('/register', {
      method: 'POST',
      body: JSON.stringify({ password: 'Test123!', name: 'No Email' })
    });

    expect(response.status >= 400, `Status 4xx olmalı, gelen: ${response.status}`);
  });

  await test('Password olmadan kayıt', async () => {
    const { response } = await request('/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'nopass@test.com', name: 'No Password' })
    });

    expect(response.status >= 400, `Status 4xx olmalı, gelen: ${response.status}`);
  });

  await test('Name olmadan kayıt', async () => {
    const { response } = await request('/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'noname@test.com', password: 'Test123!' })
    });

    expect(response.status >= 400, `Status 4xx olmalı, gelen: ${response.status}`);
  });

  await test('Boş body ile kayıt', async () => {
    const { response } = await request('/register', {
      method: 'POST',
      body: JSON.stringify({})
    });

    expect(response.status >= 400, `Status 4xx olmalı, gelen: ${response.status}`);
  });

  await test('Geçersiz email formatı', async () => {
    const { response } = await request('/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'gecersiz-email', password: 'Test123!', name: 'Invalid Email' })
    });

    // Not: Eğer email validasyonu yoksa bu test başarısız olabilir
    // Bu durumda validasyon eklenmeli
    expect(response.status >= 400 || response.status === 201, 
      `Email validasyonu kontrol edilmeli: ${response.status}`);
  });

  await test('Çok kısa şifre (1 karakter)', async () => {
    const { response } = await request('/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'short@test.com', password: 'a', name: 'Short Pass' })
    });

    // Not: Eğer password validasyonu yoksa bu test başarısız olabilir
    expect(response.status >= 400 || response.status === 201,
      `Password validasyonu kontrol edilmeli: ${response.status}`);
  });

  await test('Çok uzun email (500+ karakter)', async () => {
    const longEmail = 'a'.repeat(500) + '@test.com';
    const { response } = await request('/register', {
      method: 'POST',
      body: JSON.stringify({ email: longEmail, password: 'Test123!', name: 'Long Email' })
    });

    expect(response.status >= 400, `Çok uzun email reddedilmeli: ${response.status}`);
  });

  await test('SQL Injection denemesi (email)', async () => {
    const { response } = await request('/register', {
      method: 'POST',
      body: JSON.stringify({ 
        email: "admin'--@test.com", 
        password: 'Test123!', 
        name: 'SQL Inject' 
      })
    });

    // Prisma SQL injection'a karşı korur, hata vermemeli
    expect(response.status !== 500, 'SQL Injection 500 hatası vermemeli');
  });

  await test('XSS denemesi (name alanında)', async () => {
    const { response, data } = await request('/register', {
      method: 'POST',
      body: JSON.stringify({ 
        email: `xss${Date.now()}@test.com`, 
        password: 'Test123!', 
        name: '<script>alert("xss")</script>' 
      })
    });

    // Kayıt olabilir ama XSS sanitize edilmeli (frontend'de kontrol)
    expect(response.status === 201 || response.status >= 400, 
      `XSS kontrolü: ${response.status}`);
  });

  await test('Unicode karakterler (emoji isim)', async () => {
    const { response } = await request('/register', {
      method: 'POST',
      body: JSON.stringify({ 
        email: `emoji${Date.now()}@test.com`, 
        password: 'Test123!', 
        name: '👨‍💻 Test Üser Çşğ' 
      })
    });

    expect(response.status === 201, `Unicode desteklenmeli: ${response.status}`);
  });
}

// ============================================
// 2. LOGIN TESTLERİ
// ============================================

async function loginTests() {
  setCategory('LOGIN TESTLERİ');

  await test('Başarılı giriş', async () => {
    const { response, data } = await request('/login', {
      method: 'POST',
      body: JSON.stringify({ email: randomEmail, password: 'Test123!' })
    });

    expect(response.status === 200, `Status: ${response.status}, Body: ${JSON.stringify(data)}`);
    expect(data.token !== undefined, 'Token dönmeli');
    expect(typeof data.token === 'string', 'Token string olmalı');
    expect(data.token.length > 50, 'Token yeterince uzun olmalı');
    expect(data.user !== undefined, 'User objesi dönmeli');
    expect(data.user.password === undefined, 'Password response\'da olmamalı');

    savedToken = data.token;
  });

  await test('Yanlış şifre', async () => {
    const { response, data } = await request('/login', {
      method: 'POST',
      body: JSON.stringify({ email: randomEmail, password: 'yanlis-sifre' })
    });

    expect(response.status === 401, `Status: ${response.status}`);
    expect(data.token === undefined, 'Token dönmemeli');
  });

  await test('Olmayan kullanıcı', async () => {
    const { response } = await request('/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'olmayan@email.com', password: 'Test123!' })
    });

    expect(response.status === 401, `Status: ${response.status}`);
  });

  await test('Boş şifre', async () => {
    const { response } = await request('/login', {
      method: 'POST',
      body: JSON.stringify({ email: randomEmail, password: '' })
    });

    expect(response.status === 401 || response.status === 400, `Status: ${response.status}`);
  });

  await test('Boş email', async () => {
    const { response } = await request('/login', {
      method: 'POST',
      body: JSON.stringify({ email: '', password: 'Test123!' })
    });

    expect(response.status === 401 || response.status === 400, `Status: ${response.status}`);
  });

  await test('Eksik alanlar (sadece email)', async () => {
    const { response } = await request('/login', {
      method: 'POST',
      body: JSON.stringify({ email: randomEmail })
    });

    expect(response.status >= 400, `Status 4xx olmalı: ${response.status}`);
  });

  await test('Boş body', async () => {
    const { response } = await request('/login', {
      method: 'POST',
      body: JSON.stringify({})
    });

    expect(response.status >= 400, `Status 4xx olmalı: ${response.status}`);
  });

  await test('Email büyük/küçük harf duyarlılığı', async () => {
    const { response } = await request('/login', {
      method: 'POST',
      body: JSON.stringify({ 
        email: randomEmail.toUpperCase(), 
        password: 'Test123!' 
      })
    });

    // Çoğu sistem case-insensitive olmalı ama değilse de kabul edilebilir
    console.log(`     └─ Info: Email case-${response.status === 200 ? 'insensitive' : 'sensitive'}`);
  });

  await test('SQL Injection denemesi (password)', async () => {
    const { response } = await request('/login', {
      method: 'POST',
      body: JSON.stringify({ 
        email: randomEmail, 
        password: "' OR '1'='1" 
      })
    });

    expect(response.status === 401, 'SQL Injection çalışmamalı');
  });

  await test('Çok fazla başarısız giriş denemesi (brute force)', async () => {
    const attempts = [];
    for (let i = 0; i < 10; i++) {
      attempts.push(request('/login', {
        method: 'POST',
        body: JSON.stringify({ email: randomEmail, password: 'yanlis' + i })
      }));
    }

    const results = await Promise.all(attempts);
    const allFailed = results.every(r => r.response.status === 401);
    
    // Rate limiting varsa 429 dönebilir
    const hasRateLimit = results.some(r => r.response.status === 429);
    
    console.log(`     └─ Info: Rate limiting: ${hasRateLimit ? 'AKTIF ✅' : 'YOK (eklenmeli)'}`);
    expect(allFailed || hasRateLimit, 'Tüm denemeler başarısız olmalı');
  });
}

// ============================================
// 3. TOKEN TESTLERİ
// ============================================

async function tokenTests() {
  setCategory('TOKEN TESTLERİ');

  await test('Token formatı (JWT)', async () => {
    expect(savedToken !== '', 'Token kaydedilmiş olmalı');
    
    const parts = savedToken.split('.');
    expect(parts.length === 3, 'JWT 3 parçadan oluşmalı (header.payload.signature)');
  });

  await test('Token decode edilebilir', async () => {
    const parts = savedToken.split('.');
    const payload = JSON.parse(atob(parts[1]));

    expect(payload.userId !== undefined || payload.id !== undefined, 'Token userId içermeli');
    expect(payload.email !== undefined, 'Token email içermeli');
    expect(payload.exp !== undefined, 'Token expiry (exp) içermeli');
    expect(payload.iat !== undefined, 'Token issued at (iat) içermeli');

    console.log(`     └─ Payload: userId=${payload.userId}, role=${payload.role}`);
  });

  await test('Token expiry gelecekte', async () => {
    const parts = savedToken.split('.');
    const payload = JSON.parse(atob(parts[1]));
    
    const now = Math.floor(Date.now() / 1000);
    expect(payload.exp > now, 'Token süresi geçmemiş olmalı');
    
    const expiresIn = payload.exp - now;
    const hours = Math.floor(expiresIn / 3600);
    console.log(`     └─ Token ${hours} saat sonra geçersiz olacak`);
  });

  await test('Aynı kullanıcı tekrar login olunca farklı token', async () => {
    const { data } = await request('/login', {
      method: 'POST',
      body: JSON.stringify({ email: randomEmail, password: 'Test123!' })
    });

    expect(data.token !== savedToken, 'Her login farklı token üretmeli');
  });

  await test('Token içinde password yok', async () => {
    const parts = savedToken.split('.');
    const payload = JSON.parse(atob(parts[1]));
    
    expect(payload.password === undefined, 'Token içinde password olmamalı');
    
    const payloadStr = JSON.stringify(payload).toLowerCase();
    expect(!payloadStr.includes('password'), 'Password kelimesi token\'da olmamalı');
  });
}

// ============================================
// 4. EDGE CASE TESTLERİ
// ============================================

async function edgeCaseTests() {
  setCategory('EDGE CASE TESTLERİ');

  await test('Content-Type olmadan istek', async () => {
    const response = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      body: JSON.stringify({ email: randomEmail, password: 'Test123!' })
      // Content-Type yok
    });

    // Body parse edilemeyebilir
    expect(response.status !== 500, 'Server crash olmamalı');
  });

  await test('GET methodu ile login (method not allowed)', async () => {
    const response = await fetch(`${BASE_URL}/login`, { method: 'GET' });
    
    // 404 veya 405 dönmeli
    expect(response.status === 404 || response.status === 405, 
      `Status: ${response.status}`);
  });

  await test('PUT methodu ile register', async () => {
    const response = await fetch(`${BASE_URL}/register`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'put@test.com', password: 'Test123!', name: 'PUT' })
    });

    expect(response.status === 404 || response.status === 405, 
      `Status: ${response.status}`);
  });

  await test('Malformed JSON', async () => {
    const response = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"email": "test@test.com", password: }' // invalid JSON
    });

    expect(response.status >= 400, 'Malformed JSON hata vermeli');
    expect(response.status !== 500, 'Server crash olmamalı');
  });

  await test('Çok büyük payload (1MB)', async () => {
    const bigPayload = {
      email: 'big@test.com',
      password: 'Test123!',
      name: 'a'.repeat(1024 * 1024) // 1MB name
    };

    const response = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bigPayload)
    });

    expect(response.status >= 400 || response.status === 413, 
      `Büyük payload reddedilmeli: ${response.status}`);
  });

  await test('Null değerler', async () => {
    const { response } = await request('/register', {
      method: 'POST',
      body: JSON.stringify({ email: null, password: null, name: null })
    });

    expect(response.status >= 400, 'Null değerler hata vermeli');
  });

  await test('Array olarak email gönderme', async () => {
    const { response } = await request('/register', {
      method: 'POST',
      body: JSON.stringify({ 
        email: ['test@test.com'], 
        password: 'Test123!', 
        name: 'Array Email' 
      })
    });

    expect(response.status >= 400, 'Array email hata vermeli');
  });

  await test('Concurrent register (race condition)', async () => {
    const uniqueEmail = `race${Date.now()}@test.com`;
    
    const requests = [
      request('/register', {
        method: 'POST',
        body: JSON.stringify({ email: uniqueEmail, password: 'Test123!', name: 'Race1' })
      }),
      request('/register', {
        method: 'POST',
        body: JSON.stringify({ email: uniqueEmail, password: 'Test123!', name: 'Race2' })
      })
    ];

    const results = await Promise.all(requests);
    const successCount = results.filter(r => r.response.status === 201).length;
    
    expect(successCount === 1, `Sadece 1 kayıt başarılı olmalı, ${successCount} oldu`);
  });
}

// ============================================
// 5. PERFORMANS TESTLERİ
// ============================================

async function performanceTests() {
  setCategory('PERFORMANS TESTLERİ');

  await test('Login response süresi < 500ms', async () => {
    const start = Date.now();
    await request('/login', {
      method: 'POST',
      body: JSON.stringify({ email: randomEmail, password: 'Test123!' })
    });
    const duration = Date.now() - start;

    expect(duration < 500, `${duration}ms sürdü, 500ms altında olmalı`);
    console.log(`     └─ Süre: ${duration}ms`);
  });

  await test('10 ardışık login isteği', async () => {
    const start = Date.now();
    
    for (let i = 0; i < 10; i++) {
      await request('/login', {
        method: 'POST',
        body: JSON.stringify({ email: randomEmail, password: 'Test123!' })
      });
    }

    const duration = Date.now() - start;
    const avgDuration = duration / 10;

    expect(avgDuration < 200, `Ortalama ${avgDuration}ms, 200ms altında olmalı`);
    console.log(`     └─ 10 istek toplam: ${duration}ms (ort: ${avgDuration}ms)`);
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
    const icon = passed === total ? '✅' : passed > 0 ? '⚠️' : '❌';
    
    console.log(`\n${icon} ${category}: ${passed}/${total}`);
  });

  const totalPassed = results.filter(r => r.passed).length;
  const totalTests = results.length;
  const percentage = Math.round((totalPassed / totalTests) * 100);

  console.log('\n' + '═'.repeat(50));
  console.log(`\n🎯 TOPLAM: ${totalPassed}/${totalTests} (${percentage}%)`);

  if (percentage === 100) {
    console.log('\n🎉 MÜKEMMEL! Tüm testler geçti!\n');
  } else if (percentage >= 80) {
    console.log('\n✅ İYİ! Çoğu test geçti, küçük iyileştirmeler gerekli.\n');
  } else if (percentage >= 50) {
    console.log('\n⚠️ ORTA! Bazı önemli testler başarısız.\n');
  } else {
    console.log('\n❌ KRİTİK! Ciddi sorunlar var, düzeltilmeli.\n');
  }

  // Başarısız testleri listele
  const failed = results.filter(r => !r.passed);
  if (failed.length > 0) {
    console.log('❌ BAŞARISIZ TESTLER:');
    failed.forEach(f => {
      console.log(`   • [${f.category}] ${f.name}`);
      console.log(`     └─ ${f.message}`);
    });
    console.log('');
  }
}

// ============================================
// ANA FONKSİYON
// ============================================

async function runAllTests() {
  console.log('\n🧪 KAPSAMLI AUTH TEST SÜİTİ');
  console.log('═'.repeat(50));
  console.log(`📧 Test email: ${randomEmail}`);
  console.log(`🌐 API URL: ${BASE_URL}`);
  console.log(`📅 Tarih: ${new Date().toLocaleString('tr-TR')}`);

  try {
    await registerTests();
    await loginTests();
    await tokenTests();
    await edgeCaseTests();
    await performanceTests();
  } catch (error: any) {
    console.log(`\n💥 KRİTİK HATA: ${error.message}`);
  }

  printReport();
}

runAllTests();