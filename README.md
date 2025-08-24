# Pet Adoption Backend

## Run
1. `npm i`
2. Copy `.env.example` to `.env` and edit values
3. `npm run dev` → http://localhost:5000

## Endpoints (base: /api)
- `POST   /auth/register` {role,name,email,password}
- `POST   /auth/login` {email,password}
- `GET    /auth/me` (auth)
- `POST   /auth/logout` (auth)

- `GET    /pets` ?text=&species=&age=&size=&location=&breed=&page=&limit=&shelterId=&mine=
- `GET    /pets/:id`
- `POST   /pets` (shelter, multipart: files[])
- `PUT    /pets/:id` (shelter, multipart: files[] optional)
- `DELETE /pets/:id` (shelter)

- `POST   /applications` (adopter) {petId,about,home,havePets}
- `GET    /applications/mine` (adopter)
- `GET    /applications/shelter` (shelter)
- `PATCH  /applications/:id` (shelter) {status}

- `GET    /reviews` ?targetType=&targetId=
- `POST   /reviews` (auth) {targetType,targetId,rating,comment}

- `GET    /messages/threads` (auth)
- `GET    /messages/threads/:id` (auth)
- `POST   /messages` (auth) {threadId?|toUserId, text, petId?}

- `GET    /favorites` (auth)
- `POST   /favorites/toggle` (auth) {petId}

- `GET    /shelters/:id`