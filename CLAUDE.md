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

### Phase 2A: Virtual Try-On

- [ ] Research and select virtual try-on API (FASHN.ai, Google Vertex AI, or AILab Tools)
- [ ] Set up Supabase Edge Function for API calls
- [ ] Add selfie upload to Outfit tab
- [ ] Generate try-on images from selected outfit
- [ ] Save/share generated outfits

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

Phase 1 MVP in progress - basic wardrobe management with auth and image upload working. Outfit builder (manual outfit creation) is complete. Virtual Try-On planned for Phase 2A.

## Known Issues & TODOs

### Auth (to be addressed before production)

- [ ] Email confirmation disabled for development - need to re-enable and set up deep linking for email verification redirect
- [ ] Password reset/forgot password flow not implemented
- [ ] Email change flow not implemented

### Future Auth Improvements

- [ ] Social login (Google, Apple)
- [ ] Proper deep linking setup for Expo (email confirmation, password reset links)

### Clothing Extraction (to be addressed before production)

- [ ] Move Photoroom API key from client-side env var to Supabase Edge Function for security

## Architecture Notes

- Supabase Storage for clothing images
- Supabase Postgres for clothing metadata
- Row Level Security (RLS) for user data isolation

## Virtual Try-On Architecture (Future)

- Supabase Edge Function as API proxy
- Virtual try-on API options: FASHN.ai (recommended), Google Vertex AI, AILab Tools
- Flow: User selfie + clothing images → Edge Function → Try-on API → Generated image

## Command Quick notes

- npx expo start
- git status
- git add . (Adds everything in the current directory and subdirectories, including hidden files.)
- git commit -m "msg"
- git push origin master
