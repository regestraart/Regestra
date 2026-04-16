<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Regestra: Art For Everyone

This contains everything you need to run and deploy the Regestra platform.

## ⚠️ Critical Backend Setup (Supabase)

**For the app to function correctly (User Accounts, Messaging, Social Feed), you MUST provision your Supabase instance using the provided SQL script.**

### 1. Run the Initialization Script
1.  Open your **Supabase Project Dashboard**.
2.  Navigate to the **SQL Editor** tab on the left sidebar.
3.  Click **"New Query"**.
4.  Open the file `supabase_schema.sql` located in this project's root.
5.  **Copy the entire contents** of that file.
6.  Paste it into the Supabase SQL Editor window.
7.  Click **"Run"**.

This script sets up all tables, Row Level Security (RLS) policies, and critical database triggers that automate profile creation and fix messaging recursion errors.

### 2. Manual Storage Setup
If you want to support image uploads, you must create the following public buckets in the **Storage** section of your Supabase dashboard:
*   `artworks`: For gallery images and social post images.
*   `avatars`: For user profile pictures.

**Instructions:**
1. Go to **Storage** in Supabase.
2. Click **New Bucket**.
3. Name it `artworks` and toggle **Public Bucket** to ON.
4. Repeat for `avatars`.

---

## Run Locally
1. Install dependencies: `npm install`
2. Set the `GEMINI_API_KEY` in `.env`.
3. Run the app: `npm run dev`
