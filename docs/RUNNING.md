# Chạy Sen — Docker & local dev

Hai cách phổ biến:

| Cách | Phù hợp khi |
|------|-------------|
| **A. Dev local** | Sửa code API/web/mobile, hot reload |
| **B. Docker full** | Demo nhanh, CI, không cần cài Java/Node trên máy |

Mobile (Expo) **luôn chạy trên máy host** — không đóng gói trong Docker.

---

## Cách A — Dev local (khuyến nghị khi code)

### Bước 1: Chỉ bật database (Docker)

```bash
cd /Users/minhphuong/Projects/chay-nhac
docker compose up -d
```

Chạy: **Postgres** `:5432`, **Redis** `:6379`.

### Bước 2: API (Spring Boot trên máy)

Yêu cầu: **JDK 21**, Gradle wrapper có sẵn trong `services/api`.

```bash
cd services/api
./gradlew bootRun
```

- API: http://localhost:8080  
- Health: http://localhost:8080/actuator/health  

Biến môi trường (tùy chọn, mặc định đã khớp docker compose):

```bash
export DB_HOST=localhost DB_PORT=5432 DB_NAME=sen DB_USER=sen DB_PASSWORD=sen
export JWT_SECRET=dev-only-change-me-use-32-chars-minimum!!
export CORS_ORIGINS=http://localhost:3000,http://localhost:8081
```

### Bước 3: Web (Next.js trên máy)

Yêu cầu: **Node ≥ 18.17** (khuyến nghị Node 20).

```bash
cd apps/web
npm install
cp .env.example .env.local
npm run dev
```

- Web: http://localhost:3000  
- Browser gọi `/api/proxy/...` → Next rewrite → `http://localhost:8080/api/v1/...`  

File `.env.local`:

```env
API_URL=http://localhost:8080
NEXT_PUBLIC_API_URL=/api/proxy
```

### Bước 4: Mobile (Expo trên máy)

```bash
cd apps/mobile
npm install
cp .env.example .env
npm start
```

Sau đó bấm `i` (iOS simulator) hoặc `a` (Android emulator).

#### URL API theo từng môi trường mobile

| Môi trường | `EXPO_PUBLIC_API_URL` |
|------------|------------------------|
| iOS Simulator (cùng máy API) | `http://localhost:8080/api/v1` |
| Android Emulator | `http://10.0.2.2:8080/api/v1` |
| Điện thoại thật (cùng Wi‑Fi) | `http://<IP-máy-tính>:8080/api/v1` |

Lấy IP máy (macOS):

```bash
ipconfig getifaddr en0
```

Ví dụ `.env`:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.42:8080/api/v1
```

> `localhost` trên điện thoại thật trỏ về chính điện thoại — **không** trỏ về máy dev.

---

## Cách B — Docker full (API + Web trong container)

```bash
cd /Users/minhphuong/Projects/chay-nhac
docker compose --profile full up -d --build
```

| Service | URL |
|---------|-----|
| Web | http://localhost:3000 |
| API | http://localhost:8080 |
| Postgres | localhost:5432 |
| Redis | localhost:6379 |

Dừng:

```bash
docker compose --profile full down
```

Xóa cả data Postgres:

```bash
docker compose --profile full down -v
```

### Mobile khi API chạy trong Docker

API vẫn expose `8080` ra host → cấu hình mobile **giống Cách A** (dùng IP LAN hoặc `10.0.2.2` / `localhost` tùy emulator).

---

## Kiểm tra end-to-end

1. Mở http://localhost:3000 → **Đăng nhập** / đăng ký  
2. Vào **Mở ứng dụng web** → thấy trạng thái hôm nay + lịch  
3. Mobile: đăng nhập cùng tài khoản → tab **Hôm nay**  

Test API trực tiếp:

```bash
curl -s http://localhost:8080/actuator/health

curl -s -X POST http://localhost:8080/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@sen.local","password":"password123","displayName":"Demo"}'
```

---

## Sơ đồ kết nối (dev local)

```
┌─────────────┐     /api/proxy      ┌──────────────┐
│  Web :3000  │ ──────────────────► │  API :8080   │
│  (Next.js)  │                       │ (Spring Boot)│
└─────────────┘                       └──────┬───────┘
                                             │
┌─────────────┐   EXPO_PUBLIC_API_URL        │
│ Mobile Expo │ ─────────────────────────────┤
│  (host)     │   http://IP:8080/api/v1      │
└─────────────┘                              ▼
                                    ┌────────────────┐
                                    │ docker compose │
                                    │ postgres:5432  │
                                    │ redis:6379     │
                                    └────────────────┘
```

---

## Lỗi thường gặp

| Triệu chứng | Cách xử lý |
|-------------|-----------|
| API không start — connection refused DB | `docker compose up -d` và đợi postgres healthy |
| Web 401/403 khi gọi API | Đăng nhập lại; kiểm tra `API_URL` trong `.env.local` |
| Mobile không gọi được API | Đổi `EXPO_PUBLIC_API_URL` sang IP LAN; tắt firewall chặn 8080 |
| CORS error từ web | Thêm origin vào `CORS_ORIGINS` khi chạy API |
| `bootRun` chậm lần đầu | Bình thường — Gradle tải dependencies |
