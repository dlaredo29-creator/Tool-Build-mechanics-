# SYSTEM CHARTER

## Intent

I want my systems to communicate meaning through simple interactions where
input creates a visible response.

## Constraints

1. I will start with the smallest working system before adding complexity.
2. I will keep each system understandable enough that its main behavior can
   be explained in a few sentences.
3. I will separate creative decisions from technical implementation so that
   code supports the idea instead of becoming the idea.

## Tensions

- Control vs. unpredictability
- Simplicity vs. expressive behavior

## Taste Vow

I refuse to add effects, features, or decoration just because they are
technically possible. Every visible element should have a reason.

---

# TEMPLATE SKETCH

## Signal

Mouse X position.

## Parameter

Circle radius.

## Behavior

The circle continuously pulses while its radius changes based on the
horizontal position of the mouse.

## Readability Test

Within five seconds, moving the mouse from left to right should clearly
change the size of the ring while the ring continues to pulse.