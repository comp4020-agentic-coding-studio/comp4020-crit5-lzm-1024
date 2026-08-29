# Crit 5 reflection

The breakthrough that moved this work forward was recognising that difficulty,
visual polish, and performance were not separate tasks. My early instinct was
to make the shooter feel larger by adding more levels, enemies, bullets, and
effects. In practice, that produced repetition, occasional empty waves, and
late-game slowdown. The project improved when I treated each symptom as a
design signal. I condensed the progression into ten authored levels, gave
enemies clearer roles, made Bosses move and fire readable radial patterns, and
kept the intended enemy density while changing the underlying implementation.
Object pooling, projectile lifetimes, active-object lists, and a reusable
collision grid let the game retain its intensity without simply deleting the
content that made it exciting.

This work changed the kind of software developer I want to become. I do not
want to judge an interface only by whether it looks finished or whether the
code compiles. I want to connect player feedback to measurable contracts and
then verify the result at several levels: typed logic, automated tests, and the
real rendered experience. The most useful corrections in SKYFALL came from
playing later levels, noticing what the system actually did, and adding rules
or tests that protected the correction. I want to keep developing that habit:
preserve the product's intent, make performance work invisible to the user, and
use evidence rather than confidence as the standard for accepting a change.

