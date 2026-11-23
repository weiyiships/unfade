# PRD: Unfade Photo Restoration App

**Owner:** Weiyi Sun

---

## 1. Overview

A simple web app that lets people restore old photographs in the browser. Users upload a blurry, faded, scratched, or damaged photo, choose restoration options (general repair, face enhancement, colorization, upscaling), compare the original and restored images side by side, and download the result. Users with an account can come back later to view and download their past restorations without running them again.

## 2. Problem hypothesis

Old photographs become blurry, faded, scratched, or damaged over time. People who want to restore family photos often have to move images through several apps, learn professional editing software, or accept a one-click result they cannot control. There is no simple place to restore a photo, see what changed, and keep the results.

## 3. Goals

- G1: A user can upload a photo and get a restored version in under 1 minute, with no editing skills.
- G2: A user can choose which restorations to apply (repair, faces, color, upscale).
- G3: A user can compare the original and restored images before saving.
- G4: A returning user can find and download any past restoration without reprocessing it.

## 4. Non-goals

- Manual editing tools (brushes, layers, cropping, curves, or retouching)
- Training or hosting our own restoration models
- Video restoration or batch processing of whole albums (v1)
- Physical photo scanning, printing, or ordering prints
- Payments, subscriptions, or credit systems
- Social sharing feeds, public galleries, or collaboration
- Native mobile apps (responsive web only)
- Social login, email verification, and password-reset emails (v1)

## 5. Users

| Role         | Description                                                            | Auth                             |
| ------------ | ---------------------------------------------------------------------- | -------------------------------- |
| Visitor      | Casual user who wants to restore one photo without creating an account | None                             |
| Account user | Person restoring family photos who wants to keep a history of results  | Email and password (JWT session) |

## 6. User stories

Each story rests on an assumption to test (Mom Test).

| ID   | Priority | Story                                                                                                                         | Assumption                                                                    |
| ---- | -------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| US-1 | P0       | As a user, I want to upload an old or damaged photograph, so I can restore it directly in my browser.                         | People have old photos (scanned or phone-captured) they want to fix.          |
| US-2 | P0       | As a user, I want to automatically enhance blurry or damaged photos using AI, so I can improve their visual quality.          | Existing tools are too complex or scattered across several apps.              |
| US-3 | P0       | As a user, I want to choose restoration options such as face enhancement, colorization, or upscaling, so I can improve specific aspects of my photo. | One-size-fits-all results are not good enough; users want some control.       |
| US-4 | P0       | As a user, I want to compare the original and restored images, so I can see the improvements before saving.                  | Users don't trust a restoration until they can see what changed.              |
| US-5 | P0       | As a user, I want to download my restored photographs, so I can save and share them with family and friends.                  | The end goal is sharing restored photos outside the app.                      |
| US-6 | P1       | As a user, I want to view my previously restored photos, so I can access my results without repeating the restoration process. | Users restore several photos over time and come back to them.                 |
| US-7 | P1       | As a user, I want to sign up and log in, so my restorations are saved to my account.                                          | Users will create an account if it means keeping their results.               |

## 7. Functional requirements and acceptance criteria

**FR-1 Photo upload (US-1)**

- Users can upload by file picker or drag and drop; on mobile, the file picker also allows the camera.
- Accepted formats: JPEG, PNG, and WebP, up to 10 MB.
- Unsupported files or files that are too large show a clear error and are not uploaded.
- A preview of the uploaded photo is shown before restoration starts.
- Uploading works without an account.

**FR-2 AI restoration (US-2)**

- A "Restore" action sends the photo to the AI restoration API with the selected options.
- General restoration (reduce blur, noise, scratches, and fading) is on by default.
- The page shows progress while the job runs and does not require a page refresh.
- If the API fails or times out, the user sees an error and can retry without uploading again.
- Restoration requests are validated and rate-limited server-side (for example, 10 restorations per user or IP per hour).

**FR-3 Restoration options (US-3)**

- Options: general restoration, face enhancement, colorization (for black-and-white photos), and upscaling (2x or 4x).
- Options can be combined; they run in a fixed order (restore, then faces, then colorize, then upscale).
- Each option has a one-line description so non-experts understand what it does.
- The selected options are saved with the result.

**FR-4 Before and after comparison (US-4)**

- Results show a before and after slider over the original and restored images.
- Users can also switch to a side-by-side view.
- Users can zoom in to inspect details such as faces.
- Users can rerun the restoration with different options from the comparison screen.

**FR-5 Download (US-5)**

- Users can download the restored image as PNG or JPEG.
- The downloaded file keeps the full restored resolution.
- The file name includes the original name and a "restored" suffix.

**FR-6 Restoration history (US-6)**

- Logged-in users have a "My photos" page listing past restorations, newest first.
- Each entry shows a thumbnail, the options used, and the date.
- Opening an entry shows the comparison view and download button without reprocessing.
- Users can delete a restoration, which removes both the original and restored images from storage.
- Users can see only their own photos; requests for another user's photos are rejected server-side.
- Visitor restorations are not saved to history, and are deleted from storage after 24 hours.

**FR-7 Signup and login (US-7)**

- Signup asks for name, email, and password; restoring without an account remains available.
- Email must be valid and unique (case-insensitive). Password must be at least 8 characters.
- Passwords are hashed (bcrypt or argon2) and never stored or logged in plain text.
- Successful signup or login sets a signed JWT in an httpOnly, secure, same-site cookie that expires after 7 days.
- Failed login shows a generic "Invalid email or password" message.
- Login attempts are rate-limited (for example, 5 failed attempts per email per 15 minutes).
- Logout clears the session cookie.

## 8. Non-functional requirements

- Responsive and usable at 375px width
- Upload starts within 1 second of choosing a file; a typical restoration finishes in under 60 seconds
- Uploaded and restored images are private: stored with unguessable URLs and served only to their owner
- Photos are never used for training or shared with third parties beyond the restoration API
- API keys are kept server-side and never exposed to the browser
- Input validation (file type, size, options) on the server
- Small scale is enough (about 20 concurrent users)

## 9. Technical approach

| Layer          | Choice                                                                                                     |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| Framework      | Next.js (App Router), TypeScript                                                                           |
| UI             | Tailwind CSS + shadcn/ui                                                                                   |
| AI restoration | Replicate (restoration, face enhancement, colorization, and upscaling models) or Gemini image editing; called from server routes only |
| Image storage  | Vercel Blob (private) for originals and results                                                            |
| DB             | Postgres (Neon via Vercel Marketplace)                                                                     |
| ORM            | Drizzle                                                                                                    |
| Job status     | Polling every 2 to 3s while a restoration runs                                                             |
| Auth           | JWT in httpOnly cookies, email and password (bcrypt or argon2 hashing); route protection in Next.js middleware |
| Tests          | Vitest (unit), Playwright (end-to-end upload, restore, and download flow)                                  |
| Deploy         | Vercel + GitHub Actions CI                                                                                 |

**Core data model (draft)**

- `user(id, name, email, password_hash, created_at)` (email unique)
- `photo(id, user_id, original_url, file_name, width, height, created_at)` (user_id nullable; null for visitor uploads)
- `restoration(id, photo_id, options_json, status, result_url, error, created_at, completed_at)` (status: queued, processing, succeeded, failed)

## 10. Success metrics

Measured with at least 5 real users restoring their own old photos:

- At least 80% of users complete upload, restore, and download without help
- At least 70% of users rate the restored photo as better than the original
- Median time from clicking "Restore" to seeing the result is under 60 seconds
- At least 50% of users try more than one restoration option (control signal)
- At least 1 user returns on a later day to restore another photo without being asked (time commitment signal)
- At least 1 user shares a restored photo with family or friends (value signal)

## 11. Milestones

1. **Setup:** repo, CI, test harness, DB schema and migrations, Blob storage
2. **Validation:** Mom Test conversations; compare candidate restoration models on sample photos; revise this PRD
3. **P0 build:** US-1 to US-5 as small tickets, each with tests
4. **P1:** signup and login, restoration history
5. **Real-world test:** run with real users and their own photos, collect metrics
6. **Review:** compare results against success metrics and decide next steps
7. **Stretch (if time):** batch upload, scratch-mask selection, shareable links
