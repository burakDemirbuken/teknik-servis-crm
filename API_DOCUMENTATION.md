# Teknik Servis CRM API Dökümanı

## Genel Bilgiler

**Base URL:** `http://localhost:5000`

**Content-Type:** `application/json`

**CORS:** Tüm originlere izin verilmiştir

---

## 🏥 Health Check

### GET /
Temel API durumu kontrolü

**Response:**
```json
{
  "message": "Teknik Servis CRM API"
}
```

### GET /health
Sağlık durumu kontrolü

**Response:**
```json
{
  "status": "OK"
}
```

---

## 👥 Müşteri İşlemleri

Base URL: `/api/customers`

### GET /api/customers
Tüm müşterileri listele

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "Ahmet",
    "surname": "Yılmaz",
    "phone": "05551234567",
    "address": "İstanbul, Türkiye",
    "created_at": "2026-01-15T10:00:00.000Z",
    "updated_at": "2026-01-15T10:00:00.000Z"
  }
]
```

### POST /api/customers
Yeni müşteri oluştur

**Request Body:**
```json
{
  "name": "Ahmet",          // zorunlu, string
  "surname": "Yılmaz",      // zorunlu, string
  "phone": "05551234567",   // zorunlu, string
  "address": "İstanbul"     // opsiyonel, string | null
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "name": "Ahmet",
  "surname": "Yılmaz",
  "phone": "05551234567",
  "address": "İstanbul",
  "created_at": "2026-01-15T10:00:00.000Z",
  "updated_at": "2026-01-15T10:00:00.000Z"
}
```

**Hata Yanıtları:**
- `400 Bad Request`: Validasyon hatası
  ```json
  {
    "errors": ["Name is required", "Phone is required"]
  }
  ```
- `500 Internal Server Error`: Sunucu hatası

---

## 🎫 Ticket İşlemleri

Base URL: `/api/tickets`

### GET /api/tickets
Tüm ticketları listele (müşteri ve ürün bilgileriyle)

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "customerId": 1,
    "issue_description": "Ekran kırık",
    "total_price": 1500.00,
    "closed_at": null,
    "ticketStatus": "OPEN",
    "created_at": "2026-01-15T10:00:00.000Z",
    "updated_at": "2026-01-15T10:00:00.000Z",
    "customer": {
      "id": 1,
      "name": "Ahmet",
      "surname": "Yılmaz",
      "phone": "05551234567"
    },
    "products": [
      {
        "id": 1,
        "model": "iPhone 13",
        "brand": "Apple",
        "status": "RECEIVED"
      }
    ]
  }
]
```

### POST /api/tickets
Yeni ticket oluştur

**Request Body:**
```json
{
  "customerId": 1,                    // zorunlu, number
  "issue_description": "Ekran kırık", // opsiyonel, string | null
  "total_price": 1500.00,             // opsiyonel, number | null
  "closed_at": null,                  // opsiyonel, date | null
  "products": [                       // zorunlu, minimum 1 ürün
    {
      "productTypeId": 1,             // zorunlu, number
      "shelfId": 1,                   // zorunlu, number
      "model": "iPhone 13",           // zorunlu, string
      "brand": "Apple",               // zorunlu, string
      "price": 1500.00,               // opsiyonel, number | null
      "status": "RECEIVED",           // opsiyonel, default: "RECEIVED"
      "description": "Ekran değişimi", // opsiyonel, string | null
      "receivedDate": "2026-01-15",   // opsiyonel, date (default: now)
      "deliveryDate": null            // opsiyonel, date | null
    }
  ]
}
```

**Ürün Durumları (ProductStatus):**
- `RECEIVED` - Teslim Alındı
- `IN_REPAIR` - Onarımda
- `WAITING_PARTS` - Parça Bekliyor
- `COMPLETED` - Tamamlandı
- `DELIVERED` - Teslim Edildi
- `CANCELLED` - İptal Edildi

**Response:** `201 Created`
```json
{
  "id": 1,
  "customerId": 1,
  "issue_description": "Ekran kırık",
  "total_price": null,
  "closed_at": null,
  "ticketStatus": "OPEN",
  "created_at": "2026-01-15T10:00:00.000Z",
  "updated_at": "2026-01-15T10:00:00.000Z",
  "customer": { /* ... */ },
  "products": [ /* ... */ ]
}
```

**Hata Yanıtları:**
- `400 Bad Request`: Validasyon hatası
- `500 Internal Server Error`: Sunucu hatası

### PATCH /api/tickets/:id/close
Ticketı kapat ve toplam fiyatı güncelle

**URL Parametreleri:**
- `id` - Ticket ID (number)

**Request Body:**
```json
{
  "total_price": 1500.00  // zorunlu, number (minimum 0)
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "customerId": 1,
  "issue_description": "Ekran kırık",
  "total_price": 1500.00,
  "closed_at": "2026-01-15T12:00:00.000Z",
  "ticketStatus": "CLOSED",
  "created_at": "2026-01-15T10:00:00.000Z",
  "updated_at": "2026-01-15T12:00:00.000Z",
  "customer": { /* ... */ },
  "products": [ /* ... */ ]
}
```

**Hata Yanıtları:**
- `400 Bad Request`: ID eksik veya validasyon hatası
- `404 Not Found`: Ticket bulunamadı
- `500 Internal Server Error`: Sunucu hatası

---

## 📦 Ürün İşlemleri

Base URL: `/api/products`

### PATCH /api/products/:id
Ürün bilgilerini güncelle

**URL Parametreleri:**
- `id` - Ürün ID (number)

**Request Body:** (Tüm alanlar opsiyonel)
```json
{
  "shelfId": 2,                       // opsiyonel, number
  "productTypeId": 1,                 // opsiyonel, number
  "status": "IN_REPAIR",              // opsiyonel, ProductStatus enum
  "price": 1500.00,                   // opsiyonel, number (minimum 0)
  "model": "iPhone 13 Pro",           // opsiyonel, string
  "brand": "Apple",                   // opsiyonel, string
  "description": "Ekran değişimi",    // opsiyonel, string
  "receivedDate": "2026-01-15",       // opsiyonel, date
  "deliveryDate": "2026-01-20"        // opsiyonel, date | null
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "productTypeId": 1,
  "shelfId": 2,
  "ticketId": 1,
  "model": "iPhone 13 Pro",
  "brand": "Apple",
  "price": 1500.00,
  "status": "IN_REPAIR",
  "description": "Ekran değişimi",
  "receivedDate": "2026-01-15T00:00:00.000Z",
  "deliveryDate": "2026-01-20T00:00:00.000Z",
  "created_at": "2026-01-15T10:00:00.000Z",
  "updated_at": "2026-01-15T11:00:00.000Z"
}
```

**Hata Yanıtları:**
- `400 Bad Request`: Validasyon hatası
- `404 Not Found`: Ürün bulunamadı
- `500 Internal Server Error`: Sunucu hatası

---

## ⚙️ Ayarlar

Base URL: `/api/settings`

### Ürün Tipleri

#### GET /api/settings/product-types
Tüm ürün tiplerini listele

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "type": "Telefon",
    "created_at": "2026-01-15T10:00:00.000Z",
    "updated_at": "2026-01-15T10:00:00.000Z"
  },
  {
    "id": 2,
    "type": "Tablet",
    "created_at": "2026-01-15T10:00:00.000Z",
    "updated_at": "2026-01-15T10:00:00.000Z"
  }
]
```

#### POST /api/settings/product-types
Yeni ürün tipi oluştur

**Request Body:**
```json
{
  "type": "Laptop"  // zorunlu, string (minimum 1 karakter)
}
```

**Response:** `201 Created`
```json
{
  "id": 3,
  "type": "Laptop",
  "created_at": "2026-01-15T10:00:00.000Z",
  "updated_at": "2026-01-15T10:00:00.000Z"
}
```

**Hata Yanıtları:**
- `400 Bad Request`: Validasyon hatası
- `409 Conflict`: Ürün tipi zaten mevcut
- `500 Internal Server Error`: Sunucu hatası

### Raf Konumları

#### GET /api/settings/shelves
Tüm raf konumlarını listele

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "zone": "A",
    "row": 1,
    "created_at": "2026-01-15T10:00:00.000Z",
    "updated_at": "2026-01-15T10:00:00.000Z"
  },
  {
    "id": 2,
    "zone": "A",
    "row": 2,
    "created_at": "2026-01-15T10:00:00.000Z",
    "updated_at": "2026-01-15T10:00:00.000Z"
  }
]
```

#### POST /api/settings/shelves
Yeni raf konumu oluştur

**Request Body:**
```json
{
  "zone": "C",  // zorunlu, string (minimum 1 karakter)
  "row": 3      // zorunlu, number (minimum 1)
}
```

**Response:** `201 Created`
```json
{
  "id": 5,
  "zone": "C",
  "row": 3,
  "created_at": "2026-01-15T10:00:00.000Z",
  "updated_at": "2026-01-15T10:00:00.000Z"
}
```

**Hata Yanıtları:**
- `400 Bad Request`: Validasyon hatası
- `409 Conflict`: Raf konumu zaten mevcut (zone + row kombinasyonu unique)
- `500 Internal Server Error`: Sunucu hatası

---

## 📊 Veri Modelleri

### Customer (Müşteri)
```typescript
{
  id: number
  name: string
  surname: string
  phone: string
  address: string | null
  created_at: Date
  updated_at: Date
  tickets: Ticket[]
}
```

### Ticket (İş Emri)
```typescript
{
  id: number
  customerId: number
  issue_description: string | null
  total_price: Decimal | null
  closed_at: Date | null
  ticketStatus: "OPEN" | "CLOSED" | "CANCELLED"
  created_at: Date
  updated_at: Date
  customer: Customer
  products: Product[]
}
```

### Product (Ürün)
```typescript
{
  id: number
  productTypeId: number
  shelfId: number
  ticketId: number
  model: string
  brand: string | null
  price: Decimal | null
  status: ProductStatus
  description: string | null
  receivedDate: Date
  deliveryDate: Date | null
  created_at: Date
  updated_at: Date
  productType: ProductType
  shelf: Shelf
  ticket: Ticket
}
```

### ProductType (Ürün Tipi)
```typescript
{
  id: number
  type: string
  created_at: Date
  updated_at: Date
  products: Product[]
}
```

### Shelf (Raf)
```typescript
{
  id: number
  zone: string
  row: number
  created_at: Date
  updated_at: Date
  products: Product[]
}
```

---

## 🔑 Enum Değerleri

### ProductStatus
- `RECEIVED` - Teslim Alındı
- `IN_REPAIR` - Onarımda
- `WAITING_PARTS` - Parça Bekliyor
- `COMPLETED` - Tamamlandı
- `DELIVERED` - Teslim Edildi
- `CANCELLED` - İptal Edildi

### TicketStatus
- `OPEN` - Açık
- `CLOSED` - Kapalı
- `CANCELLED` - İptal Edildi

---

## ⚠️ Hata Kodları

| Kod | Açıklama |
|-----|----------|
| 200 | Başarılı istek |
| 201 | Kaynak başarıyla oluşturuldu |
| 400 | Geçersiz istek (validasyon hatası) |
| 404 | Kaynak bulunamadı |
| 409 | Çakışma (duplicate kayıt) |
| 500 | Sunucu hatası |

---

## 📝 Notlar

1. **Tarih Formatı:** Tüm tarihler ISO 8601 formatında (`YYYY-MM-DDTHH:mm:ss.sssZ`) döner
2. **Decimal Değerler:** `total_price` ve `price` alanları Decimal tipindedir
3. **Mock Data:** Uygulama başlangıcında otomatik olarak bazı mock veriler oluşturulur:
   - Ürün Tipleri: Telefon, Tablet, Laptop, Diğer
   - Raflar: A1, A2, B1, B2
4. **Validasyon:** Tüm endpoint'ler Zod schema validation kullanır
5. **Database:** PostgreSQL kullanılmaktadır
6. **ORM:** Prisma kullanılmaktadır

---

## 🚀 Örnek Kullanım Senaryosu

### 1. Yeni müşteri oluştur
```bash
POST /api/customers
{
  "name": "Mehmet",
  "surname": "Demir",
  "phone": "05559876543",
  "address": "Ankara"
}
```

### 2. Ürün tipi ve raf listesini al
```bash
GET /api/settings/product-types
GET /api/settings/shelves
```

### 3. Müşteri için yeni ticket oluştur
```bash
POST /api/tickets
{
  "customerId": 1,
  "issue_description": "Ekran kırık, batarya şişmiş",
  "products": [
    {
      "productTypeId": 1,
      "shelfId": 1,
      "model": "iPhone 14",
      "brand": "Apple",
      "description": "Ekran değişimi gerekli"
    }
  ]
}
```

### 4. Ürün durumunu güncelle
```bash
PATCH /api/products/1
{
  "status": "IN_REPAIR",
  "description": "Parça sipariş edildi"
}
```

### 5. Ticketı kapat
```bash
PATCH /api/tickets/1/close
{
  "total_price": 2500.00
}
```

---

**Son Güncelleme:** 15 Ocak 2026
**API Version:** 1.0.0
**Port:** 5000
