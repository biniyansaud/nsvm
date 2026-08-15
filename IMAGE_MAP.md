# School Website Image & Asset Map

This document outlines the exact physical locations of all image assets in the codebase, where they are referenced in the source files, and how they map to the live application.

---

## 📂 Core Asset Directories

All public assets are served statically by the backend server. The physical directories are:

1. **`client/public/images/branding/`**: Contains core branding elements such as the school logo.
2. **`client/public/images/gallery/`**: Contains gallery photos, school background banners, teachers, leadership team, and staff.

---

## 1. School Logos & Branding

| Description | Physical File Path | Code/Reference Path | Used In Codebase |
| :--- | :--- | :--- | :--- |
| **Primary School Logo (JPG)** | `client/public/images/branding/school-logo.jpg` | `/images/branding/school-logo.jpg` | `client/src/components/Header.tsx`, `client/src/components/Footer.tsx`, `client/src/const.ts` |

---

## 2. Core School Backgrounds & Banners

| Description | Physical File Path | Code/Reference Path | Used In Codebase |
| :--- | :--- | :--- | :--- |
| **Hero High-Res Background** | `client/public/images/gallery/school-background-highres.jpg` | `/images/gallery/school-background-highres.jpg` | `client/src/const.ts` (hero background) |
| **Main Campus Banner** | `client/public/images/gallery/school-background.jpg` | `/images/gallery/school-background.jpg` | `client/src/index.css` (custom CSS backgrounds) |
| **Assembly High-Res** | `client/public/images/gallery/assembly-gallery-highres.jpg` | `/images/gallery/assembly-gallery-highres.jpg` | `client/src/const.ts` (assembly/campus life) |
| **Assembly Standby** | `client/public/images/gallery/assembly-gallery.jpg` | `/images/gallery/assembly-gallery.jpg` | Gallery components |
| **Admission Campaign Banner** | `client/public/images/gallery/admission-campaign.jpg` | `/images/gallery/admission-campaign.jpg` | `client/src/const.ts` (notice boards & banner) |

---

## 3. School Leadership & Admin

| Person & Designation | Physical File Path | Code/Reference Path | Referenced In Files |
| :--- | :--- | :--- | :--- |
| **Amraj Bhatt** (Principal) | `client/public/images/staff/principal-AMRAJ-BHATT-SIR.webp` | `/images/staff/principal-AMRAJ-BHATT-SIR.webp` | `client/src/const.ts`, `client/src/lib/siteContent.ts`, `data/content.json` |
| **Vice Principal** | `client/public/images/staff/vice-principal.jpg` | `/images/staff/vice-principal.jpg` | `client/src/const.ts`, `client/src/lib/siteContent.ts`, `data/content.json` |
| **Deep Zenith** (Exam Coordinator) | `client/public/images/staff/deep-zenith-exam-coordinator.jpg` | `/images/staff/deep-zenith-exam-coordinator.jpg` | `client/src/lib/siteContent.ts`, `data/content.json` |
| **Jyoti Joshi** (Accountant) | `client/public/images/staff/jyoti-joshi-accountant.webp` | `/images/staff/jyoti-joshi-accountant.webp` | `client/src/const.ts`, `client/src/lib/siteContent.ts`, `data/content.json` |

---

## 4. Teaching Faculty & Staff

All teacher photos are located under **`client/public/images/gallery/`** and mapped directly in **`client/src/lib/siteContent.ts`** and **`data/content.json`**.

| Name | Designation | Physical File Path | Code/Reference Path |
| :--- | :--- | :--- | :--- |
| **Dipak Joshi** | Teacher | `client/public/images/staff/dipak-joshi.jpg` | `/images/staff/dipak-joshi.jpg` |
| **Harendra Pant** | Teacher | `client/public/images/staff/harendra-pant.webp` | `/images/staff/harendra-pant.webp` |
| **Keshab Pant** | Teacher | `client/public/images/staff/keshab-pant.jpg` | `/images/staff/keshab-pant.jpg` |
| **Lavdev Joshi** | Teacher | `client/public/images/staff/lavdev-joshi.jpg` | `/images/staff/lavdev-joshi.jpg` |
| **Niranjana Rawal** | Teacher | `client/public/images/staff/niranjana-rawal.webp` | `/images/staff/niranjana-rawal.webp` |
| **Padama Pathak** | Teacher | `client/public/images/staff/padama-pathak.webp` | `/images/staff/padama-pathak.webp` |
| **Rewati Joshi Bhatt** | Teacher | `client/public/images/staff/rewati-joshi-bhatt.webp` | `/images/staff/rewati-joshi-bhatt.webp` |
| **Sabina Bhandari** | Teacher | `client/public/images/staff/sabina-bhandari.webp` | `/images/staff/sabina-bhandari.webp` |
| **Shila Acharya** | Teacher | `client/public/images/staff/shila-acharya.webp` | `/images/staff/shila-acharya.webp` |
| **Sunil Pandey** | Teacher | `client/public/images/staff/sunil-pandey.png` | `/images/staff/sunil-pandey.png` |
| **Suresh Bhandari** | Teacher | `client/public/images/staff/suresh-bhandari.webp` | `/images/staff/suresh-bhandari.webp` |
| **Janaki Saud** | Staff | `client/public/images/staff/janaki-saud.webp` | `/images/staff/janaki-saud.webp` |

---

## 5. Gallery & Event Images

These images show real school activities in classroom learning, science exhibitions, sports, tours, and school functions.

| Description | Physical File Path | Code/Reference Path | Referenced In Files |
| :--- | :--- | :--- | :--- |
| **Classroom Learning** | `client/public/images/gallery/focused-classwork.jpg` | `/images/gallery/focused-classwork.jpg` | `client/src/const.ts`, `client/src/lib/siteContent.ts` |
| **Project Work Display** | `client/public/images/gallery/project-work-display.jpg` | `/images/gallery/project-work-display.jpg` | `client/src/const.ts`, `client/src/lib/siteContent.ts` |
| **Food & Science Exhibition** | `client/public/images/gallery/food-science-exhibition-highres.jpg` | `/images/gallery/food-science-exhibition-highres.jpg` | `client/src/const.ts`, `client/src/lib/siteContent.ts` |
| **Sports & Play Time** | `client/public/images/gallery/game-time-highres.jpg` | `/images/gallery/game-time-highres.jpg` | `client/src/const.ts`, `client/src/lib/siteContent.ts` |
| **School Tour Campus** | `client/public/images/gallery/tour-group-campus.jpg` | `/images/gallery/tour-group-campus.jpg` | `client/src/lib/siteContent.ts` |
| **School Tour Memory** | `client/public/images/gallery/tour-group-memory.jpg` | `/images/gallery/tour-group-memory.jpg` | `client/src/const.ts`, `client/src/lib/siteContent.ts` |
| **Educational Outing** | `client/public/images/gallery/educational-tour.jpg` | `/images/gallery/educational-tour.jpg` | `client/src/lib/siteContent.ts` |
| **Annual Program Stage** | `client/public/images/gallery/annual-program-stage.jpg` | `/images/gallery/annual-program-stage.jpg` | `client/src/const.ts`, `client/src/lib/siteContent.ts` |
| **Dashain Festival Tika** | `client/public/images/gallery/dashain-tika.jpg` | `/images/gallery/dashain-tika.jpg` | `client/src/lib/siteContent.ts` |
| **Prize Distribution Day** | `client/public/images/gallery/prize-distribution-highres.jpg` | `/images/gallery/prize-distribution-highres.jpg` | `client/src/const.ts`, `client/src/lib/siteContent.ts` |
| **Award Ceremony Stage** | `client/public/images/gallery/award-ceremony.jpg` | `/images/gallery/award-ceremony.jpg` | `client/src/lib/siteContent.ts` |
| **Guest Felicitation** | `client/public/images/gallery/guest-felicitation.jpg` | `/images/gallery/guest-felicitation.jpg` | `client/src/lib/siteContent.ts` |
| **Evening Program Scene** | `client/public/images/gallery/evening-program.jpg` | `/images/gallery/evening-program.jpg` | `client/src/lib/siteContent.ts` |
| **Green School Program** | `client/public/images/gallery/green-school-activity.jpg` | `/images/gallery/green-school-activity.jpg` | `client/src/lib/siteContent.ts` |
| **Drawing & Arts Gallery** | `client/public/images/gallery/student-drawing.jpg` | `/images/gallery/student-drawing.jpg` | `client/src/lib/siteContent.ts` |
| **School Sports Team** | `client/public/images/gallery/sports-team.jpg` | `/images/gallery/sports-team.jpg` | `client/src/lib/siteContent.ts` |
| **Lamp Lighting Ceremony** | `client/public/images/gallery/lamp-ceremony.jpg` | `/images/gallery/lamp-ceremony.jpg` | `client/src/lib/siteContent.ts` |

---

## 🛠️ Codebase Asset References Locations

If you need to change where an image points, here are the core files in the codebase where these paths are defined:

1. **`client/src/const.ts`**:
   Contains key global paths used for main sections (hero, principal portrait, vp, campus background, notices banner).
2. **`client/src/lib/siteContent.ts`**:
   Contains structured data maps for the gallery categories, active events, and individual school staffs (leadership, teaching faculty, non-teaching staff).
3. **`data/content.json`** & **`server/index.ts`**:
   Contains backend seed data mapped to the administrator dashboard so users can dynamically update page contents through the Admin Control Panel.
4. **`client/src/index.css`**:
   Contains CSS selectors with background imagery (e.g., `.school-bg-header` mapping to `/images/gallery/school-background.jpg`).
