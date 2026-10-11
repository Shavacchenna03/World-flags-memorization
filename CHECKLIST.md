# Feature Implementation Checklist

## A. Data and application foundation
- [ ] Load all 195 country records without runtime API calls.
- [ ] Render all bundled flag SVGs with correct country names and accessible alternative text.
- [ ] Assign each country to exactly one primary continent under documented rules.
- [ ] Handle unusual flag aspect ratios without distorting the image.
- [ ] Display a clear error if a required country record or asset is unavailable.

## B. Learning path
- [ ] Display the seven-continent structure and per-continent learning progress.
- [ ] Introduce 10 new countries per batch, or fewer when a continent's final batch requires it.
- [ ] Resume incomplete batches without duplicating newly introduced countries.
- [ ] Keep previously introduced flags available for review.
- [ ] Persist the current learning position across sessions.

## C. Practice and answer evaluation
- [ ] Complete a multiple-choice question with four valid, distinct options.
- [ ] Submit a typed answer and normalize capitalization and whitespace.
- [ ] Accept configured aliases without accepting ambiguous country names.
- [ ] Reveal the correct answer and useful feedback after an incorrect response.
- [ ] Record the practice mode and outcome for each completed review.

## D. Mastery and scheduling
- [ ] Support Learning, Familiar, and Mastered stages.
- [ ] Never grant mastery after a single correct answer.
- [ ] Require successful independent recall across separate sessions and days for Mastered.
- [ ] Schedule the next review based on stage, recall outcome, and previous review history.
- [ ] Reschedule a missed or incorrect review sooner.
- [ ] Continue periodic reviews for mastered countries.

## E. Progress and persistence
- [ ] Show introduced, Familiar, Mastered, and due-review counts.
- [ ] Show progress by continent and practice-mode accuracy.
- [ ] Preserve learning progress after reload and browser restart.
- [ ] Validate and version the local progress schema.
- [ ] Export and restore progress through a validated backup file.

## F. Quality and delivery
- [ ] Pass automated tests for answer normalization, scheduling, and mastery transitions.
- [ ] Verify that missing or invalid country data produces a controlled error.
- [ ] Verify responsive layouts, keyboard navigation, and accessible flag labels.
- [ ] Test the complete learning workflow from first introduction to scheduled review.
- [ ] Document installation, testing, build, and deployment instructions.
