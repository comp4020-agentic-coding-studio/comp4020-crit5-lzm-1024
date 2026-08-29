# Crit 5 reflection

The breakthrough that moved this project forward was learning to treat player
feedback as evidence about the whole system rather than as a request to change
one number. I initially planned fifty levels, then reduced the structure to
twenty and finally ten more deliberate levels. This happened because adding
content was creating repetition rather than meaningful progression. The same
lesson appeared in combat balancing. At one point the weapons were so dense and
powerful that the player could stand still and still clear a level. Increasing
damage alone made the player die too quickly, so I had to balance enemy
movement, health, firing patterns, escaped-enemy damage, upgrades, shields, and
Boss behaviour together. Later levels also became slow. Instead of reducing the
enemy count and weakening the experience, I added projectile lifetimes, object
pools, active-object lists, and spatial collision grids so the intended combat
density could remain.

This work changed who I want to be as a software developer because it showed me
that implementation quality includes how carefully I respond to correction.
When I forced one screen ratio, the result stretched the artwork, lowered the
apparent resolution, and allowed interface elements to cover the game. Fixing
that required preserving geometry, rendering at the device pixel ratio, and
checking the real page rather than trusting the code. The same approach shaped
the menus, five-language interface, settings, and pickup rules. I want to become
a developer who does not simply add features until a prototype looks complete,
but tests whether every change improves the player's experience. Automated
contracts, browser checks, and repeated playtesting gave me stronger reasons to
accept a change than confidence alone.

