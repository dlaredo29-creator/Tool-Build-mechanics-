const DEFAULT_COLORS = ['#ff6b5f', '#f5d66e', '#cfe9dd', '#202925', '#88b7e8', '#d7a6df', '#f3b278', '#9bd3c1', '#f7f7f2', '#ce453e', '#e3bb39', '#83baa1', '#66736c', '#5887bd', '#a979af', '#bb7d4b', '#6fafa0', '#b9c5bf', '#ffffff', '#000000'];
const animationNames = ['popUp', 'idle', 'exit', 'saveLater'];
const standardAnimationNames = ['popUp', 'idle', 'exit'];
const messageTypes = ['greeting', 'idle', 'exit'];
const SAVE_LATER_TOGGLE_KEY = 'buddySaveLaterAnimationEnabled';
const TIMER_DURATION_KEY = 'buddyTimerDurationMinutes';
const MIN_TIMER_MINUTES = 1;
const MAX_TIMER_MINUTES = 1440;
const storedTimerMinutes = Number(localStorage.getItem(TIMER_DURATION_KEY));
const initialTimerMinutes = Number.isInteger(storedTimerMinutes) && storedTimerMinutes >= MIN_TIMER_MINUTES && storedTimerMinutes <= MAX_TIMER_MINUTES ? storedTimerMinutes : 15;
const state = {
	size: 16,
	tool: 'brush',
	color: DEFAULT_COLORS[0],
	colors: [...DEFAULT_COLORS],
	selectedColorIndex: 0,
	grid: [],
	history: [],
	redoHistory: [],
	strokeInProgress: false,
	strokeSnapshot: null,
	animation: 'popUp',
	frames: { popUp: [], idle: [], exit: [], saveLater: [] },
	animationSets: { popUp: [], idle: [], exit: [], saveLater: [] },
	animationVariantIndex: { popUp: 0, idle: 0, exit: 0, saveLater: 0 },
	frameIndex: 0,
	fps: { popUp: 8, idle: 4, exit: 10, saveLater: 6 },
	timerDurationSeconds: initialTimerMinutes * 60,
	timerSeconds: initialTimerMinutes * 60,
	timerRunning: false,
	timerInterval: null,
	buddyOpen: false,
	playInterval: null,
	animationRun: 0,
	messageInterval: null,
	choiceReactionTimeout: null,
	draggingBuddy: false,
	dragOffsetX: 0,
	dragOffsetY: 0,
	currentBuddyName: 'My buddy',
	isReminder: false,
	useSaveLaterAnimation: true,
	saveLaterMessage: 'Time to save your work. Save now, or choose Later to keep working.',
	messages: {
		greeting: ['Hey! Ready to make a little progress?'],
		idle: ['Still with you. Keep going.'],
		exit: ['Nice work. See you next time!']
	}
};

const pixelGrid = document.querySelector('#pixelGrid');
const colorPicker = document.querySelector('#colorPicker');
const swatches = document.querySelector('#swatches');
const frameStrip = document.querySelector('#frameStrip');
const animationVariantList = document.querySelector('#animationVariantList');
const buddyDisplay = document.querySelector('#buddyDisplay');
const buddyImage = document.querySelector('#buddyImage');
const buddyWindow = document.querySelector('#buddyWindow');

function blankFrame() { return Array(state.size * state.size).fill('transparent'); }
function snapshot() { return [...state.grid]; }
function saveHistory() { state.history.push(snapshot()); state.redoHistory = []; if (state.history.length > 30) state.history.shift(); }
function beginStroke() { if (state.strokeInProgress) return; state.strokeSnapshot = snapshot(); state.strokeInProgress = true; }
function endStroke() {
	if (!state.strokeInProgress) return;
	const previous = state.strokeSnapshot;
	const current = snapshot();
	state.strokeInProgress = false;
	state.strokeSnapshot = null;
	if (!previous || previous.length !== current.length || previous.every((value, index) => value === current[index])) return;
	state.history.push(previous);
	state.redoHistory = [];
	if (state.history.length > 30) state.history.shift();
}
function buildGrid() {
	state.grid = blankFrame(); state.history = []; state.redoHistory = [];
	state.frames = Object.fromEntries(animationNames.map((name) => [name, [state.grid.slice()]]));
	state.animationSets = Object.fromEntries(animationNames.map((name) => [name, [{ frames: [state.grid.slice()], fps: state.fps[name] }]]));
	state.animationVariantIndex = Object.fromEntries(animationNames.map((name) => [name, 0]));
	state.frameIndex = 0;
	pixelGrid.innerHTML = ''; pixelGrid.style.gridTemplateColumns = `repeat(${state.size}, 1fr)`; pixelGrid.style.gridTemplateRows = `repeat(${state.size}, 1fr)`; pixelGrid.dataset.size = state.size;
	for (let index = 0; index < state.grid.length; index += 1) {
		const cell = document.createElement('button'); cell.className = 'pixel'; cell.type = 'button'; cell.dataset.index = index; cell.setAttribute('aria-label', `Pixel ${index + 1}`);
		cell.addEventListener('pointerdown', (event) => { event.preventDefault(); paint(index); }); cell.addEventListener('pointerenter', () => { if (painting) paint(index); }); pixelGrid.appendChild(cell);
	}
	renderGrid(); renderFrames();
}
let painting = false;
pixelGrid.addEventListener('pointerdown', () => { painting = true; }); window.addEventListener('pointerup', () => { painting = false; endStroke(); });
function renderGrid() { [...pixelGrid.children].forEach((cell, index) => { cell.style.backgroundColor = state.grid[index] === 'transparent' ? 'white' : state.grid[index]; }); }
function paint(index) {
	if (!state.strokeInProgress) beginStroke();
	if (state.tool === 'eyedropper') { const picked = state.grid[index]; if (picked && picked !== 'transparent') { state.color = picked; colorPicker.value = picked; renderSwatches(); } setTool('brush'); endStroke(); return; }
	if (state.tool === 'fill') { floodFill(index); renderGrid(); syncFrame(); endStroke(); return; }
	const nextValue = state.tool === 'eraser' ? 'transparent' : state.color;
	if (state.grid[index] === nextValue) return;
	state.grid[index] = nextValue; renderGrid(); syncFrame();
}
function floodFill(startIndex) { const oldColor = state.grid[startIndex]; if (oldColor === state.color) return; const pending = [startIndex]; const visited = new Set(); while (pending.length) { const index = pending.pop(); if (visited.has(index) || state.grid[index] !== oldColor) continue; visited.add(index); state.grid[index] = state.color; const row = Math.floor(index / state.size); const column = index % state.size; if (column > 0) pending.push(index - 1); if (column < state.size - 1) pending.push(index + 1); if (row > 0) pending.push(index - state.size); if (row < state.size - 1) pending.push(index + state.size); } }
function syncFrame() { state.frames[state.animation][state.frameIndex] = [...state.grid]; storeActiveAnimationVariant(); renderFrames(); }
function setTool(tool) { state.tool = tool; document.querySelectorAll('.tool-button').forEach((button) => button.classList.toggle('active', button.dataset.tool === tool)); document.querySelector('#toolStatus').textContent = `${tool[0].toUpperCase()}${tool.slice(1)} active`; }
function renderSwatches() { swatches.innerHTML = ''; state.colors.forEach((color, index) => { const swatch = document.createElement('button'); swatch.className = `swatch${color === state.color ? ' active' : ''}${index === state.selectedColorIndex ? ' selected' : ''}`; swatch.style.backgroundColor = color; swatch.title = `Color ${index + 1}`; swatch.type = 'button'; swatch.addEventListener('click', () => { state.selectedColorIndex = index; state.color = color; colorPicker.value = color; renderSwatches(); setTool('brush'); }); swatches.appendChild(swatch); }); }
function applyColorToSelectedSlot() { state.colors[state.selectedColorIndex] = colorPicker.value; state.color = colorPicker.value; renderSwatches(); setTool('brush'); }
function gridToDataUrl(frame) { const canvas = document.createElement('canvas'); canvas.width = state.size; canvas.height = state.size; const context = canvas.getContext('2d'); frame.forEach((color, index) => { if (color !== 'transparent') { context.fillStyle = color; context.fillRect(index % state.size, Math.floor(index / state.size), 1, 1); } }); return canvas.toDataURL(); }
function renderFrames() { const frames = state.frames[state.animation]; frameStrip.innerHTML = ''; frames.forEach((frame, index) => { const thumbnail = document.createElement('button'); thumbnail.className = `frame-thumb${index === state.frameIndex ? ' active' : ''}`; thumbnail.type = 'button'; thumbnail.draggable = true; thumbnail.dataset.frameIndex = index; thumbnail.style.backgroundImage = `url(${gridToDataUrl(frame)})`; thumbnail.title = `Frame ${index + 1}; drag to reorder`; thumbnail.setAttribute('aria-label', `Frame ${index + 1}, drag to reorder`); thumbnail.addEventListener('click', () => { state.frameIndex = index; state.grid = [...frame]; renderGrid(); renderFrames(); }); thumbnail.addEventListener('dragstart', (event) => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', String(index)); thumbnail.classList.add('dragging'); }); thumbnail.addEventListener('dragend', () => thumbnail.classList.remove('dragging')); thumbnail.addEventListener('dragover', (event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }); thumbnail.addEventListener('drop', (event) => { event.preventDefault(); const sourceIndex = Number(event.dataTransfer.getData('text/plain')); if (!Number.isInteger(sourceIndex) || sourceIndex === index || sourceIndex < 0 || sourceIndex >= frames.length) return; const previousSelected = state.frameIndex; const [movedFrame] = frames.splice(sourceIndex, 1); frames.splice(index, 0, movedFrame); if (previousSelected === sourceIndex) state.frameIndex = index; else if (sourceIndex < previousSelected && index >= previousSelected) state.frameIndex -= 1; else if (sourceIndex > previousSelected && index <= previousSelected) state.frameIndex += 1; state.grid = [...frames[state.frameIndex]]; renderGrid(); syncFrame(); }); frameStrip.appendChild(thumbnail); }); document.querySelector('#frameCount').textContent = `${frames.length} frame${frames.length === 1 ? '' : 's'}`; }
function storeActiveAnimationVariant() { const variants = state.animationSets[state.animation]; if (!variants || !variants[state.animationVariantIndex[state.animation]]) return; variants[state.animationVariantIndex[state.animation]] = { frames: state.frames[state.animation].map((frame) => [...frame]), fps: state.fps[state.animation] }; }
function loadAnimationVariant(name, variantIndex, frameIndex = 0) { const variant = state.animationSets[name][variantIndex]; state.animationVariantIndex[name] = variantIndex; state.frames[name] = variant.frames.map((frame) => [...frame]); state.fps[name] = variant.fps; state.animation = name; state.frameIndex = Math.min(frameIndex, state.frames[name].length - 1); state.grid = [...state.frames[name][state.frameIndex]]; document.querySelectorAll('.animation-tab').forEach((button) => button.classList.toggle('active', button.dataset.animation === name)); document.querySelector('#fpsInput').value = state.fps[name]; document.querySelector('#copyFrameTarget').value = name; renderGrid(); renderFrames(); renderAnimationVariants(); }
function renderAnimationVariants() { animationVariantList.innerHTML = ''; const variants = state.animationSets[state.animation]; const singleSequence = state.animation === 'saveLater'; document.querySelector('#animationVariantControls').hidden = singleSequence; if (singleSequence) return; variants.forEach((_variant, index) => { const button = document.createElement('button'); button.className = `animation-variant${index === state.animationVariantIndex[state.animation] ? ' active' : ''}`; button.type = 'button'; button.textContent = String(index + 1); button.title = `Variation ${index + 1}`; button.setAttribute('aria-label', `Select variation ${index + 1}`); button.addEventListener('click', () => { storeActiveAnimationVariant(); loadAnimationVariant(state.animation, index); }); animationVariantList.appendChild(button); }); document.querySelector('#removeAnimationVariantButton').disabled = variants.length <= 1; }
function selectAnimation(name, frameIndex = 0) { storeActiveAnimationVariant(); loadAnimationVariant(name, state.animationVariantIndex[name] || 0, frameIndex); }
function addAnimationVariant() { if (state.animation === 'saveLater') return; storeActiveAnimationVariant(); const variants = state.animationSets[state.animation]; variants.push({ frames: state.frames[state.animation].map((frame) => [...frame]), fps: state.fps[state.animation] }); loadAnimationVariant(state.animation, variants.length - 1); }
function removeAnimationVariant() { if (state.animation === 'saveLater') return; const name = state.animation; const variants = state.animationSets[name]; if (variants.length <= 1) return; const index = state.animationVariantIndex[name]; variants.splice(index, 1); loadAnimationVariant(name, Math.min(index, variants.length - 1)); }
function copyFrameToAnimation(targetName) {
	storeActiveAnimationVariant();
	const sourceFrame = [...state.frames[state.animation][state.frameIndex]];
	const targetFrames = state.frames[targetName];
	if (!targetFrames) return;
	targetFrames.push([...sourceFrame]);
	const targetIndex = targetFrames.length - 1;
	state.animation = targetName;
	state.frameIndex = targetIndex;
	state.grid = [...sourceFrame];
	storeActiveAnimationVariant();
	document.querySelectorAll('.animation-tab').forEach((button) => button.classList.toggle('active', button.dataset.animation === targetName));
	document.querySelector('#fpsInput').value = state.fps[targetName];
	document.querySelector('#copyFrameTarget').value = targetName;
	renderGrid();
	renderFrames();
}
function formatTime(seconds) { return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
function renderTimer() { document.querySelector('#timerDisplay').textContent = formatTime(state.timerSeconds); document.querySelector('#buddyTime').textContent = `${formatTime(state.timerSeconds)} remaining`; }
const BUDDY_STORAGE_KEY = 'buddyProfiles';
function cloneFrames(frames) { return { popUp: frames.popUp.map((frame) => [...frame]), idle: frames.idle.map((frame) => [...frame]), exit: frames.exit.map((frame) => [...frame]) }; }
function normalizeAnimationSets(profile) { return Object.fromEntries(animationNames.map((name) => { const fallbackFrames = name === 'saveLater' ? profile.frames.idle : profile.frames[name]; const fallbackFps = name === 'saveLater' ? profile.fps.idle : profile.fps[name]; const source = profile.animationSets && Array.isArray(profile.animationSets[name]) ? profile.animationSets[name] : [{ frames: profile.frames[name] || fallbackFrames, fps: profile.fps[name] || fallbackFps }]; const variants = source.filter((variant) => variant && Array.isArray(variant.frames) && variant.frames.length).map((variant) => ({ frames: variant.frames.map((frame) => [...frame]), fps: Math.max(1, Math.min(30, Number(variant.fps) || fallbackFps || 1)) })); const normalized = variants.length ? variants : [{ frames: [blankFrame()], fps: fallbackFps || 1 }]; return [name, name === 'saveLater' ? [normalized[0]] : normalized]; })); }
function cloneAnimationSets(sets) { return Object.fromEntries(animationNames.map((name) => [name, sets[name].map((variant) => ({ frames: variant.frames.map((frame) => [...frame]), fps: variant.fps }))])); }
function presetFrame(size, pose) { const frame = Array(size * size).fill('transparent'); const put = (x, y, color) => { const column = Math.floor(x * size / 16); const row = Math.floor(y * size / 16); if (column >= 0 && column < size && row >= 0 && row < size) frame[row * size + column] = color; }; const offset = pose === 'up' ? -1 : pose === 'down' ? 1 : 0; for (let y = 5 + offset; y <= 12 + offset; y += 1) for (let x = 4; x <= 11; x += 1) put(x, y, '#f6d77b'); for (let x = 5; x <= 10; x += 1) { put(x, 4 + offset, '#ee806f'); put(x, 13 + offset, '#26352f'); } put(4, 6 + offset, '#ee806f'); put(11, 6 + offset, '#ee806f'); put(6, 8 + offset, '#26352f'); put(9, 8 + offset, '#26352f'); put(7, 11 + offset, '#ee806f'); put(8, 11 + offset, '#ee806f'); return frame; }
function presetProfile() { return { name: 'Sunny preset', size: 16, colors: [...DEFAULT_COLORS], selectedColorIndex: 1, fps: { popUp: 6, idle: 3, exit: 8, saveLater: 6 }, frames: { popUp: [presetFrame(16, 'up'), presetFrame(16, 'center'), presetFrame(16, 'down')], idle: [presetFrame(16, 'center'), presetFrame(16, 'up')], exit: [presetFrame(16, 'down'), presetFrame(16, 'up')], saveLater: [presetFrame(16, 'up'), presetFrame(16, 'center'), presetFrame(16, 'up')] }, saveLaterMessage: 'Time to save your work. Save now, or choose Later to keep working.', messages: { greeting: ['Hi! I am Sunny. Let us take one small step.', 'Ready for a tiny win?'], idle: ['You are doing great. Keep going!', 'One small step is still progress.'], exit: ['See you soon!', 'Take a breath and come back when you are ready.'] } }; }
function defaultMessageList(type) {
	const defaults = {
		greeting: ['Hey! Ready to make a little progress?'],
		idle: ['Still with you. Keep going.'],
		exit: ['Nice work. See you next time!'],
		reminder: ['Time to save your work. Save now, or choose Later to keep working.']
	};
	return [...(defaults[type] || [])];
}
function normalizeMessageList(messages, type) {
	if (Array.isArray(messages)) {
		const cleaned = messages.map((message) => String(message).trim()).filter(Boolean);
		return cleaned.length ? cleaned : defaultMessageList(type);
	}
	if (typeof messages === 'string' && messages.trim()) {
		return [messages.trim()];
	}
	return defaultMessageList(type);
}
function pickMessage(type) {
	const pool = state.messages[type] && state.messages[type].length ? state.messages[type] : defaultMessageList(type);
	return pool[Math.floor(Math.random() * pool.length)] || '';
}
function renderMessageLists() {
	messageTypes.forEach((type) => {
		const input = document.querySelector(`#${type}Input`);
		const list = document.querySelector(`#${type}MessageList`);
		if (!input || !list) return;
		const messages = state.messages[type] && state.messages[type].length ? state.messages[type] : defaultMessageList(type);
		state.messages[type] = [...messages];
		list.innerHTML = '';
		messages.forEach((message) => {
			const chip = document.createElement('button');
			chip.type = 'button';
			chip.className = 'message-chip';
			chip.textContent = message;
			chip.title = message;
			if (input.value === message) chip.classList.add('selected');
			chip.addEventListener('click', () => {
				input.value = message;
				renderMessageLists();
			});
			list.appendChild(chip);
		});
		if (!messages.includes(input.value)) {
			input.value = messages[0] || '';
		}
	});
}
function persistActiveBuddy() {
	const select = document.querySelector('#buddySelect');
	if (!select || select.value === 'preset' || !select.value.startsWith('saved:')) return;
	const name = select.value.slice(6);
	const buddies = readSavedBuddies();
	if (!buddies[name]) return;
	buddies[name].messages = {
		greeting: [...state.messages.greeting],
		idle: [...state.messages.idle],
		exit: [...state.messages.exit],
		reminder: [state.saveLaterMessage]
	};
	buddies[name].saveLaterMessage = state.saveLaterMessage;
	writeSavedBuddies(buddies);
}
function addMessage(type) {
	const input = document.querySelector(`#${type}Input`);
	if (!input) return;
	const value = input.value.trim();
	if (!value) return;
	const messages = [...state.messages[type]];
	if (!messages.includes(value)) messages.push(value);
	state.messages[type] = messages;
	input.value = value;
	renderMessageLists();
	persistActiveBuddy();
}
function removeMessage(type) {
	const input = document.querySelector(`#${type}Input`);
	if (!input) return;
	const messages = [...state.messages[type]];
	if (!messages.length) return;
	const currentValue = input.value.trim();
	const index = messages.findIndex((message) => message === currentValue);
	const targetIndex = index >= 0 ? index : messages.length - 1;
	messages.splice(targetIndex, 1);
	state.messages[type] = messages.length ? messages : defaultMessageList(type);
	input.value = state.messages[type][state.messages[type].length - 1] || '';
	renderMessageLists();
	persistActiveBuddy();
}
function readSavedBuddies() { try { return JSON.parse(localStorage.getItem(BUDDY_STORAGE_KEY) || '{}'); } catch (error) { return {}; } }
function writeSavedBuddies(buddies) { localStorage.setItem(BUDDY_STORAGE_KEY, JSON.stringify(buddies)); }
function renderBuddyOptions(selectedValue = 'preset') { const select = document.querySelector('#buddySelect'); const saved = readSavedBuddies(); select.innerHTML = '<option value="preset">Sunny preset</option>'; Object.keys(saved).forEach((name) => { if (name === 'Sunny preset') return; const option = document.createElement('option'); option.value = `saved:${name}`; option.textContent = name; select.appendChild(option); }); const normalizedValue = selectedValue && select.querySelector(`option[value="${CSS.escape(selectedValue)}"]`) ? selectedValue : 'preset'; select.value = normalizedValue; }
function applyBuddyProfile(profile) { state.size = profile.size; state.colors = [...profile.colors]; state.selectedColorIndex = profile.selectedColorIndex || 0; state.color = state.colors[state.selectedColorIndex] || state.colors[0]; state.fps = { ...profile.fps, saveLater: profile.fps.saveLater || profile.fps.idle || 4 }; state.animation = 'popUp'; state.currentBuddyName = profile.name; state.isReminder = false; state.saveLaterMessage = String(profile.saveLaterMessage || profile.messages && Array.isArray(profile.messages.reminder) && profile.messages.reminder[0] || 'Time to save your work. Save now, or choose Later to keep working.'); buildGrid(); state.animationSets = normalizeAnimationSets(profile); state.animationVariantIndex = Object.fromEntries(animationNames.map((name) => [name, 0])); state.frames = Object.fromEntries(animationNames.map((name) => [name, []])); state.messages = Object.fromEntries(messageTypes.map((type) => [type, normalizeMessageList(profile.messages && profile.messages[type], type)])); document.querySelector('#gridSize').value = String(state.size); document.querySelector('#gridStatus').textContent = `${state.size} × ${state.size}`; document.querySelector('#buddyNameInput').value = profile.name; messageTypes.forEach((type) => { document.querySelector(`#${type}Input`).value = state.messages[type][0] || ''; }); document.querySelector('#saveLaterMessageInput').value = state.saveLaterMessage; colorPicker.value = state.color; renderSwatches(); renderMessageLists(); loadAnimationVariant('popUp', 0); }
function loadBuddy(value) { if (value === 'preset') { applyBuddyProfile(presetProfile()); return; } if (value.startsWith('saved:')) { const profile = readSavedBuddies()[value.slice(6)]; if (profile) applyBuddyProfile(profile); } }
function collectBuddyProfile(name = document.querySelector('#buddyNameInput').value.trim() || 'Sunny preset') { syncFrame(); const animationSets = cloneAnimationSets(state.animationSets); const frames = Object.fromEntries(animationNames.map((type) => [type, animationSets[type][0].frames.map((frame) => [...frame])])); const fps = Object.fromEntries(animationNames.map((type) => [type, animationSets[type][0].fps])); return { name, size: state.size, colors: [...state.colors], selectedColorIndex: state.selectedColorIndex, fps, frames, animationSets, saveLaterMessage: state.saveLaterMessage, messages: { ...Object.fromEntries(messageTypes.map((type) => [type, [...state.messages[type]]])), reminder: [state.saveLaterMessage] } }; }
function saveBuddy() { const profile = collectBuddyProfile(); const buddies = readSavedBuddies(); buddies[profile.name] = profile; writeSavedBuddies(buddies); state.currentBuddyName = profile.name; renderBuddyOptions(`saved:${profile.name}`); }
function downloadBuddy() { const profile = collectBuddyProfile(); const backup = { format: 'B.U.D.D.Y. buddy', version: 2, buddy: profile }; const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); const filename = profile.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'buddy'; link.href = url; link.download = `${filename}.buddy.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 0); }
function validateBuddyBackup(data) { const profile = data && data.format === 'B.U.D.D.Y. buddy' && [1, 2].includes(data.version) ? data.buddy : null; const allowedSizes = [16, 25, 32, 50, 100]; if (!profile || typeof profile.name !== 'string' || !profile.name.trim() || !allowedSizes.includes(profile.size)) return null; if (!Array.isArray(profile.colors) || profile.colors.length !== 20 || profile.colors.some((color) => typeof color !== 'string' || !/^#[\da-f]{6}$/i.test(color))) return null; if (!Number.isInteger(profile.selectedColorIndex) || profile.selectedColorIndex < 0 || profile.selectedColorIndex >= profile.colors.length) return null; const validFrames = (frames) => Array.isArray(frames) && frames.length > 0 && frames.length <= 300 && frames.every((frame) => Array.isArray(frame) && frame.length === profile.size * profile.size && frame.every((color) => color === 'transparent' || (typeof color === 'string' && /^#[\da-f]{6}$/i.test(color)))); const validVariant = (variant) => variant && validFrames(variant.frames) && Number.isInteger(variant.fps) && variant.fps >= 1 && variant.fps <= 30; if (!profile.fps || !standardAnimationNames.every((name) => Number.isInteger(profile.fps[name]) && profile.fps[name] >= 1 && profile.fps[name] <= 30) || (profile.fps.saveLater !== undefined && (!Number.isInteger(profile.fps.saveLater) || profile.fps.saveLater < 1 || profile.fps.saveLater > 30))) return null; if (profile.animationSets) { if (!standardAnimationNames.every((name) => Array.isArray(profile.animationSets[name]) && profile.animationSets[name].length > 0 && profile.animationSets[name].length <= 30 && profile.animationSets[name].every(validVariant)) || (profile.animationSets.saveLater !== undefined && (!Array.isArray(profile.animationSets.saveLater) || profile.animationSets.saveLater.length !== 1 || !validVariant(profile.animationSets.saveLater[0])))) return null; } else if (!profile.frames || !standardAnimationNames.every((name) => validFrames(profile.frames[name])) || (profile.frames.saveLater !== undefined && !validFrames(profile.frames.saveLater))) return null; if (!profile.messages || !messageTypes.every((type) => !Object.hasOwn(profile.messages, type) || (Array.isArray(profile.messages[type]) && profile.messages[type].every((message) => typeof message === 'string'))) || (profile.messages.reminder !== undefined && (!Array.isArray(profile.messages.reminder) || profile.messages.reminder.some((message) => typeof message !== 'string')))) return null; if (profile.saveLaterMessage !== undefined && typeof profile.saveLaterMessage !== 'string') return null; return { ...profile, name: profile.name.trim() }; }
async function uploadBuddy(file) { if (!file) return; if (file.size > 10 * 1024 * 1024) { alert('Buddy backup files must be smaller than 10 MB.'); return; } try { const profile = validateBuddyBackup(JSON.parse(await file.text())); if (!profile) throw new Error('This file is not a valid B.U.D.D.Y. backup.'); const buddies = readSavedBuddies(); const originalName = profile.name; let name = originalName; let suffix = 1; while (name === 'Sunny preset' || Object.hasOwn(buddies, name)) { suffix += 1; name = `${originalName} (imported${suffix > 2 ? ` ${suffix - 1}` : ''})`; } profile.name = name; buddies[name] = profile; writeSavedBuddies(buddies); renderBuddyOptions(`saved:${name}`); loadBuddy(`saved:${name}`); } catch (error) { alert(error instanceof SyntaxError ? 'Could not read this buddy backup. Choose a valid .buddy.json file.' : error.message); } }
function removeBuddy() { const select = document.querySelector('#buddySelect'); const value = select.value; if (!value) return; if (value === 'preset') { const buddies = readSavedBuddies(); if (buddies['Sunny preset']) { delete buddies['Sunny preset']; writeSavedBuddies(buddies); } renderBuddyOptions('preset'); document.querySelector('#buddyNameInput').value = 'Sunny preset'; applyBuddyProfile(presetProfile()); return; } if (value.startsWith('saved:')) { const name = value.slice(6); const buddies = readSavedBuddies(); if (!buddies[name]) return; delete buddies[name]; writeSavedBuddies(buddies); renderBuddyOptions('preset'); document.querySelector('#buddyNameInput').value = 'Sunny preset'; applyBuddyProfile(presetProfile()); } }
function setBuddyMessage(message) { document.querySelector('#buddyMessage').textContent = message; }
function setSpawnButtonForBuddy(open) { const button = document.querySelector('#spawnButton'); button.disabled = open; button.textContent = open ? 'Buddy is here' : 'Spawn buddy'; }
function startIdleBehavior(keepReminderActions = false) { if (!state.buddyOpen) return; clearTimeout(state.choiceReactionTimeout); state.isReminder = keepReminderActions; buddyWindow.classList.remove('reminder', 'later', 'saved'); document.querySelector('#reminderBadge').textContent = 'TIME TO SAVE'; document.querySelector('#reminderBadge').hidden = !keepReminderActions; if (!keepReminderActions) document.querySelector('#saveLaterActions').hidden = true; buddyWindow.classList.add('idle'); setBuddyMessage(pickMessage('idle')); clearInterval(state.messageInterval); state.messageInterval = setInterval(() => setBuddyMessage(pickMessage('idle')), 12000); playBuddyAnimation('idle', null, true); }
function startSaveLaterReminder() { if (!state.buddyOpen) return; clearTimeout(state.choiceReactionTimeout); state.isReminder = true; clearInterval(state.messageInterval); document.querySelector('#saveLaterActions').hidden = false; document.querySelector('#reminderBadge').textContent = 'TIME TO SAVE'; document.querySelector('#reminderBadge').hidden = false; buddyWindow.classList.remove('idle', 'reminder', 'later', 'saved'); if (state.useSaveLaterAnimation) { setBuddyMessage(state.saveLaterMessage); void buddyWindow.offsetWidth; buddyWindow.classList.add('reminder'); playBuddyAnimation('saveLater'); return; } startIdleBehavior(true); }
function openBuddy(isReminder = false) { if (state.buddyOpen) { if (isReminder) startSaveLaterReminder(); return; } if (!buddyWindow.hidden) return; state.buddyOpen = true; state.isReminder = false; document.querySelector('#saveLaterActions').hidden = true; document.querySelector('#reminderBadge').hidden = true; setBuddyMessage(pickMessage('greeting')); setSpawnButtonForBuddy(true); buddyWindow.classList.remove('idle', 'reminder'); if (!state.timerRunning) startTimer(); buddyWindow.hidden = false; if (isReminder) { startSaveLaterReminder(); return; } playBuddyAnimation('popUp', () => startIdleBehavior()); }
function closeBuddy() { if (!state.buddyOpen) return; clearTimeout(state.choiceReactionTimeout); state.buddyOpen = false; state.isReminder = false; buddyWindow.classList.remove('idle', 'reminder', 'later', 'saved'); document.querySelector('#reminderBadge').textContent = 'TIME TO SAVE'; document.querySelector('#reminderBadge').hidden = true; document.querySelector('#saveLaterActions').hidden = true; clearInterval(state.messageInterval); setBuddyMessage(pickMessage('exit')); playBuddyAnimation('exit', () => { buddyWindow.hidden = true; setSpawnButtonForBuddy(false); }); }
function finishSaveReaction() { buddyWindow.hidden = true; buddyWindow.classList.remove('saved'); document.querySelector('#reminderBadge').textContent = 'TIME TO SAVE'; document.querySelector('#reminderBadge').hidden = true; setSpawnButtonForBuddy(false); }
function acknowledgeSave() { if (!state.isReminder) return; state.timerSeconds = state.timerDurationSeconds; renderTimer(); state.isReminder = false; state.buddyOpen = false; clearInterval(state.messageInterval); clearTimeout(state.choiceReactionTimeout); document.querySelector('#saveLaterActions').hidden = true; document.querySelector('#reminderBadge').textContent = 'SAVED!'; document.querySelector('#reminderBadge').hidden = false; buddyWindow.classList.remove('idle', 'reminder', 'later'); buddyWindow.classList.add('saved'); setBuddyMessage('Nice work. Thanks for saving your progress!'); playBuddyAnimation('exit', finishSaveReaction); }
function chooseLater() { if (!state.isReminder) return; state.isReminder = false; clearInterval(state.messageInterval); clearTimeout(state.choiceReactionTimeout); document.querySelector('#saveLaterActions').hidden = true; document.querySelector('#reminderBadge').textContent = 'LATER'; document.querySelector('#reminderBadge').hidden = false; buddyWindow.classList.remove('reminder', 'saved'); buddyWindow.classList.add('idle', 'later'); setBuddyMessage('No problem. Keep working; I will check in again after this timer.'); playBuddyAnimation('idle', null, true); state.choiceReactionTimeout = setTimeout(() => { if (!state.buddyOpen) return; buddyWindow.classList.remove('later'); document.querySelector('#reminderBadge').textContent = 'TIME TO SAVE'; document.querySelector('#reminderBadge').hidden = true; setBuddyMessage(pickMessage('idle')); clearInterval(state.messageInterval); state.messageInterval = setInterval(() => setBuddyMessage(pickMessage('idle')), 12000); }, 1800); }
function setSaveLaterMode(enabled) { state.useSaveLaterAnimation = enabled; localStorage.setItem(SAVE_LATER_TOGGLE_KEY, String(enabled)); if (!state.isReminder) return; clearTimeout(state.playInterval); buddyWindow.classList.remove('reminder', 'idle'); if (enabled) startSaveLaterReminder(); else startIdleBehavior(true); }
function playBuddyAnimation(name, done, loop = false) { if (state.animation === name) storeActiveAnimationVariant(); const variants = state.animationSets[name]; let variantIndex = Math.floor(Math.random() * variants.length); let variant = variants[variantIndex]; let frames = variant.frames; const run = ++state.animationRun; let index = 0; clearTimeout(state.playInterval); buddyImage.removeAttribute('src'); const show = () => { if (run !== state.animationRun) return; buddyImage.src = gridToDataUrl(frames[index]); index += 1; if (index >= frames.length) { if (loop) { if (variants.length > 1) { const next = Math.floor(Math.random() * (variants.length - 1)); variantIndex = next >= variantIndex ? next + 1 : next; variant = variants[variantIndex]; frames = variant.frames; } index = 0; } else { if (done) done(); return; } } state.playInterval = setTimeout(show, 1000 / variant.fps); }; show(); }
function startBuddyDrag(event) { if (event.target.closest('button')) return; const bounds = buddyWindow.getBoundingClientRect(); state.draggingBuddy = true; state.dragOffsetX = event.clientX - bounds.left; state.dragOffsetY = event.clientY - bounds.top; buddyWindow.classList.add('dragging'); buddyWindow.setPointerCapture(event.pointerId); }
function dragBuddy(event) { if (!state.draggingBuddy) return; const left = Math.max(8, Math.min(window.innerWidth - buddyWindow.offsetWidth - 8, event.clientX - state.dragOffsetX)); const top = Math.max(8, Math.min(window.innerHeight - buddyWindow.offsetHeight - 8, event.clientY - state.dragOffsetY)); buddyWindow.style.left = `${left}px`; buddyWindow.style.top = `${top}px`; buddyWindow.style.right = 'auto'; buddyWindow.style.bottom = 'auto'; }
function stopBuddyDrag(event) { if (!state.draggingBuddy) return; state.draggingBuddy = false; buddyWindow.classList.remove('dragging'); if (event && buddyWindow.hasPointerCapture(event.pointerId)) buddyWindow.releasePointerCapture(event.pointerId); }
function startTimer() { if (state.timerRunning) return; state.timerRunning = true; document.querySelector('#timerButton').textContent = 'Pause timer'; document.querySelector('#timerStatus').textContent = 'In progress'; state.timerInterval = setInterval(() => { state.timerSeconds -= 1; renderTimer(); if (state.timerSeconds <= 0) { state.timerSeconds = state.timerDurationSeconds; renderTimer(); openBuddy(true); } }, 1000); }
function toggleTimer() { if (state.timerRunning) { clearInterval(state.timerInterval); state.timerRunning = false; document.querySelector('#timerButton').textContent = 'Resume timer'; document.querySelector('#timerStatus').textContent = 'Paused'; return; } startTimer(); }
function resetTimer() { clearInterval(state.timerInterval); state.timerRunning = false; state.timerSeconds = state.timerDurationSeconds; document.querySelector('#timerButton').textContent = 'Start timer'; document.querySelector('#timerStatus').textContent = 'Ready when you are'; renderTimer(); }

function updateTimerDuration(value) { const minutes = Number(value); if (!Number.isInteger(minutes) || minutes < MIN_TIMER_MINUTES || minutes > MAX_TIMER_MINUTES) { document.querySelector('#timerDurationInput').value = String(state.timerDurationSeconds / 60); return; } state.timerDurationSeconds = minutes * 60; state.timerSeconds = state.timerDurationSeconds; localStorage.setItem(TIMER_DURATION_KEY, String(minutes)); document.querySelector('#timerStatus').textContent = state.timerRunning ? 'In progress' : 'Ready when you are'; renderTimer(); }

document.querySelectorAll('.tool-button').forEach((button) => button.addEventListener('click', () => setTool(button.dataset.tool)));
document.querySelectorAll('.animation-tab').forEach((button) => button.addEventListener('click', () => selectAnimation(button.dataset.animation)));
document.querySelector('#gridSize').addEventListener('change', (event) => { state.size = Number(event.target.value); document.querySelector('#gridStatus').textContent = `${state.size} × ${state.size}`; buildGrid(); });
document.querySelector('#buddySelect').addEventListener('change', (event) => loadBuddy(event.target.value));
document.querySelector('#saveBuddyButton').addEventListener('click', saveBuddy);
document.querySelector('#downloadBuddyButton').addEventListener('click', downloadBuddy);
document.querySelector('#uploadBuddyButton').addEventListener('click', () => document.querySelector('#uploadBuddyInput').click());
document.querySelector('#uploadBuddyInput').addEventListener('change', (event) => { uploadBuddy(event.target.files[0]); event.target.value = ''; });
document.querySelector('#removeBuddyButton').addEventListener('click', removeBuddy);
colorPicker.addEventListener('input', (event) => { state.color = event.target.value; });
document.querySelector('#applyColorButton').addEventListener('click', applyColorToSelectedSlot);
document.querySelectorAll('.message-button').forEach((button) => {
	button.addEventListener('click', () => {
		const { messageType, messageAction } = button.dataset;
		if (messageAction === 'add') addMessage(messageType);
		if (messageAction === 'remove') removeMessage(messageType);
	});
});
messageTypes.forEach((type) => {
	const input = document.querySelector(`#${type}Input`);
	if (!input) return;
	input.addEventListener('change', () => {
		const value = input.value.trim();
		if (!value) return;
		if (!state.messages[type].includes(value)) state.messages[type] = [...state.messages[type], value];
		renderMessageLists();
	});
	input.addEventListener('focus', () => {
		const messages = state.messages[type];
		if (messages.length && !messages.includes(input.value)) input.value = messages[0];
	});
});
document.querySelector('#clearButton').addEventListener('click', () => { saveHistory(); state.grid = blankFrame(); syncFrame(); renderGrid(); });
function undo() { const previous = state.history.pop(); if (!previous) return; state.redoHistory.push(snapshot()); state.grid = previous; syncFrame(); renderGrid(); }
function redo() { const next = state.redoHistory.pop(); if (!next) return; state.history.push(snapshot()); state.grid = next; syncFrame(); renderGrid(); }
document.querySelector('#undoButton').addEventListener('click', undo);
document.querySelector('#redoButton').addEventListener('click', redo);
document.querySelector('#fpsInput').addEventListener('change', (event) => { state.fps[state.animation] = Math.max(1, Math.min(30, Number(event.target.value) || 1)); event.target.value = state.fps[state.animation]; storeActiveAnimationVariant(); });
document.querySelector('#addFrameButton').addEventListener('click', () => { state.frames[state.animation].push(blankFrame()); state.frameIndex = state.frames[state.animation].length - 1; state.grid = [...state.frames[state.animation][state.frameIndex]]; renderGrid(); syncFrame(); });
document.querySelector('#copyFrameButton').addEventListener('click', () => { state.frames[state.animation].splice(state.frameIndex + 1, 0, [...state.grid]); state.frameIndex += 1; syncFrame(); });
document.querySelector('#copyFrameToAnimationButton').addEventListener('click', () => { const targetName = document.querySelector('#copyFrameTarget').value; copyFrameToAnimation(targetName); });
document.querySelector('#deleteFrameButton').addEventListener('click', () => { if (state.frames[state.animation].length === 1) return; state.frames[state.animation].splice(state.frameIndex, 1); state.frameIndex = Math.min(state.frameIndex, state.frames[state.animation].length - 1); state.grid = [...state.frames[state.animation][state.frameIndex]]; renderGrid(); syncFrame(); });
document.querySelector('#addAnimationVariantButton').addEventListener('click', addAnimationVariant);
document.querySelector('#removeAnimationVariantButton').addEventListener('click', removeAnimationVariant);
document.querySelector('#playButton').addEventListener('click', () => playBuddyAnimation(state.animation));
document.querySelector('#buddyWindowBar').addEventListener('pointerdown', startBuddyDrag); buddyWindow.addEventListener('pointermove', dragBuddy); buddyWindow.addEventListener('pointerup', stopBuddyDrag); buddyWindow.addEventListener('pointercancel', stopBuddyDrag);
document.querySelector('#spawnButton').addEventListener('click', () => openBuddy()); document.querySelector('#closeBuddyButton').addEventListener('click', closeBuddy); document.querySelector('#saveReminderButton').addEventListener('click', acknowledgeSave); document.querySelector('#laterReminderButton').addEventListener('click', chooseLater); document.querySelector('#timerButton').addEventListener('click', toggleTimer); document.querySelector('#resetTimerButton').addEventListener('click', resetTimer);
const timerDurationInput = document.querySelector('#timerDurationInput');
timerDurationInput.value = String(initialTimerMinutes);
timerDurationInput.addEventListener('change', () => updateTimerDuration(timerDurationInput.value));
const saveLaterMessageInput = document.querySelector('#saveLaterMessageInput');
saveLaterMessageInput.addEventListener('change', () => { const value = saveLaterMessageInput.value.trim(); if (!value) { saveLaterMessageInput.value = state.saveLaterMessage; return; } state.saveLaterMessage = value; persistActiveBuddy(); if (state.isReminder && state.useSaveLaterAnimation) setBuddyMessage(value); });
const useSaveLaterAnimationToggle = document.querySelector('#useSaveLaterAnimationToggle');
state.useSaveLaterAnimation = localStorage.getItem(SAVE_LATER_TOGGLE_KEY) !== 'false';
useSaveLaterAnimationToggle.checked = state.useSaveLaterAnimation;
useSaveLaterAnimationToggle.addEventListener('change', () => setSaveLaterMode(useSaveLaterAnimationToggle.checked));
window.addEventListener('keydown', (event) => { if (event.target.matches('input')) return; const key = event.key.toLowerCase(); const modifier = event.ctrlKey || event.metaKey; if (modifier && key === 'z') { event.preventDefault(); if (event.shiftKey) redo(); else undo(); return; } const tools = { b: 'brush', e: 'eraser', f: 'fill', i: 'eyedropper' }; if (tools[key]) setTool(tools[key]); if (/^[1-9]$/.test(key)) { const color = state.colors[Number(key) - 1]; state.color = color; colorPicker.value = color; renderSwatches(); } });

renderBuddyOptions(); loadBuddy('preset'); renderTimer();
