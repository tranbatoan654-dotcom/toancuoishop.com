# Hướng dẫn chạy ứng dụng nền (background) trên Windows

## 1. Cài đặt thư viện (nếu chưa cài)

```cmd
npm install
```

## 2. Chạy bằng PM2 (không cần giữ cửa sổ CMD mở)

```cmd
npx pm2 start ecosystem.config.js
```

Hoặc dùng script có sẵn:
```cmd
npm run pm2:start
```

Kiểm tra trạng thái:
```cmd
npx pm2 status
```

Xem log:
```cmd
npx pm2 logs inventory-app
```

## 3. Tự động chạy lại khi mở máy (Windows Startup)

### Bước 3.1: Lưu cấu hình PM2

```cmd
npx pm2 save
```

Hoặc:
```cmd
npm run pm2:save
```

### Bước 3.2: Tạo script khởi động Windows

Mở **Command Prompt (Run as Administrator)** và chạy:

```cmd
npm install -g pm2
npm install -g pm2-windows-startup
pm2-startup install
```

Sau đó lưu lại:
```cmd
pm2 save
```

Từ giờ, mỗi khi bật máy tính, ứng dụng sẽ tự động chạy ngầm mà không cần mở CMD.

## 4. Các lệnh quản lý PM2 thường dùng

| Lệnh | Chức năng |
|------|-----------|
| `npx pm2 status` | Xem trạng thái app |
| `npx pm2 stop inventory-app` | Dừng app |
| `npx pm2 restart inventory-app` | Khởi động lại app |
| `npx pm2 delete inventory-app` | Xóa app khỏi PM2 |
| `npx pm2 logs` | Xem log |
| `npx pm2 monit` | Giám sát real-time |

## 5. Tài khoản Admin mặc định

Sau khi chạy server lần đầu, hệ thống tự động tạo admin:

- **Username:** `tranbatoan`
- **Password:** `Toan@2012`
- **Role:** Admin (vĩnh viễn, không hết hạn)

Dùng tài khoản này để:
- Quản lý tất cả tài khoản user (khóa / mở khóa / gia hạn)
- Duyệt giao dịch gia hạn (cộng tiền)
- Xem báo cáo doanh thu, lợi nhuận

## 6. Lưu ý

- Nếu gặp lỗi `pm2-startup not found`, hãy chạy `npm install -g pm2-windows-startup` bằng **Command Prompt (Admin)**.
- File `.env` cần được tạo trước khi chạy (`copy .env.example .env`).
- MongoDB phải đang chạy trước khi khởi động ứng dụng.
