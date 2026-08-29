## Scenario 1: Oxygen starvation degrades health
Given: 1 habitat, 1 colonist, no scrubbers, oxygen 20, power 100,
       colonist health 100.
When:  the simulation runs 60 ticks with no player action.
Then:  - oxygen reaches 0 before tick 60
       - after oxygen hits 0, colonist health decreases every tick
       - at tick 60, colonist health is below 100

## Scenario 2: A balanced colony holds steady
Given: 1 habitat, 1 colonist, 1 scrubber, 1 solar, oxygen 50, power 50.
When:  the simulation runs 60 ticks with no player action.
Then:  - neither oxygen nor power reaches 0
       - colonist health is 100 at tick 60 and never dropped

## Scenario 3: Recovery when a scrubber is added
Given: the end state of Scenario 1.
When:  the player places a scrubber and 30 ticks pass.
Then:  - oxygen rises above 0
       - colonist health increases every tick after oxygen recovers

## Scenario 4: Batch catch-up matches live ticking
Given: any colony state and a tick count N.
When:  N ticks are applied as one batch, and separately one at a
       time from the same starting state.
Then:  - both end states are identical in every field, including
         every colonist's position
       - the tick counter reads the same in both

## Scenario 5: Offline time is applied on return, and capped
Given: a draining colony, saved, with its last tick 90 minutes ago.
When:  the colony is loaded.
Then:  - roughly 5,400 ticks have been applied
       - both pools are still within 0–100
       - a colony last saved 30 days ago applies exactly 28,800
         ticks and no more

## Scenario 6: A colony is visible only to its owner
Given: two accounts, each with a colony in a different state.
When:  account A is signed in.
Then:  - account A sees only its own colony
       - a direct request for account B's colony returns nothing
       - signing out leaves no colony data readable at all