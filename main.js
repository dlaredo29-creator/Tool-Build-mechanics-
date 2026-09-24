const DEFAULT_COLORS = ['#ff6b5f', '#f5d66e', '#cfe9dd', '#202925', '#88b7e8', '#d7a6df', '#f3b278', '#9bd3c1', '#f7f7f2', '#ce453e', '#e3bb39', '#83baa1', '#66736c', '#5887bd', '#a979af', '#bb7d4b', '#6fafa0', '#b9c5bf', '#ffffff', '#000000'];
const animationNames = ['popUp', 'idle', 'exit'];
const messageTypes = ['greeting', 'idle', 'exit'];
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
	frames: { popUp: [], idle: [], exit: [] },
	frameIndex: 0,
	fps: { popUp: 8, idle: 4, exit: 10 },
	timerSeconds: 900,
	timerRunning: false,
	timerInterval: null,
	buddyOpen: false,
	playInterval: null,
	animationRun: 0,
	messageInterval: null,
	draggingBuddy: false,
	dragOffsetX: 0,
	dragOffsetY: 0,
	currentBuddyName: 'My buddy',
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
	state.frames = { popUp: [state.grid.slice()], idle: [state.grid.slice()], exit: [state.grid.slice()] };
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
function syncFrame() { state.frames[state.animation][state.frameIndex] = [...state.grid]; renderFrames(); }
function setTool(tool) { state.tool = tool; document.querySelectorAll('.tool-button').forEach((button) => button.classList.toggle('active', button.dataset.tool === tool)); document.querySelector('#toolStatus').textContent = `${tool[0].toUpperCase()}${tool.slice(1)} active`; }
function renderSwatches() { swatches.innerHTML = ''; state.colors.forEach((color, index) => { const swatch = document.createElement('button'); swatch.className = `swatch${color === state.color ? ' active' : ''}${index === state.selectedColorIndex ? ' selected' : ''}`; swatch.style.backgroundColor = color; swatch.title = `Color ${index + 1}`; swatch.type = 'button'; swatch.addEventListener('click', () => { state.selectedColorIndex = index; state.color = color; colorPicker.value = color; renderSwatches(); setTool('brush'); }); swatches.appendChild(swatch); }); }
function applyColorToSelectedSlot() { state.colors[state.selectedColorIndex] = colorPicker.value; state.color = colorPicker.value; renderSwatches(); setTool('brush'); }
function gridToDataUrl(frame) { const canvas = document.createElement('canvas'); canvas.width = state.size; canvas.height = state.size; const context = canvas.getContext('2d'); frame.forEach((color, index) => { if (color !== 'transparent') { context.fillStyle = color; context.fillRect(index % state.size, Math.floor(index / state.size), 1, 1); } }); return canvas.toDataURL(); }
function renderFrames() { const frames = state.frames[state.animation]; frameStrip.innerHTML = ''; frames.forEach((frame, index) => { const thumbnail = document.createElement('button'); thumbnail.className = `frame-thumb${index === state.frameIndex ? ' active' : ''}`; thumbnail.type = 'button'; thumbnail.style.backgroundImage = `url(${gridToDataUrl(frame)})`; thumbnail.title = `Frame ${index + 1}`; thumbnail.addEventListener('click', () => { state.frameIndex = index; state.grid = [...frame]; renderGrid(); renderFrames(); }); frameStrip.appendChild(thumbnail); }); document.querySelector('#frameCount').textContent = `${frames.length} frame${frames.length === 1 ? '' : 's'}`; }
function selectAnimation(name, frameIndex = 0) { state.animation = name; state.frameIndex = frameIndex; if (!state.frames[name] || !state.frames[name][frameIndex]) { state.frameIndex = 0; } state.grid = [...(state.frames[name][state.frameIndex] || blankFrame())]; document.querySelectorAll('.animation-tab').forEach((button) => button.classList.toggle('active', button.dataset.animation === name)); document.querySelector('#fpsInput').value = state.fps[name]; document.querySelector('#copyFrameTarget').value = name; renderGrid(); renderFrames(); }
function copyFrameToAnimation(targetName) {
	const sourceFrame = [...state.frames[state.animation][state.frameIndex]];
	const targetFrames = state.frames[targetName];
	if (!targetFrames) return;
	targetFrames.push([...sourceFrame]);
	const targetIndex = targetFrames.length - 1;
	state.animation = targetName;
	state.frameIndex = targetIndex;
	state.grid = [...sourceFrame];
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
function presetFrame(size, pose) { const frame = Array(size * size).fill('transparent'); const put = (x, y, color) => { const column = Math.floor(x * size / 16); const row = Math.floor(y * size / 16); if (column >= 0 && column < size && row >= 0 && row < size) frame[row * size + column] = color; }; const offset = pose === 'up' ? -1 : pose === 'down' ? 1 : 0; for (let y = 5 + offset; y <= 12 + offset; y += 1) for (let x = 4; x <= 11; x += 1) put(x, y, '#f6d77b'); for (let x = 5; x <= 10; x += 1) { put(x, 4 + offset, '#ee806f'); put(x, 13 + offset, '#26352f'); } put(4, 6 + offset, '#ee806f'); put(11, 6 + offset, '#ee806f'); put(6, 8 + offset, '#26352f'); put(9, 8 + offset, '#26352f'); put(7, 11 + offset, '#ee806f'); put(8, 11 + offset, '#ee806f'); return frame; }
function presetProfile() { return { name: 'Sunny preset', size: 16, colors: [...DEFAULT_COLORS], selectedColorIndex: 1, fps: { popUp: 6, idle: 3, exit: 8 }, frames: { popUp: [presetFrame(16, 'up'), presetFrame(16, 'center'), presetFrame(16, 'down')], idle: [presetFrame(16, 'center'), presetFrame(16, 'up')], exit: [presetFrame(16, 'down'), presetFrame(16, 'up')] }, messages: { greeting: ['Hi! I am Sunny. Let us take one small step.', 'Ready for a tiny win?'], idle: ['You are doing great. Keep going!', 'One small step is still progress.'], exit: ['See you soon!', 'Take a breath and come back when you are ready.'] } }; }
function defaultMessageList(type) {
	const defaults = {
		greeting: ['Hey! Ready to make a little progress?'],
		idle: ['Still with you. Keep going.'],
		exit: ['Nice work. See you next time!']
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
		exit: [...state.messages.exit]
	};
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
function applyBuddyProfile(profile) { state.size = profile.size; state.colors = [...profile.colors]; state.selectedColorIndex = profile.selectedColorIndex || 0; state.color = state.colors[state.selectedColorIndex] || state.colors[0]; state.fps = { ...profile.fps }; state.animation = 'popUp'; state.currentBuddyName = profile.name; buildGrid(); state.frames = cloneFrames(profile.frames); state.frameIndex = 0; state.grid = [...state.frames.popUp[0]]; state.messages = { greeting: normalizeMessageList(profile.messages && profile.messages.greeting, 'greeting'), idle: normalizeMessageList(profile.messages && profile.messages.idle, 'idle'), exit: normalizeMessageList(profile.messages && profile.messages.exit, 'exit') }; document.querySelector('#gridSize').value = String(state.size); document.querySelector('#gridStatus').textContent = `${state.size} × ${state.size}`; document.querySelector('#buddyNameInput').value = profile.name; document.querySelector('#greetingInput').value = state.messages.greeting[0] || ''; document.querySelector('#idleInput').value = state.messages.idle[0] || ''; document.querySelector('#exitInput').value = state.messages.exit[0] || ''; colorPicker.value = state.color; renderGrid(); renderSwatches(); renderFrames(); renderMessageLists(); selectAnimation('popUp'); }
function loadBuddy(value) { if (value === 'preset') { applyBuddyProfile(presetProfile()); return; } if (value.startsWith('saved:')) { const profile = readSavedBuddies()[value.slice(6)]; if (profile) applyBuddyProfile(profile); } }
function saveBuddy() { syncFrame(); const name = document.querySelector('#buddyNameInput').value.trim() || 'Sunny preset'; const buddies = readSavedBuddies(); const cleanedName = name || 'Sunny preset'; buddies[cleanedName] = { name: cleanedName, size: state.size, colors: [...state.colors], selectedColorIndex: state.selectedColorIndex, fps: { ...state.fps }, frames: cloneFrames(state.frames), messages: { greeting: [...state.messages.greeting], idle: [...state.messages.idle], exit: [...state.messages.exit] } }; writeSavedBuddies(buddies); state.currentBuddyName = cleanedName; renderBuddyOptions(`saved:${cleanedName}`); }
function removeBuddy() { const select = document.querySelector('#buddySelect'); const value = select.value; if (!value) return; if (value === 'preset') { const buddies = readSavedBuddies(); if (buddies['Sunny preset']) { delete buddies['Sunny preset']; writeSavedBuddies(buddies); } renderBuddyOptions('preset'); document.querySelector('#buddyNameInput').value = 'Sunny preset'; applyBuddyProfile(presetProfile()); return; } if (value.startsWith('saved:')) { const name = value.slice(6); const buddies = readSavedBuddies(); if (!buddies[name]) return; delete buddies[name]; writeSavedBuddies(buddies); renderBuddyOptions('preset'); document.querySelector('#buddyNameInput').value = 'Sunny preset'; applyBuddyProfile(presetProfile()); } }
function setBuddyMessage(message) { document.querySelector('#buddyMessage').textContent = message; }
function openBuddy() { if (state.buddyOpen || !buddyWindow.hidden) return; state.buddyOpen = true; buddyWindow.hidden = false; document.querySelector('#spawnButton').disabled = true; document.querySelector('#spawnButton').textContent = 'Buddy is here'; buddyWindow.classList.remove('idle'); setBuddyMessage(pickMessage('greeting')); if (!state.timerRunning) startTimer(); playBuddyAnimation('popUp', () => { if (!state.buddyOpen) return; buddyWindow.classList.add('idle'); clearInterval(state.messageInterval); state.messageInterval = setInterval(() => setBuddyMessage(pickMessage('idle')), 12000); playBuddyAnimation('idle', null, true); }); }
function closeBuddy() { if (!state.buddyOpen) return; state.buddyOpen = false; buddyWindow.classList.remove('idle'); clearInterval(state.messageInterval); playBuddyAnimation('exit', () => { buddyWindow.hidden = true; document.querySelector('#spawnButton').disabled = false; document.querySelector('#spawnButton').textContent = 'Spawn buddy'; }); setBuddyMessage(pickMessage('exit')); }
function playBuddyAnimation(name, done, loop = false) { const frames = state.frames[name]; const run = ++state.animationRun; let index = 0; clearTimeout(state.playInterval); buddyImage.removeAttribute('src'); const show = () => { if (run !== state.animationRun) return; buddyImage.src = gridToDataUrl(frames[index]); index += 1; if (index >= frames.length) { if (loop) { index = 0; } else { if (done) done(); return; } } state.playInterval = setTimeout(show, 1000 / state.fps[name]); }; show(); }
function startBuddyDrag(event) { if (event.target.closest('button')) return; const bounds = buddyWindow.getBoundingClientRect(); state.draggingBuddy = true; state.dragOffsetX = event.clientX - bounds.left; state.dragOffsetY = event.clientY - bounds.top; buddyWindow.classList.add('dragging'); buddyWindow.setPointerCapture(event.pointerId); }
function dragBuddy(event) { if (!state.draggingBuddy) return; const left = Math.max(8, Math.min(window.innerWidth - buddyWindow.offsetWidth - 8, event.clientX - state.dragOffsetX)); const top = Math.max(8, Math.min(window.innerHeight - buddyWindow.offsetHeight - 8, event.clientY - state.dragOffsetY)); buddyWindow.style.left = `${left}px`; buddyWindow.style.top = `${top}px`; buddyWindow.style.right = 'auto'; buddyWindow.style.bottom = 'auto'; }
function stopBuddyDrag(event) { if (!state.draggingBuddy) return; state.draggingBuddy = false; buddyWindow.classList.remove('dragging'); if (event && buddyWindow.hasPointerCapture(event.pointerId)) buddyWindow.releasePointerCapture(event.pointerId); }
function startTimer() { if (state.timerRunning) return; state.timerRunning = true; document.querySelector('#timerButton').textContent = 'Pause timer'; document.querySelector('#timerStatus').textContent = 'In progress'; state.timerInterval = setInterval(() => { state.timerSeconds -= 1; renderTimer(); if (state.timerSeconds <= 0) { state.timerSeconds = 900; renderTimer(); openBuddy(); } }, 1000); }
function toggleTimer() { if (state.timerRunning) { clearInterval(state.timerInterval); state.timerRunning = false; document.querySelector('#timerButton').textContent = 'Resume timer'; document.querySelector('#timerStatus').textContent = 'Paused'; return; } startTimer(); }
function resetTimer() { clearInterval(state.timerInterval); state.timerRunning = false; state.timerSeconds = 900; document.querySelector('#timerButton').textContent = 'Start timer'; document.querySelector('#timerStatus').textContent = 'Ready when you are'; renderTimer(); }

document.querySelectorAll('.tool-button').forEach((button) => button.addEventListener('click', () => setTool(button.dataset.tool)));
document.querySelectorAll('.animation-tab').forEach((button) => button.addEventListener('click', () => selectAnimation(button.dataset.animation)));
document.querySelector('#gridSize').addEventListener('change', (event) => { state.size = Number(event.target.value); document.querySelector('#gridStatus').textContent = `${state.size} × ${state.size}`; buildGrid(); });
document.querySelector('#buddySelect').addEventListener('change', (event) => loadBuddy(event.target.value));
document.querySelector('#saveBuddyButton').addEventListener('click', saveBuddy);
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
document.querySelector('#fpsInput').addEventListener('change', (event) => { state.fps[state.animation] = Math.max(1, Math.min(30, Number(event.target.value) || 1)); event.target.value = state.fps[state.animation]; });
document.querySelector('#addFrameButton').addEventListener('click', () => { state.frames[state.animation].push(blankFrame()); state.frameIndex = state.frames[state.animation].length - 1; state.grid = [...state.frames[state.animation][state.frameIndex]]; renderGrid(); renderFrames(); });
document.querySelector('#copyFrameButton').addEventListener('click', () => { state.frames[state.animation].splice(state.frameIndex + 1, 0, [...state.grid]); state.frameIndex += 1; renderFrames(); });
document.querySelector('#copyFrameToAnimationButton').addEventListener('click', () => { const targetName = document.querySelector('#copyFrameTarget').value; copyFrameToAnimation(targetName); });
document.querySelector('#deleteFrameButton').addEventListener('click', () => { if (state.frames[state.animation].length === 1) return; state.frames[state.animation].splice(state.frameIndex, 1); state.frameIndex = Math.min(state.frameIndex, state.frames[state.animation].length - 1); state.grid = [...state.frames[state.animation][state.frameIndex]]; renderGrid(); renderFrames(); });
document.querySelector('#playButton').addEventListener('click', () => playBuddyAnimation(state.animation));
document.querySelector('#buddyWindowBar').addEventListener('pointerdown', startBuddyDrag); buddyWindow.addEventListener('pointermove', dragBuddy); buddyWindow.addEventListener('pointerup', stopBuddyDrag); buddyWindow.addEventListener('pointercancel', stopBuddyDrag);
document.querySelector('#spawnButton').addEventListener('click', openBuddy); document.querySelector('#closeBuddyButton').addEventListener('click', closeBuddy); document.querySelector('#timerButton').addEventListener('click', toggleTimer); document.querySelector('#resetTimerButton').addEventListener('click', resetTimer);
window.addEventListener('keydown', (event) => { if (event.target.matches('input')) return; const key = event.key.toLowerCase(); const modifier = event.ctrlKey || event.metaKey; if (modifier && key === 'z') { event.preventDefault(); if (event.shiftKey) redo(); else undo(); return; } const tools = { b: 'brush', e: 'eraser', f: 'fill', i: 'eyedropper' }; if (tools[key]) setTool(tools[key]); if (/^[1-9]$/.test(key)) { const color = state.colors[Number(key) - 1]; state.color = color; colorPicker.value = color; renderSwatches(); } });

buildGrid(); renderBuddyOptions(); renderSwatches(); renderMessageLists(); renderTimer();
