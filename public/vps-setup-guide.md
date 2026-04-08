# 🚀 دليل إعداد VPS + IB Gateway للتداول 24/7

## 📋 المتطلبات

- VPS مع:
  - نظام Ubuntu 22.04 أو 24.04
  - RAM: 2GB على الأقل (4GB أفضل)
  - CPU: 2 cores
  - التكلفة: $5-10/شهر

---

## 🔧 الخطوة 1: استئجار VPS

### الخيار 1: DigitalOcean (أسهل)
1. اذهب إلى: https://www.digitalocean.com
2. أنشئ حساب جديد
3. اضغط "Create Droplet"
4. اختر:
   - Region: New York أو Frankfurt
   - OS: Ubuntu 22.04 (LTS)
   - Size: Basic - $6/month (2GB RAM)
   - Authentication: SSH Key أو Password
5. اضغط "Create Droplet"

### الخيار 2: Vultr (أرخص)
1. اذهب إلى: https://www.vultr.com
2. أنشئ حساب
3. اختر:
   - Server Type: Cloud Compute
   - Location: أي منطقة قريبة
   - OS: Ubuntu 22.04
   - Size: $5/month (1GB) أو $10/month (2GB)

---

## 🖥️ الخطوة 2: الاتصال بالـ VPS

### من Windows:
```powershell
# افتح PowerShell أو CMD
ssh root@YOUR_VPS_IP

# أو استخدم PuTTY
```

### من Mac/Linux:
```bash
ssh root@YOUR_VPS_IP
```

---

## ⚙️ الخطوة 3: إعداد السيرفر

### نسخ ولصق هذه الأوامر بالترتيب:

```bash
# 1. تحديث النظام
apt update && apt upgrade -y

# 2. تثبيت المتطلبات
apt install -y curl wget unzip xvfb openjdk-17-jre-headless

# 3. تثبيت Bun (لتشغيل البوت)
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# 4. إنشاء مجلد IB Gateway
mkdir -p /opt/ibgateway
cd /opt/ibgateway

# 5. تحميل IB Gateway
wget https://download2.interactivebrokers.com/installers/ibgateway/stable-standalone/ibgateway-stable-standalone-linux-x64.sh
chmod +x ibgateway-stable-standalone-linux-x64.sh

# 6. تثبيت IB Gateway (تلقائي)
./ibgateway-stable-standalone-linux-x64.sh -q -dir /opt/ibgateway

# 7. إنشاء ملف إعدادات IB Gateway
mkdir -p /root/IBGateway
```

---

## 🔐 الخطوة 4: إعداد IB Gateway

### إنشاء ملف الإعدادات:
```bash
cat > /root/IBGateway/jts.ini << 'EOF'
[Logon]
# أدخل بيانات IB الخاصة بك
user=YOUR_IB_USERNAME
password=YOUR_IB_PASSWORD
# Paper Trading = 7497 | Live = 7496
TradingMode=paper
locale=en
minimize=false

[MainWindow]
x=0
y=0
width=400
height=200
EOF
```

### تعديل الملف ببياناتك:
```bash
nano /root/IBGateway/jts.ini
# غيّر YOUR_IB_USERNAME و YOUR_IB_PASSWORD
# Ctrl+X ثم Y ثم Enter للحفظ
```

---

## 🤖 الخطوة 5: تشغيل البوت على السيرفر

### تحميل البوت:
```bash
# إنشاء مجلد المشروع
mkdir -p /root/trading-bot
cd /root/trading-bot

# تحميل من GitHub
git clone https://github.com/vip2551/trading-bot-pro.git .

# تثبيت المتطلبات
bun install

# إعداد قاعدة البيانات
bun run db:push
```

### إنشاء خدمة Systemd للبوت:
```bash
cat > /etc/systemd/system/trading-bot.service << 'EOF'
[Unit]
Description=Trading Bot Pro
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/trading-bot
ExecStart=/root/.bun/bin/bun run dev
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
```

---

## 🚀 الخطوة 6: تشغيل IB Gateway كخدمة

### إنشاء خدمة IB Gateway:
```bash
cat > /etc/systemd/system/ibgateway.service << 'EOF'
[Unit]
Description=IB Gateway
After=network.target

[Service]
Type=simple
User=root
Environment="DISPLAY=:99"
ExecStartPre=/usr/bin/Xvfb :99 -screen 0 1024x768x24
ExecStart=/opt/ibgateway/ibgateway
Restart=always
RestartSec=30

[Install]
WantedBy=multi-user.target
EOF
```

### تفعيل الخدمات:
```bash
# إعادة تحميل systemd
systemctl daemon-reload

# تفعيل IB Gateway
systemctl enable ibgateway
systemctl start ibgateway

# تفعيل البوت
systemctl enable trading-bot
systemctl start trading-bot

# التحقق من الحالة
systemctl status ibgateway
systemctl status trading-bot
```

---

## ✅ الخطوة 7: التحقق من العمل

```bash
# فحص المنافذ
netstat -tlnp | grep -E "7497|3000"

# فحص السجلات
journalctl -u ibgateway -f
journalctl -u trading-bot -f
```

---

## 🌐 الخطوة 8: الوصول للبوت من الإنترنت

### تثبيت Nginx:
```bash
apt install -y nginx

# إعداد Proxy
cat > /etc/nginx/sites-available/trading-bot << 'EOF'
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -s /etc/nginx/sites-available/trading-bot /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

الآن البوت متاح على: `http://YOUR_VPS_IP`

---

## 🔒 الأمان (مهم!)

```bash
# تثبيت جدار الحماية
apt install -y ufw

# السماح بالمنافذ المطلوبة فقط
ufw allow 22     # SSH
ufw allow 80     # HTTP
ufw allow 443    # HTTPS
ufw allow 7497   # IB Gateway Paper
ufw enable

# تأمين SSH
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart sshd
```

---

## 📱 إشعارات تيليجرام

للمتابعة بدون فتح البوت:
1. فعّل تيليجرام في إعدادات البوت
2. أدخل Bot Token و Chat ID
3. ستصلك إشعارات كل صفقة

---

## 🔄 الأوامر المفيدة

```bash
# إعادة تشغيل البوت
systemctl restart trading-bot

# إعادة تشغيل IB Gateway
systemctl restart ibgateway

# عرض السجلات
journalctl -u trading-bot -f

# تحديث البوت
cd /root/trading-bot
git pull
bun install
systemctl restart trading-bot
```

---

## 💡 نصائح مهمة

1. **استخدم Paper Trading أولاً** للتجربة
2. **راقب السجلات** أول أسبوع
3. **احتفظ بنسخة احتياطية** من إعداداتك
4. **استخدم كلمة مرور قوية** للحساب

---

## 🆘 استكشاف الأخطاء

### IB Gateway لا يعمل:
```bash
# فحص السجلات
journalctl -u ibgateway -n 50

# إعادة التثبيت
cd /opt/ibgateway
./ibgateway-stable-standalone-linux-x64.sh -q -dir /opt/ibgateway
```

### البوت لا يتصل:
```bash
# فحص حالة IB
curl http://localhost:7497

# إعادة تشغيل الخدمات
systemctl restart ibgateway trading-bot
```

---

## 📞 الدعم

إذا واجهت مشاكل، تأكد من:
- ✅ IB Gateway يعمل
- ✅ البوت يعمل
- ✅ المنافذ مفتوحة
- ✅ بيانات IB صحيحة
