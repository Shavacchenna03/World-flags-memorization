World Flags — Product Specification v1.0
Status: Proposed specification · Scope: MVP · Implementation: Not started
The decisions are now clear enough to define a concrete first release. We'll build a polished, local-first application that teaches you to identify all 195 country flags through continent-based learning, active recall, and adaptive spaced repetition.
The central product principle is:
Seeing a flag is exposure. Answering correctly is recall. Remembering it across separate days is mastery.
The MVP should optimize for the third outcome, not merely for quiz scores.
1. Product definition
World Flags
A personal, adaptive learning application for mastering the national flags of 195 countries.

Primary objective
Help the learner identify every flag accurately and retain that knowledge over time.


Learning structure
Seven continents, with a defined rule for assigning transcontinental countries.


Learning methodology
Batches of 10 new flags, three mastery stages, and adaptive review scheduling.


Data and persistence
Locally bundled country data and SVGs, with learning progress stored in the browser.


Visual direction
Modern, minimal, polished educational dashboard—not a childish game or a dense reference encyclopedia.



Target user and use case
One learner using the application regularly, in short sessions, with the freedom to stop and resume at any time. The application must work without a backend account or runtime dependency on an external flag API.
What the MVP is not
- A multiplayer quiz or leaderboard platform.
- An AI-powered geography chatbot.
- A comprehensive world-history encyclopedia.
- A cloud-synchronized, multi-user service.
- A sophisticated flag-image recognition model.
These can be reconsidered later, but they aren't needed to achieve the primary learning objective.
2. MVP feature specification
Feature A — Home dashboard
The home screen should answer three questions immediately: What have I learned? What should I review? What should I learn next?
ILLUSTRATIVE DASHBOARD LAYOUT
Your learning journey
Introduced
60 / 195


Mastered
24 / 195


Due for review
12


Current stage
Familiar



Continue learning
Europe · Next batch: 10 countries


Illustrative values only—not actual learner progress.


Required behavior:
- Show introduced, familiar, and mastered country counts.
- Show the number of reviews currently due.
- Provide a clear action to continue the learning path.
- Show continent-level progress.
- Restore the dashboard correctly after the browser is reopened.
Feature B — Continent-based learning path
Use the seven-continent model: Africa, Antarctica, Asia, Europe, North America, South America, and Oceania.
Since the core scope is 195 countries, Antarctica will have no country flags in the learning path. It can remain visible as a geographical category or be omitted from the progression interface.
For a consistent country assignment, use a single primary continent per country. Russia and Türkiye, for example, need an explicit assignment rule. The rule should be documented and independent of the API's regional classifications.
Required behavior:
- Display continent cards with progress indicators.
- Introduce 10 previously unintroduced countries per batch.
- Allow the learner to resume an incomplete batch.
- Keep previously learned flags available for review.
- Avoid introducing the same country twice as a new country.
- Handle the final batch when fewer than 10 countries remain in a continent.
A batch is a learning unit, not a guarantee that all 10 countries will be mastered in one session.
Feature C — Three practice modes









1. Multiple choice
Four answer options, immediate correctness feedback, and an explanation of the distinguishing feature when useful.
Purpose: initial recognition and early practice.












2. Typed recall
Display a flag without its name. The learner enters the country name. Normalize capitalization, whitespace, and approved aliases before judging the answer.
Purpose: retrieve the country without answer options.












3. Flashcards
Show the flag, let the learner attempt recall, reveal the answer, and collect a self-rating such as Again, Hard, Good, or Easy.
Purpose: scheduled revision and recall-strength assessment.



The learner can practice previously introduced countries at any time. Practice modes should not be allowed to accidentally mark a country mastered merely because it appeared in a question.
Feature D — Three-stage mastery system
The stages represent evidence of learning, not just progress through the continent list.

Stage 1 — Learning
New or not yet reliably recalled
The country has been introduced but has not met the criteria for Familiar. It receives frequent practice, including feedback after mistakes.




Stage 2 — Familiar
Demonstrated recall, but retention is not yet established
The learner has recalled the country correctly on multiple occasions. Reviews continue, with increasing intervals when recall is successful.




Stage 3 — Mastered
Repeated independent recall across time
The country meets defined recall and spacing criteria. It still remains eligible for periodic maintenance reviews.



We'll finalize the precise thresholds in the acceptance checklist below. The core rule is that one successful answer must never be sufficient for mastery.
Feature E — Adaptive spaced repetition
Every country gets its own review schedule. The scheduler decides what to show next based on its learning stage, past recall, and due date.
The MVP should use a transparent scheduling algorithm with configurable intervals. We should avoid choosing arbitrary intervals without testing them; the initial values can be conservative defaults and adjusted after real usage.
Required behavior:
- Prioritize overdue reviews and countries still in Learning.
- Schedule successful reviews farther into the future.
- Bring a country back sooner after an incorrect answer.
- Treat multiple-choice success as weaker evidence than independent typed recall.
- Respect the learner's current session and avoid endless repetitive questions.
- Persist the next review date and last review outcome.
Mastered countries are reviewed less often, not permanently removed from practice.
Feature F — Progress and statistics
The dashboard must distinguish exposure, recent performance, and long-term retention.
Metric	Definition
Introduced	Countries that have entered the learning path
Familiar	Countries that have met the Familiar-stage criteria
Mastered	Countries that meet the final mastery criteria
Due reviews	Countries whose next review date has arrived
Recall accuracy	Correct answers divided by eligible answered questions
Weak flags	Countries with repeated errors or poor recall
Continent completion	Stage distribution for each continent
We should not use a single overall accuracy percentage as the definition of mastery. A learner can score highly on familiar flags while still forgetting flags learned weeks earlier.
Feature G — Confusing-flag training
For the MVP, this should be a small, curated capability rather than a large flag-similarity engine.
- Maintain a reviewed list of visually similar flag pairs.
- Explain the key distinguishing characteristic of each pair.
- Let the learner compare the flags side by side.
- Use recorded mistakes to prioritize relevant comparisons.
We'll add these entries to visual-features.json only when the descriptions and relationships have been checked. Automatic visual similarity detection is outside the MVP.
Feature H — Local persistence and data protection
Learning progress will be stored in the browser. There is no account, server database, or synchronization requirement for the first release.
Required behavior:
- Persist country stages, review dates, and review history.
- Restore progress after refreshing or reopening the application.
- Keep progress separate from the canonical country metadata.
- Version the stored progress schema so future changes can be migrated safely.
- Provide an export and import mechanism for backing up progress.
- Validate imported data before replacing existing progress.
A key limitation: browser-local data can be lost if the browser's site data is cleared. Backup and restore should therefore be included in the MVP rather than left as an afterthought.
3. Technical specification
Area	Decision
Application	Next.js + TypeScript
UI	Responsive, modern educational dashboard
Country data	Existing JSON registry
Flag images	Locally bundled SVGs
Learning logic	Independent TypeScript modules
Progress storage	Browser-local persistence
Testing	Unit tests for scheduling, mastery and answer evaluation
Backend	Not required for the MVP
AI/API dependency	None required at runtime
Deployment	Static-friendly Next.js deployment where compatible with the chosen features
The country registry, learning metadata, and learner progress should remain separate. This allows us to revise the learning algorithm without changing the source country records.
One additional requirement: before application implementation, we should complete the country-scope and flag-asset audits to the level of confidence you want. The automated checks have passed, but they don't independently prove every flag is correct.
4. Concrete MVP acceptance checklist
These are the conditions that must be met before we consider the first release complete. The checkboxes are a specification checklist, not a claim that these features have already been implemented.
MVP readiness
0 / 31 checked



A. Data and application foundation
[ ] Load all 195 country records without runtime API calls.
[ ] Render all bundled flag SVGs with correct country names and accessible alternative text.
[ ] Assign each country to exactly one primary continent under documented rules.
[ ] Handle unusual flag aspect ratios without distorting the image.
[ ] Display a clear error if a required country record or asset is unavailable.


B. Learning path
[ ] Display the seven-continent structure and per-continent learning progress.
[ ] Introduce 10 new countries per batch, or fewer when a continent's final batch requires it.
[ ] Resume incomplete batches without duplicating newly introduced countries.
[ ] Keep previously introduced flags available for review.
[ ] Persist the current learning position across sessions.


C. Practice and answer evaluation
[ ] Complete a multiple-choice question with four valid, distinct options.
[ ] Submit a typed answer and normalize capitalization and whitespace.
[ ] Accept configured aliases without accepting ambiguous country names.
[ ] Reveal the correct answer and useful feedback after an incorrect response.
[ ] Record the practice mode and outcome for each completed review.


D. Mastery and scheduling
[ ] Support Learning, Familiar, and Mastered stages.
[ ] Never grant mastery after a single correct answer.
[ ] Require successful independent recall across separate sessions and days for Mastered.
[ ] Schedule the next review based on stage, recall outcome, and previous review history.
[ ] Reschedule a missed or incorrect review sooner.
[ ] Continue periodic reviews for mastered countries.


E. Progress and persistence
[ ] Show introduced, Familiar, Mastered, and due-review counts.
[ ] Show progress by continent and practice-mode accuracy.
[ ] Preserve learning progress after reload and browser restart.
[ ] Validate and version the local progress schema.
[ ] Export and restore progress through a validated backup file.


F. Quality and delivery
[ ] Pass automated tests for answer normalization, scheduling, and mastery transitions.
[ ] Verify that missing or invalid country data produces a controlled error.
[ ] Verify responsive layouts, keyboard navigation, and accessible flag labels.
[ ] Test the complete learning workflow from first introduction to scheduled review.
[ ] Document installation, testing, build, and deployment instructions.

 Copy checklist
5. Define mastery thresholds before implementation
The three stages need precise transition rules. Here's my proposed starting policy for discussion.
Stage	Proposed entry criteria
Learning	Default stage for a newly introduced country, or after a significant recall failure
Familiar	At least 3 successful independent recalls across at least 2 separate days
Mastered	At least 5 successful independent recalls across at least 3 separate days, with a successful review at least 7 days after the first successful recall
These are proposed product rules, not scientifically established universal thresholds. We should test them against actual learning behavior. A country may also fall back from Mastered to Familiar if repeated reviews reveal that it is no longer reliably recalled.
For the initial scheduler, I would start with simple adaptive intervals and retain the full review history. That makes the algorithm testable and gives us the data needed to improve it later.
6. What belongs after the MVP?
The following should be explicitly deferred so the first release stays focused.
- Timed challenges, streaks, badges and achievements.
- AI-generated memory mnemonics.
- Automatic flag-image similarity analysis.
- Maps, borders and broader geography quizzes.
- Accounts, cloud synchronization and multi-device progress.
- Advanced analytics on retention curves and learning effectiveness.
Once the MVP works reliably, we can choose additions based on what actually helps you learn.
7. Proposed implementation order
1. Foundation: finalize the data audit, initialize Next.js and TypeScript, and load the existing country records and flags.
2. Learning workflow: build continent selection, batches of 10, and the three practice modes.
3. Persistence: store and restore per-country learning state locally.
4. Learning engine: implement the three mastery stages and adaptive review scheduling with unit tests.
5. Dashboard: add continent progress, review queues, accuracy statistics and weak-flag identification.
6. Release: add backup and restore, accessibility checks, end-to-end tests and deployment.