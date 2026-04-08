# 🚀 الشرح التفصيلي لإعداد AWS EC2 - Trading Bot Pro

---

## 📋 فهرس المحتويات:

1. [إنشاء حساب AWS](#step1)
2. [إنشاء EC2 Instance](#step2)
3. [إعداد Security Groups](#step3)
4. [الاتصال بالسيرفر](#step4)
5. [تثبيت البوت](#step5)
6. [تشغيل IB Gateway](#step6)
7. [الوصول للبوت](#step7)
8. [استكشاف الأخطاء](#troubleshooting)

---

<a name="step1"></a>
## 🔐 الخطوة 1: إنشاء حساب AWS (5 دقائق)

### 1.1 فتح الموقع

```
🌐 https://aws.amazon.com/free/
```

### 1.2 الضغط على "Create a free account"

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│    AWS Logo                                                 │
│                                                             │
│    ┌─────────────────────────────────────────────────────┐  │
│    │                                                     │  │
│    │    Create a free account                            │  │
│    │                                                     │  │
│    └─────────────────────────────────────────────────────┘  │
│                                                             │
│    Already have an account? Sign in                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 إدخال البيانات

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Sign up for AWS                                            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Root user email address                              │   │
│  │ your-email@gmail.com                          ✉️    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ AWS account name                                     │   │
│  │ trading-bot-account                            🏢    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│           ┌─────────────────────────────┐                   │
│           │     Verify email            │                   │
│           └─────────────────────────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.4 اختيار نوع الحساب

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  How do you plan to use AWS?                                │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☑️ Personal                                          │   │
│  │   For personal projects, hobbies, or learning        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☐ Business                                           │   │
│  │   For work or business use                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.5 إدخال معلومات الاتصال

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Contact Information                                        │
│                                                             │
│  Full name: [Mohammed Ahmed                          ]      │
│  Phone number: [+966 5XX XXX XXX                     ]      │
│  Country: [Saudi Arabia                              ]      │
│  Address: [Your Address                              ]      │
│  City: [Riyadh                                       ]      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.6 إضافة بطاقة الدفع ⚠️

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Payment Information                                        │
│                                                             │
│  💳 Credit/Debit Card                                       │
│                                                             │
│  Card number: [•••• •••• •••• ••••                    ]     │
│  Expiration:  [MM/YY                                  ]     │
│  CVV:         [•••                                   ]     │
│  Cardholder:  [MOHAMMED AHMED                        ]     │
│                                                             │
│  ⚠️ ملاحظة: سيتم سحب $1 للتأكيد ثم إعادته فوراً            │
│  💰 لن يتم سحب أي مبلغ إذا التزمت بالـ Free Tier           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.7 التحقق من الهاتف

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Identity Verification                                      │
│                                                             │
│  Country code: [+966                                ]       │
│  Mobile number: [5XX XXX XXX                         ]      │
│                                                             │
│  ○ Text message (SMS)                                       │
│  ○ Voice call                                               │
│                                                             │
│           ┌─────────────────────────────┐                   │
│           │     Send code               │                   │
│           └─────────────────────────────┘                   │
│                                                             │
│  Verification code: [______                          ]       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.8 اختيار خطة الدعم

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Select a Support Plan                                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☑️ Basic Support - Free                        ✅    │   │
│  │                                                     │   │
│  │ • 24/7 Customer Service                             │   │
│  │ • AWS Trusted Advisor                               │   │
│  │ • AWS Personal Health Dashboard                     │   │
│  │ • No monthly charges                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│           ┌─────────────────────────────┐                   │
│           │     Complete sign up        │                   │
│           └─────────────────────────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

<a name="step2"></a>
## 🖥️ الخطوة 2: إنشاء EC2 Instance (5 دقائق)

### 2.1 الدخول لـ EC2

```
┌─────────────────────────────────────────────────────────────┐
│  AWS Console                                       [Your Name]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🔍 Search AWS services                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ec2                                          🔍     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 💻 EC2                                               │   │
│  │    Virtual servers in the cloud                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 اختيار Region (مهم!)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Region: [US East (N. Virginia) ▼]    ← الأفضل للخليج      │
│                                                             │
│  المناطق الموصى بها:                                        │
│  • US East (N. Virginia) - الأقرب لسيرفرات IB               │
│  • EU (Frankfurt) - إذا كنت في أوروبا                       │
│  • Asia Pacific (Singapore) - إذا كنت في آسيا               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Launch Instance

```
┌─────────────────────────────────────────────────────────────┐
│  EC2 Dashboard                                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │    🚀 Launch Instance                               │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Resources:                                                 │
│  • Instances: 0                                             │
│  • Volumes: 0                                               │
│  • Key Pairs: 0                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.4 إعداد Instance

```
┌─────────────────────────────────────────────────────────────┐
│  Launch an instance                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Name and tags                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Name: trading-bot-pro                          ✏️   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Application and OS Images (Amazon Machine Image)           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☑️ Ubuntu                                             │   │
│  │    Ubuntu Server 22.04 LTS (HVM), SSD Volume Type   │   │
│  │    ami-0abcdef1234567890 (64-bit (x86))              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Instance type                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ t2.micro                                        ▼    │   │
│  │ 1 vCPU - 1 GiB Memory                                │   │
│  │ ✅ Free tier eligible                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Key pair (login)                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Key pair name: trading-bot-key                 ▼    │   │
│  │                                                     │   │
│  │ ┌─────────────────────────────────────────────┐     │   │
│  │ │ Create new key pair                    ➕    │     │   │
│  │ └─────────────────────────────────────────────┘     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.5 إنشاء Key Pair (مهم!)

```
┌─────────────────────────────────────────────────────────────┐
│  Create key pair                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Key pair name:                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ trading-bot-key                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Key pair type:                                             │
│  ○ RSA                                                      │
│  ○ ED25519                                                  │
│                                                             │
│  Private key file format:                                   │
│  ○ .pem (Linux/Mac/Windows 10+ SSH)   ← اختر هذا           │
│  ○ .ppk (PuTTY for Windows)                                │
│                                                             │
│           ┌─────────────────────────────┐                   │
│           │     Create key pair         │                   │
│           └─────────────────────────────┘                   │
│                                                             │
│  ⚠️ سيتم تحميل الملف تلقائياً - احفظه في مكان آمن!         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.6 Network Settings

```
┌─────────────────────────────────────────────────────────────┐
│  Network settings                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Firewall (security groups)                                 │
│  ☑️ Create security group                                   │
│                                                             │
│  Security group name: launch-wizard-1                       │
│  Description: launch-wizard-1 created 2024-XX-XX           │
│                                                             │
│  Inbound security group rules:                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ☑️ Allow SSH traffic from                 Edit  Remove ││
│  │    Source: Anywhere (0.0.0.0/0)                        ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ☑️ Allow HTTP traffic from internet       Edit  Remove ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ☑️ Allow HTTPS traffic from internet      Edit  Remove ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│           ┌─────────────────────────────┐                   │
│           │     Add security group rule │                   │
│           └─────────────────────────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.7 التخزين

```
┌─────────────────────────────────────────────────────────────┐
│  Configure storage                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Size (GiB)  Volume Type     IOPS    Throughput    Delete││
│  │ 30          gp2             N/A     N/A          ☑️     ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ✅ Free tier: 30 GB EBS storage                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.8 Launch!

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Summary                                                    │
│  ─────────────────────────────────────────────────────────  │
│  Name: trading-bot-pro                                      │
│  AMI: Ubuntu Server 22.04 LTS                               │
│  Instance type: t2.micro (Free tier)                        │
│  Key pair: trading-bot-key                                  │
│  Storage: 30 GiB gp2                                        │
│                                                             │
│           ┌─────────────────────────────┐                   │
│           │     🚀 Launch instance      │                   │
│           └─────────────────────────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

<a name="step3"></a>
## 🔒 الخطوة 3: إعداد Security Groups (إضافة المنفذ 3000)

### 3.1 الذهاب لـ Security Groups

```
┌─────────────────────────────────────────────────────────────┐
│  EC2 Dashboard                                               │
├─────────────────────────────────────────────────────────────┤
│  Network & Security                                          │
│  ├─ Security Groups     ← اضغط هنا                          │
│  ├─ Elastic IPs                                             │
│  ├─ Placement Groups                                        │
│  └─ Key Pairs                                               │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 اختيار Security Group

```
┌─────────────────────────────────────────────────────────────┐
│  Security Groups                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ☑️ launch-wizard-1  |  vpc-xxx  |  In use: 1 instance     │
│                                                             │
│  Details:                                                   │
│  Security group ID: sg-0123456789abcdef                     │
│  Description: launch-wizard-1 created ...                   │
│  VPC: vpc-xxx                                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 إضافة قاعدة جديدة

```
┌─────────────────────────────────────────────────────────────┐
│  Inbound rules                                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Type        Port range   Source                      │   │
│  │ SSH         22           0.0.0.0/0                   │   │
│  │ HTTP        80           0.0.0.0/0                   │   │
│  │ HTTPS       443          0.0.0.0/0                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│           ┌─────────────────────────────┐                   │
│           │     Edit inbound rules      │                   │
│           └─────────────────────────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.4 إضافة المنفذ 3000

```
┌─────────────────────────────────────────────────────────────┐
│  Edit inbound rules                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Rule 1                                                     │
│  Type: [SSH ▼]         Port: 22       Source: 0.0.0.0/0    │
│                                                             │
│  Rule 2                                                     │
│  Type: [HTTP ▼]        Port: 80       Source: 0.0.0.0/0    │
│                                                             │
│  Rule 3  ← جديد!                                            │
│  Type: [Custom TCP ▼]  Port: 3000     Source: 0.0.0.0/0    │
│                                                             │
│  Rule 4  (اختياري - لـ IB Gateway)                          │
│  Type: [Custom TCP ▼]  Port: 7497     Source: 0.0.0.0/0    │
│                                                             │
│           ┌─────────────────────────────┐                   │
│           │     Add rule          ➕    │                   │
│           └─────────────────────────────┘                   │
│                                                             │
│           ┌─────────────────────────────┐                   │
│           │     Save rules              │                   │
│           └─────────────────────────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

<a name="step4"></a>
## 💻 الخطوة 4: الاتصال بالسيرفر

### 4.1 الحصول على Public IP

```
┌─────────────────────────────────────────────────────────────┐
│  Instances                                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ☑️ trading-bot-pro                                         │
│                                                             │
│  Instance summary:                                          │
│  ─────────────────────────────────────────────────────────  │
│  Instance ID: i-0123456789abcdef                            │
│  Instance state: Running ✅                                 │
│  Public IPv4 address: 54.XXX.XXX.XXX  ← انسخ هذا!          │
│  Public IPv4 DNS: ec2-54-xxx.amazonaws.com                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 الاتصال من Mac/Linux

```bash
# 1. افتح Terminal

# 2. اذهب لمجلد المفتاح
cd ~/Downloads

# 3. تغيير صلاحيات المفتاح (مهم!)
chmod 400 trading-bot-key.pem

# 4. الاتصال بالسيرفر
ssh -i trading-bot-key.pem ubuntu@54.XXX.XXX.XXX

# 5. اكتب yes للمتابعة
# Are you sure you want to continue? yes
```

### 4.3 الاتصال من Windows (PowerShell)

```powershell
# 1. افتح PowerShell

# 2. اذهب لمجلد المفتاح
cd $env:USERPROFILE\Downloads

# 3. الاتصال
ssh -i trading-bot-key.pem ubuntu@54.XXX.XXX.XXX

# 4. اكتب yes للمتابعة
```

### 4.4 الاتصال من Windows (PuTTY)

إذا كان المفتاح بصيغة .pem:

```
1. تحميل PuTTYgen
   https://www.putty.org/

2. تحويل المفتاح:
   - افتح PuTTYgen
   - اضغط Load
   - اختر trading-bot-key.pem
   - اضغط Save private key
   - احفظ كـ trading-bot-key.ppk

3. الاتصال بـ PuTTY:
   - Host Name: ubuntu@54.XXX.XXX.XXX
   - Port: 22
   - Connection → SSH → Auth → Credentials
   - اختر ملف .ppk
   - اضغط Open
```

---

<a name="step5"></a>
## 🤖 الخطوة 5: تثبيت البوت

### بعد الاتصال بالسيرفر، انسخ هذه الأوامر:

```bash
# ═══════════════════════════════════════════════════════════
# 🚀 تشغيل سكربت التثبيت التلقائي
# ═══════════════════════════════════════════════════════════

# تحميل السكربت
wget https://raw.githubusercontent.com/vip2551/trading-bot-pro/main/public/setup-aws.sh

# إعطاء صلاحيات التنفيذ
chmod +x setup-aws.sh

# تشغيل السكربت
./setup-aws.sh
```

### أو التثبيت اليدوي:

```bash
# 1. تحديث النظام
sudo apt update && sudo apt upgrade -y

# 2. تثبيت المتطلبات
sudo apt install -y curl wget git unzip

# 3. تثبيت Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# 4. إنشاء مجلد البوت
mkdir -p ~/trading-bot
cd ~/trading-bot

# 5. تحميل البوت
git clone https://github.com/vip2551/trading-bot-pro.git .

# 6. تثبيت المتطلبات
~/.bun/bin/bun install

# 7. إعداد قاعدة البيانات
~/.bun/bin/bun run db:push

# 8. تشغيل البوت (للتجربة)
~/.bun/bin/bun run dev
```

---

<a name="step6"></a>
## 🏦 الخطوة 6: تشغيل IB Gateway (اختياري)

### تثبيت IB Gateway:

```bash
# 1. تثبيت Java
sudo apt install -y openjdk-17-jre-headless xvfb

# 2. تحميل IB Gateway
sudo mkdir -p /opt/ibgateway
cd /opt/ibgateway
sudo wget https://download2.interactivebrokers.com/installers/ibgateway/stable-standalone/ibgateway-stable-standalone-linux-x64.sh
sudo chmod +x ibgateway-stable-standalone-linux-x64.sh
sudo ./ibgateway-stable-standalone-linux-x64.sh -q -dir /opt/ibgateway

# 3. إنشاء ملف الإعدادات
mkdir -p ~/IBGateway
nano ~/IBGateway/jts.ini
```

### محتوى ملف jts.ini:

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

### تشغيل IB Gateway:

```bash
# تشغيل في الخلفية
sudo systemctl start ibgateway

# التحقق من الحالة
sudo systemctl status ibgateway
```

---

<a name="step7"></a>
## 🌐 الخطوة 7: الوصول للبوت

### 7.1 تشغيل البوت كخدمة:

```bash
# إنشاء خدمة
sudo nano /etc/systemd/system/trading-bot.service
```

### المحتوى:

```ini
[Unit]
Description=Trading Bot Pro
After=network.target

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

### تفعيل الخدمة:

```bash
sudo systemctl daemon-reload
sudo systemctl enable trading-bot
sudo systemctl start trading-bot
```

### 7.2 الوصول للبوت:

```
🌐 http://54.XXX.XXX.XXX:3000
```

---

<a name="troubleshooting"></a>
## 🔧 استكشاف الأخطاء

### البوت لا يعمل:

```bash
# فحص الحالة
sudo systemctl status trading-bot

# عرض السجلات
sudo journalctl -u trading-bot -f

# إعادة التشغيل
sudo systemctl restart trading-bot
```

### المنفذ 3000 لا يعمل:

```bash
# فحص المنفذ
sudo netstat -tlnp | grep 3000

# التأكد من عمل البوت
curl http://localhost:3000/api/health
```

### IB Gateway لا يتصل:

```bash
# فحص السجلات
sudo journalctl -u ibgateway -n 50

# التأكد من تشغيل XVFB
ps aux | grep Xvfb
```

---

## 📋 أوامر مفيدة

```bash
# حالة البوت
sudo systemctl status trading-bot

# إيقاف البوت
sudo systemctl stop trading-bot

# تشغيل البوت
sudo systemctl start trading-bot

# إعادة التشغيل
sudo systemctl restart trading-bot

# السجلات المباشرة
sudo journalctl -u trading-bot -f

# تحديث البوت
cd ~/trading-bot
git pull
~/.bun/bin/bun install
sudo systemctl restart trading-bot
```

---

## 💰 التكاليف المتوقعة

| الخدمة | التكلفة |
|--------|---------|
| EC2 t2.micro | مجاني 12 شهر ✅ |
| EBS 30GB | مجاني ✅ |
| Data Transfer | مجاني 100GB/شهر ✅ |
| **المجموع** | **$0** 💚 |

---

## 📞 الدعم

- AWS Documentation: https://docs.aws.amazon.com/ec2/
- AWS Support: مجاني للأسئلة الأساسية
- حسابي Free Tier: https://console.aws.amazon.com/billing/home#/freetier

---

✅ **بعد الانتهاء، سيعمل البوت على:**

```
🌐 http://YOUR_PUBLIC_IP:3000
```

🎉 **مبروك! البوت يعمل 24/7 مجاناً!**
