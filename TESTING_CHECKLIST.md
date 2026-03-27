# Testing Checklist — CodePro.io CMS Integration

## Backend API

- [ ] `GET /health` returns 200
- [ ] `POST /api/auth/login` with correct creds returns tokens
- [ ] `POST /api/auth/login` with wrong creds returns 401
- [ ] `GET /api/courses/` returns courses
- [ ] `POST /api/courses/` without auth returns 401
- [ ] `GET /api/content/all` returns all sections (meta, home, about, contact)
- [ ] `GET /api/contact/` returns contact info

## Admin Dashboard

- [ ] Login at `localhost:4322/admin/login` works
- [ ] Dashboard shows correct course count from live API
- [ ] Create new course → appears in course list
- [ ] Edit course → changes saved and reflected
- [ ] Delete course → removed from list
- [ ] Toggle course publish status → works
- [ ] Save homepage content → changes persisted
- [ ] Save about page content → changes persisted
- [ ] Save contact info → changes persisted
- [ ] Change password → works with correct current password

## Main Website (SSR)

- [ ] Homepage loads without errors
- [ ] Hero section shows content from API (or fallback if API down)
- [ ] Stats bar renders correctly
- [ ] Tech badges render from API
- [ ] Featured courses show API courses
- [ ] Courses carousel shows all published courses
- [ ] `/courses/` page shows courses from API with filters
- [ ] `/courses/[slug]` pages work for each course
- [ ] About page shows API content (story, team, vision/mission)
- [ ] Contact page shows live contact details
- [ ] Footer shows live contact info and social links
- [ ] Header shows live institute name and phone
- [ ] Notification banner shows when promo text is set
- [ ] Notification banner hidden when promo text is empty

## Fallback Behavior (API Down)

- [ ] Stop the backend API
- [ ] Homepage still loads with fallback content
- [ ] Courses page shows fallback courses
- [ ] Footer shows static fallback values
- [ ] No uncaught errors or blank pages
- [ ] `GET /api/health` on main site returns 503 with degraded status

## End-to-End Integration

- [ ] Admin edits hero headline → refresh main site → new text appears (within 30s or after cache bust)
- [ ] Admin adds new course → appears on `/courses/`
- [ ] Admin unpublishes course → disappears from main site
- [ ] Admin updates phone number → appears in footer
- [ ] Admin sets promo banner text → banner appears on main site
- [ ] Admin clears promo banner text → banner disappears
- [ ] `POST /api/cache-bust?secret=...` → cache cleared, changes reflect immediately
