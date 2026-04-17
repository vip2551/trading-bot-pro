# 🚀 دليل AWS EC2 المجاني - Trading Bot Pro

## 💰 الخطة المجانية (Free Tier)

- **المدة**: 12 شهر مجاناً
- **المواصفات**: 
  - 1 vCPU
  - 1GB RAM
  - 30GB SSD
- **التكلفة**: $0 💚

---

## 📋 الخطوة 1: إنشاء حساب AWS

### 1.1 الذهاب للموقع
```
https://aws.amazon.com/free/
```

### 1.2 إنشاء الحساب
1. اضغط **"Create a free account"**
2. أدخل:
   - Email
   - اسم الحساب (AWS account name)
3. اختر نوع الحساب: **Personal**

### 1.3 إضافة طريقة الدفع
⚠️ مطلوب بطاقة للتحقق (لن يتم سحب شيء)
- Visa / Mastercard / Mada

### 1.4 التحقق من الهوية
- أدخل رقم الهاتف
- استلم رمز التحقق عبر SMS أو مكالمة

### 1.5 اختيار الخطة
```
✅ Basic Plan - Free
```

---

## 🖥️ الخطوة 2: إنشاء EC2 Instance

### 2.1 الدخول لـ EC2
1. بعد تسجيل الدخول، ابحث عن **"EC2"** في شريط البحث
2. اضغط على **"EC2"**

### 2.2 إنشاء Instance جديد
1. اضغط **"Launch Instance"** (الزر البرتقالي)
2. أدخل اسم: `trading-bot-pro`

### 2.3 اختيار نظام التشغيل
```
✅ Ubuntu
✅ Ubuntu Server 22.04 LTS (HVM), SSD Volume Type
```

### 2.4 اختيار نوع السيرفر (مهم!)
```
✅ t2.micro أو t3.micro
   - Free tier eligible ✅
   - 1 vCPU, 1GB RAM
```
⚠️ تأكد من وجود علامة "Free tier eligible"

### 2.5 إنشاء Key Pair (مهم!)
1. اضغط **"Create new key pair"**
2. الاسم: `trading-bot-key`
3. النوع: **RSA**
4. الصيغة:
   - Windows: **.ppk** (لـ PuTTY)
   - Mac/Linux: **.pem**
5. اضغط **"Create key pair"**
6. ⚠️ سيتم تحميل الملف - احفظه جيداً!

### 2.6 إعدادات الشبكة
```
✅ Allow SSH traffic from: Anywhere (0.0.0.0/0)
✅ Allow HTTP traffic from internet
✅ Allow HTTPS traffic from internet
```

### 2.7 التخزين
```
✅ 30 GiB gp2 (مجاني)
```

### 2.8 Launch!
1. راجع الإعدادات
2. اضغط **"Launch Instance"**

---

## 💻 الخطوة 3: الاتصال بالسيرفر

### من Windows:

#### 3.1 تحميل PuTTY
```
https://www.putty.org/
```

#### 3.2 تحويل المفتاح (إذا كان .pem)
1. افتح **PuTTYgen**
2. اضغط **Load** → اختر ملف .pem
3. اضغط **Save private key** → احفظ كـ .ppk

#### 3.3 الاتصال
1. افتح **PuTTY**
2. Host Name: `ubuntu@YOUR_PUBLIC_IP`
3. Connection → SSH → Auth → Credentials
4. اختر ملف .ppk
5. اضغط **Open**

### من Mac/Linux:

```bash
# تغيير صلاحيات المفتاح
chmod 400 trading-bot-key.pem

# الاتصال
ssh -i trading-bot-key.pem ubuntu@YOUR_PUBLIC_IP
```

---

## ⚙️ الخطوة 4: إعداد السيرفر

### بعد الاتصال، انسخ هذه الأوامر:

```bash
# 1. تحديث النظام
sudo apt update && sudo apt upgrade -y

# 2. تثبيت المتطلبات
sudo apt install -y curl wget git unzip

# 3. تثبيت Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# 4. تثبيت Node.js (لـ IB Gateway)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 5. تثبيت Java (لـ IB Gateway)
sudo apt install -y openjdk-17-jre-headless

# 6. تثبيت XVFB (لتشغيل IB بدون واجهة رسومية)
sudo apt install -y xvfb
```

---

## 🤖 الخطوة 5: تثبيت البوت

```bash
# إنشاء مجلد
mkdir -p ~/trading-bot
cd ~/trading-bot

# تحميل البوت
git clone https://github.com/vip2551/trading-bot-pro.git .

# تثبيت المتطلبات
~/.bun/bin/bun install

# إعداد قاعدة البيانات
~/.bun/bin/bun run db:push
```

---

## 🏦 الخطوة 6: تثبيت IB Gateway

```bash
# إنشاء مجلد
sudo mkdir -p /opt/ibgateway
cd /opt/ibgateway

# تحميل IB Gateway
sudo wget https://download2.interactivebrokers.com/installers/ibgateway/stable-standalone/ibgateway-stable-standalone-linux-x64.sh

# تثبيت
sudo chmod +x ibgateway-stable-standalone-linux-x64.sh
sudo ./ibgateway-stable-standalone-linux-x64.sh -q -dir /opt/ibgateway
```

---

## 🔐 الخطوة 7: إعداد IB Gateway

```bash
# إنشاء ملف الإعدادات
mkdir -p ~/IBGateway

nano ~/IBGateway/jts.ini
```

### أدخل هذا المحتوى:
```ini
[Logon]
user=YOUR_IB_USERNAME
password=YOUR_IB_PASSWORD
TradingMode=paper
locale=en
minimize=true

[MainWindow]
x=0
y=0
width=400
height=200
```

⚠️ غيّر `YOUR_IB_USERNAME` و `YOUR_IB_PASSWORD`

---

## 🚀 الخطوة 8: تشغيل كخدمات

### 8.1 إنشاء خدمة IB Gateway:
```bash
sudo nano /etc/systemd/system/ibgateway.service
```

أدخل:
```ini
[Unit]
Description=IB Gateway
After=network.target

[Service]
Type=simple
User=ubuntu
Environment="DISPLAY=:99"
ExecStartPre=/usr/bin/Xvfb :99 -screen 0 1024x768x24
ExecStart=/opt/ibgateway/ibgateway
Restart=always
RestartSec=30

[Install]
WantedBy=multi-user.target
```

### 8.2 إنشاء خدمة البوت:
```bash
sudo nano /etc/systemd/system/trading-bot.service
```

أدخل:
```ini
[Unit]
Description=Trading Bot Pro
After=network.target ibgateway.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/trading-bot
Environment="PATH=/home/ubuntu/.bun/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
ExecStart=/home/ubuntu/.bun/bin/bun run dev
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 8.3 تفعيل الخدمات:
```bash
sudo systemctl daemon-reload
sudo systemctl enable ibgateway
sudo systemctl enable trading-bot
sudo systemctl start ibgateway
sudo systemctl start trading-bot
```

---

## 🌐 الخطوة 9: فتح المنافذ في AWS

### 9.1 الذهاب لـ Security Groups
1. في AWS Console → EC2 → Security Groups
2. اختر Security Group الخاص بسيرفرك

### 9.2 إضافة القواعد:
```
Type: Custom TCP | Port: 3000 | Source: 0.0.0.0/0
Type: Custom TCP | Port: 7497 | Source: 0.0.0.0/0
```

---

## ✅ الخطوة 10: الوصول للبوت

البوت يعمل على:
```
http://YOUR_PUBLIC_IP:3000
```

---

## 📋 أوامر مفيدة

```bash
# حالة البوت
sudo systemctl status trading-bot

# حالة IB
sudo systemctl status ibgateway

# السجلات
sudo journalctl -u trading-bot -f

# إعادة التشغيل
sudo systemctl restart trading-bot
sudo systemctl restart ibgateway
```

---

## 💰 التكاليف المتوقعة

| الخدمة | التكلفة |
|--------|---------|
| EC2 t2.micro | مجاني 12 شهر ✅ |
| EBS 30GB | مجاني ✅ |
| Data Transfer | مجاني حتى 100GB ✅ |
| **المجموع** | **$0** 💚 |

---

## ⚠️ تحذيرات مهمة

1. **راقب استخدامك** - تجنب التجاوز
2. **احذف الموارد** إذا لم تعد تحتاجها
3. **فعّل Billing Alerts** للتنبيهات

---

## 🔄 الانتقال لـ Vultr (بعد سنة)

عند انتهاء الفترة المجانية:
1. خذ نسخة احتياطية
2. أنشئ سيرفر Vultr ($5/شهر)
3. انقل البيانات
4. أوقف AWS

---

## 🆘 استكشاف الأخطاء

### البوت لا يعمل:
```bash
sudo journalctl -u trading-bot -n 50
```

### IB لا يتصل:
```bash
sudo journalctl -u ibgateway -n 50
```

### المنفذ مغلق:
- تحقق من Security Group
- تحقق من Firewall

---

## 📞 الدعم

- AWS Support: مجاني للأسئلة الأساسية
- Documentation: https://docs.aws.amazon.com/ec2/
