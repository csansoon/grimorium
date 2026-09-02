# Transformation Engine Rules

This document defines the core engine rules for role changes, alignment changes,
swaps, queue updates, and status handling. The goal is to make transformation
behavior modular and reusable across built-in roles, imported scripts, and
future custom content.

## Goals

- Separate player identity from current runtime behavior.
- Make role swaps, role changes, and alignment changes first-class engine actions.
- Keep script wake order canonical while allowing mid-night transformations.
- Treat poison, drunk, dead, and similar states as reusable player-level effects.
- Remove role-specific queue hacks where possible.

## Identity Model

Each player should have:

- `baseRoleId`: the role they started with after setup/deal
- `currentRoleId`: the role they currently act as
- `baseAlignment`: their starting alignment (`good` or `evil`)
- `currentAlignment`: their current alignment
- `transformations[]`: history of applied transformations

Compatibility note:

- During migration, existing `player.roleId` can remain as the current role field.
- Longer term, all runtime reads should flow through resolver helpers instead of
  using raw `roleId` directly.

## Resolver Rules

All game systems should read current identity via helpers:

- `getCurrentRoleId(player)`
- `getCurrentRole(player)`
- `getBaseRoleId(player)`
- `getCurrentAlignment(player)`
- `getCurrentTeam(player)`
- `isGood(player)`
- `isEvil(player)`

These helpers become the single truth for:

- wake checks
- grimoire display
- perception/registration
- win-condition checks
- role pickers
- ability gating

## Transformation Types

The engine should support these transformation kinds:

- `role_change`
- `role_swap`
- `alignment_change`
- `team_change`
- `demon_successor`
- `temporary_override`

Each transformation record should include:

- source role/effect/cause
- target players
- before state
- after state
- duration
- reveal policy
- queue policy

## Engine Operations

All role-changing logic should route through engine helpers instead of manually
building `changeRoles` maps inside role implementations.

Core helpers:

- `changePlayerRole(...)`
- `swapPlayerRoles(...)`
- `changePlayerAlignment(...)`
- `promoteToDemon(...)`
- `applyTransformation(...)`

These helpers are responsible for:

- mutating identity state
- adding transformation history
- applying reveal policy
- applying status effects from the transformation
- cleaning up role-bound effects
- recalculating derived effects
- adjusting the remaining night queue

## Core Queue Rules

### Canonical Order

- Script wake order remains the canonical night order.
- Transformations never rewrite the script order itself.

### Runtime Queue Identity

Night processing must be tracked by `player + role`, not just `player`.

That means:

- acting as `snake_charmer` does not mark the later `imp` wake as done
- gaining a new role later in the same night can still create a valid wake
- losing a role removes its pending wake if it has not happened yet

### Queue Cursor Rules

When a transformation happens during the night:

- if the player gains a role whose wake is later than the current cursor, queue it
- if the player gains a role whose wake is already passed, mark it passed unless
  the transformation explicitly overrides that rule
- if the player loses a not-yet-acted role, remove that pending wake
- if a player already acted as an old role, that does not count as acting as the
  new role

### Queue Policy

Each transformation can declare a queue policy:

- `queue_if_later`
- `skip_if_window_passed`
- `never_this_night`
- `immediate_inline`

Examples:

- `Snake Charmer`
  - new Demon wake: `queue_if_later`
  - former Demon gaining `snake_charmer`: `skip_if_window_passed`
- `Pit-Hag`
  - depends on final role policy; default should be explicit, not implicit
- `Scarlet Woman`
  - conditional successor wake can be inserted/reactivated immediately

## Core Ability Gating Rules

Dead players having abilities must be handled by a generic capability layer.

Do not hardcode this only inside demon roles.

Add capability helpers:

- `canWakeAtNight(player, role, game, state)`
- `canAct(player, role, game, state)`
- `canNominate(player, game, state)`
- `canUseDayAbility(player, role, game, state)`

Default rule:

- dead players cannot act

Effects and role states can override that:

- `vigormortis_killed`
- future dead-minion permissions
- future script-specific exceptions

This keeps dead-ability support extensible and script-agnostic.

## Core Status Rules

Poison, drunk, dead, and similar conditions should be treated as player-level
status effects, not as role metadata.

That means:

- a role change does not automatically remove poison or drunk
- the new current role is affected by the player’s current statuses
- a transformation may add or remove statuses as part of its result

Examples:

- `Snake Charmer`
  - former Demon receives `poisoned`
  - they act as a poisoned `snake_charmer`
- `Philosopher`
  - matching in-play target receives `drunk`
  - that drunk state stays on the player unless another rule removes it

## Effect Persistence Policy

Effects need an explicit persistence model.

Recommended categories:

- `sticky_player`
  - remains on the player across role/alignment changes
  - examples: `dead`, `poisoned`, `drunk`
- `role_bound`
  - only valid while the player still has the relevant role/state
- `alignment_bound`
  - removed when alignment changes
- `derived_only`
  - never treated as source-of-truth; always recomputed

Examples:

- `dead`: `sticky_player`
- `poisoned`: `sticky_player`
- `drunk`: `sticky_player`
- `pending_role_reveal`: temporary workflow effect
- `no_dashii` poisoning aura: `derived_only`
- `fang_gu_jump`: current-demon effect; likely `role_bound`
- `vigormortis_demon`: current-demon effect; likely `role_bound`
- `pure`: role/effect-bound

## Derived State Rules

Any state that can be computed from current identity plus effects should be
derived, not persisted manually.

Examples:

- No Dashii neighbor poison
- Vigormortis dead-minion permission
- storyteller markers that mirror current state

After any transformation:

1. apply identity changes
2. apply direct sticky/explicit effects
3. rerun derived state sync
4. update queue

## Reveal Rules

Not every transformation should reveal the same way.

Reveal policy should be explicit:

- `immediate_current_player`
- `immediate_all_targets`
- `pending_reveal`
- `pending_reveal_ordered`
- `no_reveal`

Examples:

- `Snake Charmer`
  - current player immediate
  - other player pending
- `Pit-Hag`
  - target pending
- `Barber`
  - both pending
- `Scarlet Woman`
  - pending
- `Philosopher`
  - usually immediate current player

## Perception Rules

Transformation is not the same as registration/perception.

Keep these separate:

- transformation controls what the player actually is now
- perception controls what info roles may learn about them

This separation is required for:

- Recluse
- Spy
- Drunk
- Vortox
- future custom roles with registration effects

## History Rules

Transformations should be recorded explicitly.

Add or standardize history entries like:

- `transformation_applied`
- `role_changed`
- `role_swapped`
- `alignment_changed`
- `transformation_revealed`

History should make it easy to answer:

- who changed
- from what
- to what
- because of which role/effect
- with which reveal and queue policy

## Migration Order

### Phase 1

- Introduce identity helpers and compatibility fields.

### Phase 2

- Add transformation engine and history model.

### Phase 3

- Migrate current transformation-heavy roles:
  - `scarlet_woman`
  - `snake_charmer`
  - `barber`
  - `fang_gu`
  - `pit_hag`
  - `philosopher`
  - demon successor flows

### Phase 4

- Add effect persistence policy and cleanup rules.

### Phase 5

- Make queue state transformation-aware through engine policies.

### Phase 6

- Replace raw role/team reads across runtime systems with identity helpers.

## Definition of Done

The transformation system is complete when:

- role/alignment changes do not mutate raw player identity ad hoc
- queue changes are policy-driven and transformation-aware
- dead-player ability exceptions use the capability layer
- poison/drunk behavior survives role changes according to effect policy
- reveals use explicit reveal policy
- current identity is resolved through helpers across runtime systems
- future supported custom roles can express transformations without requiring
  engine-specific special cases
