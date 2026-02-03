// test-auth.ts
// Çalıştırmak için: npx tsx test-auth.ts

const BASE_URL = 'http://localhost:5000/api';

async function main() {
    console.log("🔒 AUTH TESTİ BAŞLIYOR...\n");

    // 1. REGISTER (Kayıt Ol)
    console.log("1. Kullanıcı Oluşturuluyor...");
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: "admin@teknik.com",
            password: "guclu_sifre_123",
            name: "Admin Bey"
        })
    });

    if (regRes.status === 201) {
        console.log("   ✅ Kayıt Başarılı!");
    } else if (regRes.status === 409) {
        console.log("   ⚠️ Kullanıcı zaten var (Sorun yok, devam ediyoruz).");
    } else {
        console.error("   ❌ Kayıt Hatası:", await regRes.text());
        process.exit(1);
    }

    // 2. LOGIN (Giriş Yap ve Token Al)
    console.log("\n2. Giriş Yapılıyor...");
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: "admin@teknik.com",
            password: "guclu_sifre_123"
        })
    });

    const loginData = await loginRes.json();

    if (loginRes.status === 200 && loginData.token) {
        console.log("   ✅ Giriş Başarılı!");
        console.log("   🔑 Token:", loginData.token.substring(0, 20) + "...");
    } else {
        console.error("   ❌ Giriş Hatası:", loginData);
        process.exit(1);
    }
    
    console.log("\n✅ AUTH MODÜLÜ SAĞLAM. ŞİMDİ KAPILARI KİLİTLEYEBİLİRSİN.");
}

main();