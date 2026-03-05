# Sects & Violets QA Checklist

Use this as the manual validation pass for the current `Sects & Violets` implementation.

Goal:
- verify role logic
- verify storyteller UX
- verify replay/review UX
- verify mobile layout on small phones
- catch transformation, poisoning, and wake-order edge cases

Suggested test format for each scenario:
- result: `pass` / `fail`
- notes: short behavior summary
- follow-up: bug, polish, or rules question

## Test Environment

Before starting:
- use the `Sects & Violets` built-in script
- test on both desktop and a small mobile viewport
- prefer 7 to 12 player games for full-role interaction coverage
- run at least one under-7 game for global evil-info checks

Recommended baseline tables:
- 5-player S&V
- 7-player S&V
- 10-player S&V
- 12-player S&V

## Core Flow

- Start a new game with `Sects & Violets`.
- Verify player count, script selection, role selection, role dealing, and reveal-order seating all work.
- Verify Night 1 prep appears only when setup is actually needed.
- Verify the visual grimoire stays usable throughout setup, night, and day.
- Verify completed and skipped night actions can be reviewed cleanly.
- Verify skipped actions only rerun when explicitly allowed.

## Global Rules

### Evil Info

- Under 7 players, confirm minions do not learn the demon.
- Under 7 players, confirm the demon does not learn minions.
- Under 7 players, confirm the dashboard shows skipped `Minion Info` / `Demon Info` rows with reasons.
- Confirm demon bluffs still behave according to the current system-step flow where applicable.

### Wake Order

- Verify first-night order matches the derived intended order for the in-play S&V roles.
- Verify other-night order remains stable after role changes.
- Verify reactive wakes appear in the correct position relative to the active queue.

### Malfunctioning

- Poison or drunk an info role and confirm the false-info path appears.
- Confirm role pickers used for malfunctioning only show roles from the current script.
- Confirm malfunctioning rows show the compact icon in the dashboard and the explanation in review.

## Transformation / Identity Engine

- Role change preserves player seat and name.
- Role swap updates current role correctly in grimoire, queue, and replay.
- Alignment changes update downstream logic correctly.
- Same-night queue changes respect transformation policies.
- Derived effects re-sync correctly after role changes.
- Role-change replay and reveal order make sense to the storyteller.

## Townsfolk / Outsider Role Cases

### Clockmaker

- Shows a valid number on Night 1.
- Malfunction flow allows false number.
- Replay shows the number, not only history text.

### Dreamer

- Selecting a target produces one good role and one evil role.
- Malfunction flow allows custom false good/evil roles.
- Replay shows the actual pair reveal UI cleanly on mobile.

### Snake Charmer

- Choosing a non-demon target records normally and ends the step.
- Choosing the demon swaps roles correctly.
- Current Snake Charmer sees the new demon role immediately.
- Former demon gets the delayed role-change reveal.
- New demon still wakes later that night for the kill.
- Former demon does not get an extra same-night Snake Charmer action.
- If the new demon is `Fang Gu` / `Vigormortis` / `No Dashii` / `Vortox`, downstream behavior uses the new role correctly.

### Mathematician

- Storyteller numeric result flow works and records correctly.
- Replay shows the number cleanly.

### Flowergirl

- Returns `yes` if the demon voted.
- Returns `no` if the demon did not vote.
- Vortox false-info path works.
- Replay shows the boolean result clearly.

### Town Crier

- Returns `yes` if a minion nominated.
- Returns `no` if no minion nominated.
- Vortox false-info path works.
- Replay shows the boolean result clearly.

### Oracle

- Returns the number of dead evil players.
- Updates correctly as deaths accumulate.
- Vortox false-info path works.

### Seamstress

- Selects two players and shows same-alignment / different-alignment result.
- Supports delaying use when appropriate.
- Replay shows the result clearly.

### Philosopher

- Can choose only valid good roles from the current script.
- Becomes the chosen role.
- In-play matching role becomes drunk if applicable.
- New role initial effects are applied correctly.
- Same-night wake behavior follows the transformation policy.

### Artist

- Day question flow records question and yes/no answer.
- Artist cannot ask again after use.
- Replay/review preserves the question and answer.

### Savant

- Storyteller enters two statements.
- Player reveal shows both statements correctly.
- Replay preserves both statements.

### Mutant

- Storyteller manual execution path works.
- Execution history and downstream consequences behave correctly.

### Sweetheart

- On death, storyteller chooses a player to become drunk.
- Chosen player receives the drunk effect.
- Drunk status survives role-appropriate follow-up flows.

### Barber

- On death, storyteller may swap two players’ roles.
- Swapped players receive correct role-change reveals.
- Queue and later-night behavior use the new roles.

### Klutz

- Only triggers on execution.
- Choosing an evil player causes good to lose.
- Choosing a good player does not cause immediate loss.

### Sage

- Triggers only when killed by the demon.
- Shows the demon plus one decoy.
- Does not trigger on execution.

## Minions

### Evil Twin

- Twin pairing is established correctly.
- Death/win logic behaves correctly while both twins live.
- Alignment-sensitive behavior uses the correct current alignment.

### Witch

- Cursed player who nominates dies immediately.
- The nomination still continues to vote afterward.
- If the nomination is canceled, it does not consume daily nomination state incorrectly.

### Cerenovus

- Can choose a player and a good role from the current script only.
- Player-facing madness reveal looks correct on mobile.
- Madness effect expires correctly.

### Pit-Hag

- Can choose any player and any valid current-script role.
- Role change reveal happens before a newly gained later-night wake if needed.
- Same-night wake behavior follows queue policy.
- Demon changes do not break win logic or demon identity.

## Demons

### Fang Gu

- Kill resolves normally when no jump condition applies.
- When jump condition applies, outsider dies and demon passes correctly.
- New demon identity updates grimoire, queue, and future actions.
- Dawn death announcement still appears correctly after transformed demon kills.

### Vigormortis

- Killed good player remains dead.
- Dead minion ability permission is granted correctly.
- The correct dead minion still wakes on later nights.

### No Dashii

- Neighbor poisoning is applied correctly.
- Neighbor poisoning updates correctly after reseating or role change.
- Malfunctioning downstream roles use false-info flows.

### Vortox

- Supported info roles show false information.
- No-execution day rule behaves correctly.
- Win condition checks do not end the game incorrectly.

## Cross-Role Interaction Matrix

### Transformation + Poisoning

- Snake Charmer into poisoned former demon.
- Philosopher drunks an in-play role, then that role changes later.
- Pit-Hag changes a poisoned player into a later-night role.
- Fang Gu jump into a player with active effects.

### Transformation + Queue

- New role gained before its wake still acts if policy allows.
- New role gained after its wake does not act if policy blocks it.
- Role-change reveal appears before later-night wake when needed.
- Imp starpass does not allow the new Imp to kill the same night.

### Protection + Poisoning

- Poisoned Monk protecting a target behaves correctly.
- Poisoned target with Monk protection still survives demon attack.
- Protection and demon kill resolution happen in the right order.

### Succession / Win Checks

- Slayer kills demon while a valid successor exists.
- Scarlet Woman takeover prevents premature good win.
- Demon death without valid successor ends correctly.
- Fang Gu / Snake Charmer / Pit-Hag demon transitions do not produce incorrect winners.

## Day Phase

- Nomination can be started and canceled without consuming the nominator or nominee.
- Nominee can vote.
- Dead players can vote only if ghost vote is still available.
- Executions update alive count and vote threshold correctly.

## Replay / Review

- Completed actions show structured replay instead of raw history text.
- Skipped actions show the skip reason and optional rerun warning.
- Info roles replay the actual revealed number / boolean / role pair / player pair.
- Evil info replay shows the actual players or bluffs shown.
- Role-change reveals replay with the actual changed role.

## Mobile QA

Run these on a small phone viewport:
- role reveal and player-name lock screen
- Night 1 prep list
- visual grimoire
- S&V custom reveal screens
- replay dialogs
- voting screen
- action step lists

Check for:
- horizontal overflow
- clipped buttons
- sticky footer overlap
- unusable tap targets
- text wrapping into unreadable layouts
- cards that exceed viewport height without scrolling

## Automated Coverage Cross-Check

Automated tests already exist for parts of this work:
- `src/lib/__tests__/sectsAndVioletsSlice.test.ts`
- `src/lib/__tests__/sectsAndVioletsInfoRoles.test.ts`
- `src/lib/__tests__/sectsAndVioletsDemons.test.ts`
- `src/lib/__tests__/transformations.test.ts`
- `src/lib/__tests__/evilInfo.test.ts`
- `src/lib/__tests__/nightDashboard.test.ts`

Manual QA should focus on:
- UI behavior
- replay fidelity
- mobile responsiveness
- multi-step storyteller flows
- role combinations not explicitly covered by tests

## Exit Criteria

S&V is ready to come out of beta when:
- no critical transformation bugs remain
- no major wake-order regressions remain
- mobile layouts are stable on common small-phone sizes
- replay is reliable for all structured role actions
- day/night edge cases do not corrupt game state
- the above checklist can be run end-to-end without blocker failures
