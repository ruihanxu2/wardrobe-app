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
Phase 1 MVP in progress - basic wardrobe management with auth and image upload working.

## Known Issues & TODOs

### Auth (to be addressed before production)
- [ ] Email confirmation disabled for development - need to re-enable and set up deep linking for email verification redirect
- [ ] Password reset/forgot password flow not implemented
- [ ] Email change flow not implemented

### Future Auth Improvements
- [ ] Social login (Google, Apple)
- [ ] Proper deep linking setup for Expo (email confirmation, password reset links)

## Architecture Notes
- Supabase Storage for clothing images
- Supabase Postgres for clothing metadata
- Row Level Security (RLS) for user data isolation
