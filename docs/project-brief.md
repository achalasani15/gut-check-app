# Project Brief: Gut Check

**Version:** 2.0 (Post-MVP Definition)
**Status:** MVP Functionally Complete, Ready for Polish/Next Steps

---

## 1. The Core Idea & Vision

**App Name (Working Title):** Gut Check
**Core Concept:** An intelligent diet and health journaling app designed specifically for dogs with sensitive stomachs, allergies, or GI issues.
**Guiding Star (Design Philosophy):** "Supportive & Approachable." The app should feel clean, calm, and easy to use, but infused with personality and warmth through friendly icons, illustrations, and encouraging language.

---

## 2. The Core Problem (The "Why")

For owners of dogs with sensitive stomachs, allergies, or chronic gastrointestinal issues, it is a stressful, time-consuming, and often inconclusive process to manually track their dog's diet, identify symptom triggers, and effectively communicate this complex information to a veterinarian. This leads to prolonged discomfort for the pet and significant emotional and financial strain for the owner.

---

## 3. MVP Feature Set & User Stories

The MVP will be a fast, simple, and indispensable daily logging tool that allows users to easily track inputs and outputs, identify potential triggers, and get a high-level view of their pet's health.

### P1-01: Simple Pet Profile

* **User Story:** As a new user, I want to quickly add my pet's name so the experience feels personalized for them.

### P1-02: Unified Logging

* **User Story:** As a user, I want to quickly log food (with quantity), stool (using a visual scale), symptoms, and notes from a single, simple interface so I can capture data efficiently.
* **P1-02a: Scavenging Log**
  As part of a food log, I want to mark an item as "scavenged" so I can easily track high-risk ingestion events.
* **P1-02b: Safe Food Marker**
  As part of a food log, I want to mark a food as "safe" so it doesn't appear in my trigger analysis.

### P1-03: Interactive Timeline

* **User Story:** As a user, I want to see a clear, chronological timeline of all my logs so I can review my pet's history.
* **P1-03a: Smart Trigger Display**
  On a problematic stool log, I want the app to automatically show me a list of potential food triggers from the last 24 hours, weighted by how likely they are to be the cause, so I don't have to search manually.

### P1-04: Edit & Delete Logs

* **User Story:** As a user, I want to be able to edit or delete any log entry so I can correct mistakes and keep my data accurate.

### P1-05: Timeline Filtering & Search

* **User Story:** As a user, I want to filter my timeline by log type (Food, Stool, etc.) and search by keywords so I can quickly find specific entries.

### P1-07: Settings & Data Management

* **User Story:** As a user, I want a simple settings page where I can restart my journal or delete my pet's data entirely to start fresh.

### P1-08: Health Report / Dashboard

* **User Story:** As a user, I want a single report screen that summarizes my dog's health over time with a simple trend graph and highlights the top potential triggers, so I can understand the big picture.

---

## 4. Post-MVP Roadmap (Future Features)

This is a running list of features we will build after the MVP is stable and validated.

* **Daily Gut Score & Analytics:** A more advanced dashboard with daily scores, charts, and trends to visualize health over time.

  * Positive Trend Analysis: The system will also identify foods and activities that consistently lead to healthy stool events.
  * Frequency Analysis: The system will analyze the frequency of stool events and the time between them to help inform diagnoses.

* **Deep Dive Investigation Mode:** An interactive mode in the report where clicking a trigger filters the timeline to show only logs relevant to that trigger and its associated outcomes.

* **"Safe Introduction" Wizard:** A guided, 7-day protocol for safely introducing new foods to a sensitive dog.

* **"Food Switching" Guide:** A feature to guide users through a gradual, 7-day kibble transition to minimize GI upset.

* **Image Attachments:** The ability to add photos to food and stool logs for better visual records for the user and their vet.

* **Weight Tracking:** A feature to log the pet's weight over time, another key health metric.

* **Vet-Ready Summary:** A feature to export a clean, data-driven PDF summary to share with a veterinarian.

* **Issue Diagnoser:** A more advanced AI feature that looks at symptoms and logs to help a user investigate root causes.

* **Smarter Add Button:** The "+" button will intelligently default to the next logical log type (e.g., suggesting "Stool" after a "Food" log).

* **Food Glossary:** A dedicated screen that lists all foods ever logged, allowing the user to see and manage their "safe" vs. "problematic" status.

* **Symptom Database:** Evolve the free-text symptom entry into a selectable list of common symptoms for better data consistency and reporting.

* **Co-parent/Family Sign-in:** Allow multiple users to log events for the same pet profile.

* **Recipe & Multi-Ingredient Support:** Allow users to log meals with multiple ingredients (e.g., a "Frozen Kong" with peanut butter and kibble).

* **Supplement Tracking:** A dedicated logging category for supplements, which are often a key part of a sensitive dog's diet.

* **Copy/Duplicate Log:** The ability to easily duplicate a previous log entry to speed up logging of routine meals.

* **Multiple pets:** Allow users to log for multiple pets.

---

## 5. Data Models

**Pet:**
`{ petId, userId, name, createdAt }`

**Log:**
`{ logId, userId, petId, timestamp, type: ('food'|'stool'|'symptom'|'note'), data: {...} }`

**Food Data:**
`{ name, quantity, isScavenged, isSafe }`

**Stool Data:**
`{ type: (1-5) }`

**Symptom Data:**
`{ description }`

**Note Data:**
`{ text }`
