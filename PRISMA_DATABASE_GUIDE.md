# Prisma Database & Migration Guide

Yeh document aapke Prisma database commands ka reference guide hai. Ise dhyan se follow karein taaki client ka production data hamesha safe rahe.

## 1. Development (Jab aap apne computer par kaam kar rahe hon)

Jab bhi aap `schema.prisma` mein koi naya model ya column add karte hain, toh aapko apne **Local Database** par ye commands chalani hain:

- **Migration Generate & Apply karna:**
  ```bash
  npx prisma migrate dev --name <migration_ka_naam>
  ```
  *Example: `npx prisma migrate dev --name add_user_phone`*
  **Kyu karein?** Yeh aapke schema changes ko database mein apply karta hai aur ek SQL file banata hai `prisma/migrations` folder mein, jise aap GitHub par commit karte hain.

- **Seed Data daalna (Testing ke liye):**
  ```bash
  npm run db:seed
  ```
  *Yeh `prisma/seed.ts` ko run karta hai.*

- **Fast Prototyping (Sirf Local ke liye):**
  ```bash
  npx prisma db push
  ```
  *(Ya `npm run db:push`)*
  *Agar aap shuruati daur mein bar-bar schema change kar rahe hain aur migrations ki SQL history save nahi karna chahte, tab ise local DB par use karein.*

---

## 2. Production (Jab code Client ke Server ya Live DB par jaye)

Production par hum kabhi bhi `migrate dev` ya `db:push` run nahi karte kyunki inmein data delete hone (data loss) ka risk hota hai.

- **Naye Changes Production DB par Apply karna:**
  ```bash
  npx prisma migrate deploy
  ```
  **Kyu karein?** Yeh command database ko kabhi reset (delete) nahi karti. Yeh sirf un safe SQL files ko run karti hai jo aapne local par bana kar Git par push ki thi. Isse client ka data 100% safe rehta hai.

- **Pehli Baar Production DB Setup Karte Waqt (First Deployment):**
  Agar aap naya production server set kar rahe hain aur database khali hai:
  1. `npx prisma migrate deploy` (Database mein saari tables bananane ke liye)
  2. `npm run db:seed` (Agar kuch default/initial data jaise settings ya admin user insert karna ho)

---

## 3. STRICT WARNINGS ⚠️ (KABHI KYA NAHI KARNA HAI)

1. **Production DB par kabhi `npx prisma db push` mat chalana.**
   *Agar aapne galti se chala diya aur schema mein koi mismatch hua, toh yeh database ko force sync karega aur client ka data permanently delete (drop) kar sakta hai.*
   
2. **Production DB par kabhi `npx prisma migrate dev` mat chalana.**
   *Yeh command purely development ke liye hai. Yeh database ko 'Reset' (poora delete karke naya banane) ka option de sakti hai, jisse saara data gayab ho jayega.*

3. **Codebase se `prisma/migrations` folder kabhi delete mat karna.**
   *Yeh folder aapke database ki history hai. Ise hamesha GitHub/Git mein save (commit) karein. Agar ye delete ho gaya toh production DB ki history tut jayegi aur aage update karna bohot mushkil ho jayega.*

---

## Short Summary (Quick Reference)

| Aapko kya karna hai? | Konsi Command Chalani Hai? | Kahan Chalani Hai? |
|----------------------|----------------------------|--------------------|
| Naya column/table add kiya | `npx prisma migrate dev --name <name>` | Apne PC (Local) par |
| Live/Production DB update karna hai | `npx prisma migrate deploy` | Server / Production par |
| Initial/Dummy data insert karna hai | `npm run db:seed` | Local ya First time Prod par |
| Jaldi se tables banani hain (Bina history) | `npx prisma db push` | SIRF Local PC par |
