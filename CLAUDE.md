# Wardrobe App

## Vision
A wardrobe management app that helps users organize their clothes, track what they wear, and eventually get outfit recommendations and social features.

## Tech Stack
- **Frontend:** Expo (React Native)
- **Backend:** Supabase (Auth, Database, Storage)

## Feature Roadmap

### Phase 1: Core MVP
- [ ] User authentication (Supabase Auth)
- [ ] Add clothing items (photo capture or upload)
- [ ] Input metadata: category, color, brand, etc.
- [ ] View wardrobe gallery
- [ ] Basic CRUD for clothing items

### Phase 2: Enhanced Features
- [ ] Scan coupons
- [ ] VLM integration for auto-tagging clothes
- [ ] Outfit recommendations based on wardrobe
- [ ] Generate outfit suggestions from user photo
- [ ] Wear tracking / "not worn in a year" alerts

### Phase 3: Social Features
- [ ] Share outfits publicly
- [ ] Buy/sell marketplace
- [ ] Virtual try-on (see how others' outfits look on you)

## Current Status
Setting up Phase 1 MVP - basic wardrobe management with auth and image upload.

## Architecture Notes
- Supabase Storage for clothing images
- Supabase Postgres for clothing metadata
- Row Level Security (RLS) for user data isolation
