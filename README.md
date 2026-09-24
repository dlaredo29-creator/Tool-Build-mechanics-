What data does this tool need?
The tool needs to know when the user starts working, how much time has passed, and when the 15-minute reminder should appear. It also needs the buddy's animation and message information so it knows what animation and message to show.
Where is it stored?
The timer state can be stored temporarily in the browser while the tool is running. The buddy's animations and messages can be stored in the project files. No personal user information needs to be stored.
Is it temporary or persistent?
The timer is temporary and resets when the tool is restarted or the page is reloaded. The buddy's animations and messages are persistent because they are part of the project files.
Does the system need memory between sessions?
No. The basic version does not need to remember anything about the user between sessions. Each session can start with a new 15-minute timer.
Does the system require AI inference?
No. AI is not required. The pet can use predetermined animations and messages.
How many API calls are realistically required?
Zero API calls are required. The tool can run using local code, animations, messages, and a timer.
What happens if the API fails?
There is no API.

## Current behavior break

- Only one buddy can be spawned at a time. While the buddy window is open, the spawn control is disabled so repeated clicks do not create multiple buddies.
- The 15-minute timer starts automatically when the buddy is spawned. It can still be paused, resumed, or reset from the timer controls.

## Open behavior breaks

- The buddy window must stay the original small draggable size.
- The animation should use one dedicated square display inside that small window and fit the entire 16 × 16 or 100 × 100 animation in it without changing the window size.
- The buddy display must never show copied or duplicated drawings; every animation frame replaces the same single display.

The buddy should sit beside the timer as a small horizontal companion, not become the main focus of the page. Its reserved screen should contain exactly one rendered buddy image at a time.

## Buddy library

Buddy profiles can be saved in the browser with their drawings, animations, colors, FPS settings, and messages. Use the Buddy selector to switch profiles. The library includes a Sunny preset with pop-up, idle, and exit animations.

## 100 × 100 canvas break

The 100 × 100 canvas must show faint grid lines, and every pixel must remain a square with equal side lengths rather than becoming rectangular.