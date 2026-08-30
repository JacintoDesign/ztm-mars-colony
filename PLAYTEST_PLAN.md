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

## Scenario 7: Colonist arrivals respect habitat capacity
Given: 1 habitat (capacity 2), 0 colonists, last ship landed 0
       ticks ago.
When:  the colony advances 900 ticks using the catch-up path.
Then:  - exactly 2 colonists exist, not 3
       - both appeared at the landing zone tile
       - no landing occurred once capacity was reached

## Scenario 8: A colonist dies at zero health, and the colony ends
Given: 1 habitat, 1 colonist, no scrubbers, oxygen 0, power 0,
       colonist health 5.
When:  the simulation runs 2 ticks.
Then:  - the colonist's health reaches 0 and it is removed
       - colony status becomes game_over
       - a further 10 ticks change nothing in the state

## Scenario 9: Ore production stops when the reserve is exhausted
Given: 1 extractor, ore reserve 6, ore stockpile 0.
When:  the simulation runs 5 ticks.
Then:  - the reserve reaches 0 by tick 2 (3 ore/tick)
       - ore stockpile stops increasing once the reserve hits 0
       - power draw continues every tick regardless

## Scenario 10: Restarting after game over creates a fresh colony
Given: a colony in game_over status, with buildings, a depleted
       ore reserve, and drained oxygen and power from a previous
       run.
When:  the account restarts from the game-over screen.
Then:  - oxygen, power, ore and the ore reserve return to starting
         values
       - no buildings or colonists remain
       - colony status returns to active
       - the account's bestSolsSurvived is unchanged by the restart

## Scenario 11: A personal best only updates when it's actually beaten
Given: an account with bestSolsSurvived at 10.
When:  a colony dies at tick 3,000 (3 sols) — below the existing
       best.
Then:  - colony status becomes game_over
       - the account's bestSolsSurvived remains 10, not 3
When:  a second colony from the same account instead dies at tick
       15,000 (15 sols) — above the existing best.
Then:  - the account's bestSolsSurvived updates to 15