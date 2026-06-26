# Deploy lên Render.com (Free Web Service + MongoDB Atlas)

## Bước 1: Tạo MongoDB Atlas (Cloud Database Miễn Phí)

1. Truy cập: https://www.mongodb.com/atlas
2. Đăng ký / Đăng nhập (miễn phí)
3. Tạo **Cluster M0** (Free tier)
4. Trong **Database Access** → tạo user mới (nhớ username + password)
5. Trong **Network Access** → Add IP Address → chọn **Allow Access from Anywhere** (0.0.0.0/0)
6. Vào **Database** → chọn cluster → **Connect** → **Drivers** → chọn **Node.js**
7. Sao chép chuỗi kết nối, ví dụ:
```
mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/inventory_db?retryWrites=true&w=majority
```

## Bước 2: Đăng ký Render.com

1. Truy cập: https://render.com
2. Đăng ký bằng GitHub (khuyên dùng)
3. Tạo **New Web Service**

## Bước 3: Đưa code lên GitHub

1. Tạo repository mới trên GitHub (có thể để private)
2. Upload toàn bộ code vào repo (không upload file `.env`)
3. Nhớ có file `.env.example` trong repo

## Bước 4: Deploy trên Render

1. Trong Render → **New** → **Web Service** → chọn repo GitHub
2. Cấu hình:
   - **Name**: `inventory-app` (hoặc tùy chọn)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free
3. Thêm **Environment Variables** (Secrets):
   - `MONGODB_URI` = chuỗi MongoDB Atlas từ Bước 1
   - `SESSION_SECRET` = một chuỗi bất kỳ dài và ngẫu nhiên (ví dụ: `MySuperSecretKey123!@#`)
   - `RENEWAL_FEE` = `70000`
   - `RENEWAL_DAYS` = `30`
   - `NODE_ENV` = `production`
4. Nhấn **Create Web Service**

## Bước 5: Truy cập trang web

Render sẽ tự động build và deploy. Sau 2-3 phút, bạn sẽ có URL dạng:
```
https://inventory-app-xxxxx.onrender.com
```

Mở URL đó trên trình duyệt → ứng dụng đã chạy trên internet!

## Bước 6: Đăng nhập Admin

Dùng tài khoản admin tự động tạo:
- **Username**: `tranbatoan`
- **Password**: `Toan@2012`

## ⚠️ Lưu ý quan trọng với Render Free

- **Sleep**: Sau 15 phút không có người truy cập, server sẽ "ngủ". Lần truy cập tiếp theo sẽ mất ~30 giây để "đánh thức".
- **Để tránh sleep**: Có thể dùng dịch vụ ping miễn phí (UptimeRobot, Pingdom) để ping URL mỗi 10 phút.

## 🔒 Bảo mật

- **Không** để `SESSION_SECRET` đơn giản trên production
- **Không** để file `.env` lên GitHub
- MongoDB Atlas để IP `0.0.0.0/0` là an toàn nếu username/password mạnh

---

## Cách khác: Deploy bằng Docker (nếu có VPS/Server riêng)

```bash
docker-compose up -d
```

App sẽ chạy tại `http://your-server-ip:3000`

---

## Cách khác: Railway.app (Free tier, ít sleep hơn Render)

Railway cũng miễn phí và dễ deploy hơn Render. Chỉ cần:
1. Đăng ký https://railway.app
2. New Project → Deploy from GitHub repo
3. Thêm biến môi trường giống như Render

Railway free tier ít bị sleep hơn Render.
