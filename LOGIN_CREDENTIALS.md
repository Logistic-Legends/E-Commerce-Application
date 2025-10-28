# 🔐 Login Credentials - Demo Accounts

## Mock Authentication System

The app is currently running in **MOCK MODE** - it works without a backend server!

---

## 📝 Demo Accounts

### 👨‍💼 Admin Account
```
Email: admin@test.com
Password: admin123
```
- Access to admin panel
- Product management
- Order management
- Customer management

### 👤 User Account
```
Email: user@test.com
Password: user123
```
- Regular user access
- Shopping features
- Cart & Checkout
- Order history

---

## 🆕 Create New Account

You can also **register a new account** with any email and password!
- Go to Register screen
- Enter any email, password, and name
- Account will be created instantly (mock mode)

---

## 🔄 How It Works

### Mock Mode (Current)
- ✅ No backend required
- ✅ Data stored locally in AsyncStorage
- ✅ Works immediately
- ⚠️ Data is lost when app is cleared

### Real API Mode (When Backend is Ready)
To switch to real API:
1. Start your backend server
2. Update API URL in `config/api.ts`
3. Uncomment the API code in `context/AuthContext.tsx`
4. Comment out the mock code

---

## 📍 Files Modified for Mock Auth

1. **context/AuthContext.tsx**
   - Mock login function
   - Mock register function
   - Local data storage

2. **config/api.ts**
   - API endpoints configuration
   - Ready for backend integration

---

## 🚀 Quick Start

1. **Run the app:**
   ```bash
   npm start
   ```

2. **Choose login method:**
   - Use demo accounts (admin@test.com or user@test.com)
   - OR register a new account

3. **Start shopping!**

---

## 🔧 Troubleshooting

### Login not working?
- Make sure you entered the correct credentials
- For demo accounts, use exact email and password
- Check console for error messages

### Want to use real backend?
- Start your backend server
- Update `API_URL` in `config/api.ts`
- Uncomment API code in `AuthContext.tsx`

---

## 📞 Need Help?

Contact your team lead or check the documentation!

**Happy Shopping! 🛍️**
