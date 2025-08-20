## PetStore
Evcil hayvan ilanları, kullanıcı yönetimi, basit sohbet ve AI servisleri içeren full-stack bir uygulama. Frontend (React + Vite + TS), Backend (.NET 8 Web API) ve opsiyonel Python tabanlı AI servisinden oluşur.

### Teknolojiler
- Frontend: React, TypeScript, Vite
- Backend: .NET 8, ASP.NET Core, Entity Framework Core
- AI Servis: Python (requirements.txt)

### Dizin Yapısı
- `front_end/`: React + Vite kaynak kodu
- `back_end/PetStoreAPI/`: .NET 8 Web API çözümü ve projeleri
- `ai/`: Python AI servisi (`app.py`)

## Hızlı Başlangıç (Windows)
Önkoşullar: Node.js 18+, .NET SDK 8+, Python 3.10+, Git

### Backend (.NET API)
```bash
cd back_end/PetStoreAPI/PetStoreAPI
# Gerekli paketler
dotnet restore
# Uygulamayı çalıştır
dotnet run
```
Çalışan port, terminal çıktısında belirtilecektir (örn. `http://localhost:5200`).

### Frontend (React + Vite)
```bash
cd front_end
npm install
npm run dev
```
Genelde `http://localhost:5173` adresinde çalışır.

### AI Servis (Python)
```bash
cd ai
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

## Konfigürasyon
- Backend ayarları: `back_end/PetStoreAPI/PetStoreAPI/appsettings.json`
  - `ConnectionStrings.DefaultConnection`
  - `ApiSettings.JwtOptions.Secret`
  - `Firebase.CredentialsPath` (örn. `firebase-service-account.json`)
- Frontend env: `front_end/.env.local` içinde `VITE_` ile başlayan değişkenler
- AI servis env: `ai/` içinde ihtiyaç halinde `.env`

## Notlar
- Derleme çıktıları, bağımlılıklar ve hassas kimlik bilgileri `.gitignore` ile hariç tutulur; kaynak kod görünür kalır.
