# B.U.D.D.Y. Roadmap

Desktop pet and work reminder tool. The name B.U.D.D.Y. is provisional and can be changed later.

## Product Goal

Create a small, friendly desktop-style companion that appears during a work session, reminds the user every 15 minutes, and can be customized without requiring an account, backend, API, or AI service.

## Core Experience

1. The user starts a work session.
2. B.U.D.D.Y. counts down to the next 15-minute reminder.
3. At the reminder, the buddy appears with its pop-up animation and a message.
4. The user can dismiss the reminder, restart the timer, or continue working.
5. The user can customize the buddy's pixel art, messages, and animations.

## Guiding Constraints

- Browser-based and local-first.
- No API calls, account, or personal data storage.
- Timer state is temporary and resets when the page is reloaded.
- Default messages and animation data live in project files.
- Customizations may later be saved locally with `localStorage` or exported as a file.
- Keep the timer logic, rendering, input, and customization data separate.

## Milestones

### Phase 0: Project Foundation

- Define the provisional B.U.D.D.Y. visual identity and default behavior.
- Decide on the pixel grid size, display scale, color palette, and animation frame format.
- Set up the page shell, canvas, controls, and a small state model.
- Establish the initial data shapes for a buddy, animation, reminder, and work session.

**Exit criteria:** The app loads locally and has a clear place for the pet, timer, message, and controls.

### Phase 1: Timer and Reminder MVP

- Add start, pause, resume, reset, and skip-to-reminder controls.
- Implement the 15-minute default interval.
- Show remaining time in a readable format.
- Trigger a reminder when the interval reaches zero.
- Show the preset reminder message.
- Allow a custom reminder message to replace or supplement the preset.
- Prevent duplicate reminders when the browser tab is inactive or the timer is updated repeatedly.
- Add a dismiss action and restart the next interval.

**Exit criteria:** A user can run a complete work session and reliably receive one reminder every 15 minutes.

### Phase 2: First Buddy Renderer

- Render one default buddy on the canvas or pixel-grid display.
- Add a consistent pixel scale so the art stays crisp.
- Load buddy appearance from structured data rather than hard-coding drawing calls.
- Add the three animation states: `popUp`, `idle`, and `exit`.
- Connect the reminder event to the pop-up, message display, idle loop, and exit sequence.

**Exit criteria:** The default buddy appears at the right time and transitions through all three animation states without visual glitches.

### Phase 3: Pixel-Grid Editor

- Add a grid editor for drawing individual pixels.
- Support a palette, color selection, erase mode, clear, fill, and undo/redo.
- Allow the user to preview the buddy at its real display scale.
- Add a way to name the buddy and reset it to the default.
- Validate grid dimensions and color values before saving a design.

**Exit criteria:** A user can draw a buddy, preview it, reset it, and use it in the reminder flow.

### Phase 4: Animation Editor

- Let the user choose an animation state: pop-up, idle, or exit.
- Add, duplicate, reorder, and delete frames.
- Set frame duration and playback loop behavior.
- Preview each animation independently and preview the full reminder sequence.
- Add sensible defaults so a new buddy has usable animations immediately.

**Exit criteria:** A user can create and preview all three animation types and assign them to reminder playback.

### Phase 5: Messages and Local Customization

- Add a message list with the preset reminder as the default.
- Support custom messages, editing, deletion, and enable/disable controls.
- Define whether reminders rotate through enabled messages or use one selected message.
- Save buddy, animation, and message configuration in `localStorage`.
- Add reset-to-default and export/import JSON controls.
- Handle invalid or older saved data by falling back to defaults.

**Exit criteria:** Customizations survive a page reload and can be backed up or restored locally.

### Phase 6: Polish and Desktop Feel

- Refine the pet window/panel layout for desktop and smaller screens.
- Add keyboard-accessible controls and visible focus states.
- Add reduced-motion behavior while preserving reminder feedback.
- Add audio only as an optional, muted-by-default enhancement if desired.
- Add clear timer states: idle, running, paused, reminding, and complete.
- Improve error messages, empty states, and reset confirmations.
- Test long-running timers, tab switching, resizing, and rapid control use.

**Exit criteria:** The tool feels reliable, understandable, and pleasant during repeated work sessions.

## Suggested Data Model

```js
{
	buddy: {
		name: "B.U.D.D.Y.",
		gridWidth: 16,
		gridHeight: 16,
		palette: ["#..."],
		frames: {
			popUp: [{ pixels: [], durationMs: 120 }],
			idle: [{ pixels: [], durationMs: 300 }],
			exit: [{ pixels: [], durationMs: 120 }]
		}
	},
	reminder: {
		intervalMs: 900000,
		messages: ["Time for a quick check-in."],
		customMessage: ""
	}
}
```

The exact pixel representation can change during implementation. Keep it serializable so the same data can drive the editor, preview, renderer, and export/import features.

## Initial File Responsibilities

- `index.html`: application structure and accessible controls.
- `style.css`: layout, pixel display sizing, reminder states, and responsive styling.
- `main.js`: application startup and coordination between modules.
- `src/canvas/setupCanvas.js`: canvas setup and pixel-safe rendering configuration.
- `src/canvas/loop.js`: animation frame timing and playback.
- `src/input/input.js`: pointer and keyboard input for the editor and controls.
- `src/utils/math.js`: timing and grid conversion helpers.
- `docs/`: product decisions, roadmap, and prompt history.

## Testing Checklist

- Timer starts, pauses, resumes, resets, and reaches zero correctly.
- The default 15-minute interval can be changed only through an intentional setting if customization is added.
- A reminder fires once per interval and cannot duplicate from repeated updates.
- Pop-up, idle, and exit animations play in the expected order.
- Pixel edits map to the correct grid cell at different display scales.
- Undo/redo and reset restore the expected pixel data.
- Custom messages render safely and do not break the layout.
- Saved configuration loads correctly, while invalid data falls back to defaults.
- Keyboard controls and reduced-motion behavior work.
- The app remains usable after tab switching and window resizing.

## Future Ideas

- Multiple saved buddies and quick switching.
- A configurable reminder interval in minutes.
- Short break and long break modes.
- Optional sound or system notifications.
- Themes, background scenes, accessories, and unlockable cosmetics.
- Import/export of shareable buddy packs.
- A true desktop wrapper only after the browser version is stable.

## Definition of Done for the First Release

- The user can start a session and receive a reliable reminder every 15 minutes.
- The default buddy uses pop-up, idle, and exit animations.
- The user can enter a custom reminder message.
- The user can draw and preview a buddy on a pixel grid.
- The reminder flow uses the customized buddy and message.
- The app works without network access and makes zero API calls.
- The main workflow is keyboard accessible and handles reset/error states clearly.
