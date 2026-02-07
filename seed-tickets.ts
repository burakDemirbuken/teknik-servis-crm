/**
 * 10,000 TICKET OLUŞTURMA SCRIPT
 * 
 * Kullanım: npx tsx seed-tickets.ts
 * 
 * Load testing ve performans testi için büyük miktarda ticket oluşturur.
 */

const BASE_URL = 'http://localhost/api';

// Konfigürasyon
const CONFIG = {
  totalTickets: 10000,
  batchSize: 100,        // Aynı anda kaç ticket gönderilecek (azaltıldı - DB connection pool için)
  delayBetweenBatches: 1000, // Batch'ler arası bekleme (ms) - arttırıldı
  customersCount: 500,   // Oluşturulacak müşteri sayısı
  productTypesCount: 10, // Oluşturulacak ürün tipi sayısı
  shelvesCount: 50,      // Oluşturulacak raf sayısı
};

let authToken = '';
let customerIds: number[] = [];
let productTypeIds: number[] = [];
let shelfIds: number[] = [];
let createdTickets = 0;
let failedTickets = 0;

// Türkçe isim ve soyisim listeleri
const NAMES = ['Ahmet', 'Mehmet', 'Ayşe', 'Fatma', 'Ali', 'Veli', 'Zeynep', 'Elif', 'Emre', 'Can', 'Deniz', 'Ece', 'Burak', 'Selin', 'Murat', 'Çağla', 'Kerem', 'İrem', 'Barış', 'Özge'];
const SURNAMES = ['Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Aydın', 'Öztürk', 'Arslan', 'Doğan', 'Koç', 'Kurt', 'Özdemir', 'Çetin', 'Acar', 'Polat', 'Aksoy', 'Şen', 'Yalçın', 'Erdoğan'];
const BRANDS = ['Apple', 'Samsung', 'Xiaomi', 'Huawei', 'Oppo', 'Realme', 'OnePlus', 'Nokia', 'LG', 'Sony'];
const MODELS = ['Pro Max', 'Ultra', 'Plus', 'Lite', 'Note', 'Edge', 'Neo', 'Prime', 'X', 'S'];
const ISSUES = [
  'Ekran kırık',
  'Batarya şişmiş',
  'Şarj olmuyor',
  'Ses gelmiyor',
  'Kamera çalışmıyor',
  'Donma sorunu',
  'Su hasarı',
  'Dokunmatik çalışmıyor',
  'Wifi bağlanmıyor',
  'Bluetooth sorunu'
];

// Yardımcı fonksiyonlar
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPhone(): string {
  return `05${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 90000000 + 10000000)}`;
}

function randomPrice(): number {
  return Math.floor(Math.random() * 1000) + 100;
}

function progressBar(current: number, total: number, width: number = 40): string {
  const percentage = (current / total) * 100;
  const filled = Math.floor((current / total) * width);
  const empty = width - filled;
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${current}/${total} (${percentage.toFixed(1)}%)`;
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

async function authRequest(endpoint: string, options: RequestInit = {}) {
  return request(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${authToken}`
    }
  });
}

async function login() {
  console.log('🔐 Admin olarak giriş yapılıyor...');
  
  const { response, data } = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@servis.com',
      password: 'admin123'
    })
  });

  if (response.status !== 200 || !data.token) {
    throw new Error('Login başarısız! Admin kullanıcısı var mı?');
  }

  authToken = data.token;
  console.log('✅ Giriş başarılı\n');
}

async function createCustomers() {
  console.log(`👥 ${CONFIG.customersCount} müşteri oluşturuluyor...`);
  
  // Önce mevcut müşterileri al
  const { response: getResponse, data: existingCustomers } = await authRequest('/customers');
  if (getResponse.status === 200 && Array.isArray(existingCustomers)) {
    customerIds.push(...existingCustomers.map((c: any) => c.id));
    console.log(`✅ ${existingCustomers.length} mevcut müşteri bulundu`);
  }
  
  const remainingCount = CONFIG.customersCount - customerIds.length;
  
  for (let i = 0; i < remainingCount; i++) {
    const { response, data } = await authRequest('/customers', {
      method: 'POST',
      body: JSON.stringify({
        name: randomItem(NAMES),
        surname: randomItem(SURNAMES),
        phone: randomPhone(),
        address: `${randomItem(['Ankara', 'İstanbul', 'İzmir', 'Bursa', 'Antalya'])} - ${i + 1}. Sokak`
      })
    });

    if (response.status === 201 && data.id) {
      customerIds.push(data.id);
    }

    if ((i + 1) % 50 === 0) {
      process.stdout.write(`\r${progressBar(i + 1, remainingCount)}`);
    }
  }
  
  console.log(`\n✅ ${customerIds.length} müşteri oluşturuldu\n`);
}

async function createProductTypes() {
  console.log(`📦 ${CONFIG.productTypesCount} ürün tipi oluşturuluyor...`);
  
  // Önce mevcut tipleri al
  const { response: getResponse, data: existingTypes } = await authRequest('/settings/product-types');
  if (getResponse.status === 200 && Array.isArray(existingTypes)) {
    productTypeIds.push(...existingTypes.map((t: any) => t.id));
    console.log(`✅ ${existingTypes.length} mevcut ürün tipi bulundu`);
  }
  
  const types = ['Telefon', 'Tablet', 'Laptop', 'Akıllı Saat', 'Kulaklık', 'Powerbank', 'Şarj Aleti', 'Kılıf', 'Cam Koruyucu', 'Hoparlör'];
  const remainingCount = CONFIG.productTypesCount - productTypeIds.length;
  
  for (let i = 0; i < remainingCount; i++) {
    const { response, data } = await authRequest('/settings/product-types', {
      method: 'POST',
      body: JSON.stringify({
        type: types[i] || `Ürün Tipi ${i + 1}`
      })
    });

    if ((response.status === 201 || response.status === 200) && data.id) {
      productTypeIds.push(data.id);
    }
  }
  
  console.log(`✅ ${productTypeIds.length} ürün tipi oluşturuldu\n`);
}

async function createShelves() {
  console.log(`📂 ${CONFIG.shelvesCount} raf oluşturuluyor...`);
  
  // Önce mevcut rafları al
  const { response: getResponse, data: existingShelves } = await authRequest('/settings/shelves');
  if (getResponse.status === 200 && Array.isArray(existingShelves)) {
    shelfIds.push(...existingShelves.map((s: any) => s.id));
    console.log(`✅ ${existingShelves.length} mevcut raf bulundu`);
  }
  
  // Eksik varsa yeni raf oluştur
  const zones = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const remainingCount = CONFIG.shelvesCount - shelfIds.length;
  
  for (let i = 0; i < remainingCount; i++) {
    const zone = zones[Math.floor(i / 10) % zones.length];
    const row = (i % 10) + 1;
    
    const { response, data } = await authRequest('/settings/shelves', {
      method: 'POST',
      body: JSON.stringify({ zone, row })
    });

    if ((response.status === 201 || response.status === 200) && data.id) {
      shelfIds.push(data.id);
    }
  }
  
  console.log(`✅ ${shelfIds.length} raf oluşturuldu\n`);
}

async function createTicketBatch(startIndex: number, count: number): Promise<void> {
  const promises: Promise<any>[] = [];

  for (let i = 0; i < count; i++) {
    const ticketData = {
      customerId: randomItem(customerIds),
      issue_description: randomItem(ISSUES),
      products: [
        {
          productTypeId: randomItem(productTypeIds),
          shelfId: randomItem(shelfIds),
          model: `${randomItem(BRANDS)} ${randomItem(MODELS)}`,
          brand: randomItem(BRANDS),
          price: randomPrice(),
          description: randomItem(ISSUES),
          status: randomItem(['RECEIVED', 'IN_REPAIR', 'WAITING_PARTS', 'COMPLETED'])
        }
      ]
    };

    const promise = authRequest('/tickets', {
      method: 'POST',
      body: JSON.stringify(ticketData)
    }).then(({ response, data }) => {
      if (response.status === 201) {
        createdTickets++;
      } else {
        failedTickets++;
        if (failedTickets === 1) {
          // İlk hatayı logla
          console.error(`\n❌ İlk hata (${response.status}):`, JSON.stringify(data, null, 2));
          console.error('Gönderilen data:', JSON.stringify(ticketData, null, 2));
        }
      }
    }).catch((err) => {
      failedTickets++;
      if (failedTickets === 1) {
        console.error('\n❌ İlk hata:', err.message);
      }
    });

    promises.push(promise);
  }

  await Promise.all(promises);
}

async function createTickets() {
  console.log(`🎫 ${CONFIG.totalTickets} ticket oluşturuluyor...`);
  console.log(`📊 Batch boyutu: ${CONFIG.batchSize}, Batch arası bekleme: ${CONFIG.delayBetweenBatches}ms\n`);
  
  const startTime = Date.now();
  const totalBatches = Math.ceil(CONFIG.totalTickets / CONFIG.batchSize);

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const startIdx = batchIndex * CONFIG.batchSize;
    const count = Math.min(CONFIG.batchSize, CONFIG.totalTickets - startIdx);
    
    await createTicketBatch(startIdx, count);
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const rate = (createdTickets / (Date.now() - startTime) * 1000).toFixed(1);
    
    process.stdout.write(`\r${progressBar(createdTickets + failedTickets, CONFIG.totalTickets)} | ` +
      `✅ ${createdTickets} ❌ ${failedTickets} | ` +
      `⚡ ${rate} ticket/s | ⏱️  ${elapsed}s`);
    
    // Batch'ler arası bekleme
    if (batchIndex < totalBatches - 1) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenBatches));
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  const avgRate = (createdTickets / (Date.now() - startTime) * 1000).toFixed(2);
  
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('📊 ÖZET İSTATİSTİKLER');
  console.log('═'.repeat(60));
  console.log(`✅ Başarılı:           ${createdTickets} ticket`);
  console.log(`❌ Başarısız:          ${failedTickets} ticket`);
  console.log(`⏱️  Toplam süre:        ${totalTime} saniye`);
  console.log(`⚡ Ortalama hız:       ${avgRate} ticket/saniye`);
  console.log(`📈 Başarı oranı:       ${((createdTickets / (createdTickets + failedTickets)) * 100).toFixed(2)}%`);
  console.log('═'.repeat(60));
}

async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('🚀 TOPLU TICKET OLUŞTURMA SCRIPT');
  console.log('═'.repeat(60));
  console.log(`📊 Hedef: ${CONFIG.totalTickets.toLocaleString()} ticket`);
  console.log(`📅 Tarih: ${new Date().toLocaleString('tr-TR')}`);
  console.log('═'.repeat(60) + '\n');

  try {
    // 1. Login
    await login();

    // 2. Müşteriler oluştur
    await createCustomers();

    // 3. Ürün tipleri oluştur
    await createProductTypes();

    // 4. Raflar oluştur
    await createShelves();

    // 5. Ticketları oluştur
    await createTickets();

    console.log('\n✅ Script başarıyla tamamlandı!\n');
    
  } catch (error: any) {
    console.error('\n❌ HATA:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Çalıştır
main();
