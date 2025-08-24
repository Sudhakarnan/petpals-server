# Pet Adoption Platform — Backend (Express + MongoDB + JWT + Email + Uploads)

API server for the Pet Adoption Platform:

- JWT auth (register/login/me/logout)
- Pets CRUD + search + file uploads (images/videos)
- Applications (create, list mine / list received, status updates)
- Messages (threaded, per pet)
- Reviews
- Favorites
- CORS + static uploads
- Email notifications (SMTP/Mailtrap)

---

## 1) Tech Stack

- **Node.js 18+**, **Express**
- **MongoDB / Mongoose**
- **JWT (jsonwebtoken)**
- **Multer** (file uploads -> `public/uploads`)
- **Nodemailer** (SMTP)
- **CORS**, **Morgan**

---

## 2) Folder Structure

```
src/
├─ server.js
├─ app.js
├─ config/
│  ├─ db.js
│  └─ mailer.js
├─ middleware/
│  ├─ auth.js
│  └─ roles.js (optional if you keep roles)
├─ models/
│  ├─ User.js
│  ├─ Pet.js
│  ├─ Application.js
│  ├─ Review.js
│  ├─ MessageThread.js
│  └─ Favorite.js
├─ controllers/
│  ├─ auth.controller.js
│  ├─ pets.controller.js
│  ├─ applications.controller.js
│  ├─ reviews.controller.js
│  ├─ messages.controller.js
│  └─ favorites.controller.js
├─ routes/
│  ├─ auth.routes.js
│  ├─ pets.routes.js
│  ├─ applications.routes.js
│  ├─ reviews.routes.js
│  ├─ messages.routes.js
│  ├─ favorites.routes.js
│  └─ shelters.routes.js (optional)
├─ services/email.service.js
├─ upload/multer.js
├─ utils/asyncHandler.js
└─ public/uploads/            # served at /uploads
```

---

## 3) Install & Run

```bash
# from pet-adoption-backend/
npm install

# copy env
cp .env.example .env
# Windows: copy .env.example .env

# run dev (nodemon)
npm run dev

# or prod
npm start
```

Server defaults to `http://localhost:5000`.

---

## 4) Environment Variables

`.env.example`
```env
# Server
PORT=5000
# Single URL or comma-separated list (e.g., local + Netlify)
CLIENT_URLS=http://localhost:5173

# Database
MONGODB_URI=mongodb://127.0.0.1:27017/petpals

# JWT
JWT_SECRET=change_me_to_a_long_random_string
JWT_EXPIRES_IN=7d

# SMTP (Mailtrap example)
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_user
SMTP_PASS=your_pass
SMTP_FROM="PetPals <noreply@petpals.local>"
```

> If you deploy to Render/Heroku, set all of these in the dashboard, then redeploy.

---

## 5) CORS

In `src/app.js`:

```js
cors({
  origin: process.env.CLIENT_URLS?.split(',') || ['http://localhost:5173'],
  credentials: true,
  exposedHeaders: ['Authorization'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})
```

Add both your Netlify and local URLs if you use both, e.g.:

```
CLIENT_URLS=https://your-app.netlify.app,http://localhost:5173
```

---

## 6) Uploads

- Files go to `src/public/uploads`.
- Static server: `app.use('/uploads', express.static(...))`.
- Store each photo as **`/uploads/<filename>`** in Mongo.
- Frontend should convert relative `/uploads/...` to absolute using the backend origin.

---

## 7) Endpoints (base: `/api`)

**Auth**
- `POST /auth/register` — `{ name, email, password, [role] }`
- `POST /auth/login` — `{ email, password }`
- `GET  /auth/me` — (auth)
- `POST /auth/logout` — (auth, optional)

**Pets**
- `GET  /pets` — filters: `text,species,age,size,location,breed,page,limit,mine`
- `GET  /pets/:id`
- `POST /pets` — (auth) multipart: `files[]` + fields
- `PUT  /pets/:id` — (auth) optional `files[]`
- `DELETE /pets/:id` — (auth) cascades applications/messages/favorites for that pet

**Applications**
- `POST /applications` — (auth) `{ petId, about, home, havePets }`
- `GET  /applications/mine` — (auth) applications I sent
- `GET  /applications/received` — (auth) applications for pets I own
- `PATCH /applications/:id` — (auth owner of pet) `{ status }`
- `DELETE /applications/:id` — (auth) withdraw (applicant) or remove (owner)

**Messages**
- `GET  /messages/threads` — (auth) my threads
- `GET  /messages/threads/:id` — (auth) one thread
- `POST /messages` — (auth) `{ threadId? | toUserId, text, petId? }`
- Optional: `DELETE /messages/:threadId/:messageId?for=me` (if you added “delete for me”)

**Favorites**
- `GET  /favorites` — (auth)
- `POST /favorites/toggle` — (auth) `{ petId }`

**Reviews**
- `GET  /reviews?targetType=pet|shelter&targetId=<id>`
- `POST /reviews` — (auth) `{ targetType, targetId, rating, comment }`

**Shelters (optional)**
- `GET /shelters/:id` — public profile + their pets

---

## 8) Health Check

- `GET /api/health` → `{ ok: true }`  
  Useful to confirm Render is up.

---

## 9) Quick cURL Tests

```bash
# health
curl https://your-backend.onrender.com/api/health

# register
curl -X POST https://your-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"testuser1@gmail.com","password":"test@123"}'

# login
curl -X POST https://your-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser1@gmail.com","password":"test@123"}'
# -> save "token" and use:
TOKEN=xxxxx

# me
curl -H "Authorization: Bearer $TOKEN" https://your-backend.onrender.com/api/auth/me
```

---

## 10) Deployment (Render)

- Build command: **none** (Node server)
- Start command: `node src/server.js`
- Environment:
  - `PORT=10000` (Render sets automatically)
  - `CLIENT_URLS=https://your-netlify-site.netlify.app`
  - `MONGODB_URI=...`
  - `JWT_SECRET=...`
  - SMTP fields if you use email

**Static uploads on Render:** they are stored on the instance file system (ephemeral for free plans). For production, use S3 or another object store.

---

## 11) Common Pitfalls / Fixes

- **401 Unauthorized in production:**  
  - You logged in on a different environment—log in again on the live site.  
  - `JWT_SECRET` changed—reissue tokens by logging in again.  
  - Axios missing header—ensure your frontend attaches `Authorization` from `localStorage`.

- **CORS blocked:**  
  - Add your frontend URL to `CLIENT_URLS` (comma separated).  
  - Redeploy server after changing env.

- **Images not loading:**  
  - Path should be `/uploads/filename`.  
  - Frontend must prefix with backend origin (`https://your-backend/...`).

- **Mongo connection error:**  
  - For Atlas, whitelist your IP or set `0.0.0.0/0` for dev.  
  - Ensure SRV string & username/password are correct.

---

## 12) Scripts

```json
{
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js"
  }
}
```

---

## 13) Demo Users

Create once via `POST /auth/register` or from the frontend:

- **Test User 1** — `testuser1@gmail.com` / `test@123`  
- **Test User 2** — `testuser2@gmail.com` / `test@123`

---

## 14) License

MIT (use freely in coursework or projects)
