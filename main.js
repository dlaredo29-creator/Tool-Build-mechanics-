const DEFAULT_COLORS = ['#ff6b5f', '#f5d66e', '#cfe9dd', '#202925', '#88b7e8', '#d7a6df', '#f3b278', '#9bd3c1', '#f7f7f2', '#ce453e', '#e3bb39', '#83baa1', '#66736c', '#5887bd', '#a979af', '#bb7d4b', '#6fafa0', '#b9c5bf', '#ffffff', '#000000'];
const animationNames = ['popUp', 'idle', 'exit'];
const state = { size: 16, tool: 'brush', color: DEFAULT_COLORS[0], colors: [...DEFAULT_COLORS], grid: [], history: [], animation: 'popUp', frames: { popUp: [], idle: [], exit: [] }, frameIndex: 0, fps: { popUp: 8, idle: 4, exit: 10 }, timerSeconds: 900, timerRunning: false, timerInterval: null, buddyOpen: false, playInterval: null, messageInterval: null };

const pixelGrid = document.querySelector('#pixelGrid');
const colorPicker = document.querySelector('#colorPicker');
const swatches = document.querySelector('#swatches');
const frameStrip = document.querySelector('#frameStrip');
const buddyDisplay = document.querySelector('#buddyDisplay');
const buddyWindow = document.querySelector('#buddyWindow');

function blankFrame() { return Array(state.size * state.size).fill('transparent'); }
function snapshot() { return [...state.grid]; }
function saveHistory() { state.history.push(snapshot()); if (state.history.length > 30) state.history.shift(); }
function buildGrid() {
	state.grid = blankFrame(); state.history = [];
	state.frames = { popUp: [state.grid.slice()], idle: [state.grid.slice()], exit: [state.grid.slice()] };
	state.frameIndex = 0;
	pixelGrid.innerHTML = ''; pixelGrid.style.gridTemplateColumns = `repeat(${state.size}, 1fr)`; pixelGrid.dataset.size = state.size;
	for (let index = 0; index < state.grid.length; index += 1) {
		const cell = document.createElement('button'); cell.className = 'pixel'; cell.type = 'button'; cell.dataset.index = index; cell.setAttribute('aria-label', `Pixel ${index + 1}`);
		cell.addEventListener('pointerdown', (event) => { event.preventDefault(); paint(index); }); cell.addEventListener('pointerenter', () => { if (painting) paint(index); }); pixelGrid.appendChild(cell);
	}
	renderGrid(); renderFrames();
}
let painting = false;
pixelGrid.addEventListener('pointerdown', () => { painting = true; }); window.addEventListener('pointerup', () => { painting = false; });
function renderGrid() { [...pixelGrid.children].forEach((cell, index) => { cell.style.backgroundColor = state.grid[index] === 'transparent' ? 'white' : state.grid[index]; }); }
function paint(index) {
	if (state.tool === 'eyedropper') { const picked = state.grid[index]; if (picked && picked !== 'transparent') { state.color = picked; colorPicker.value = picked; renderSwatches(); } setTool('brush'); return; }
	if (state.tool === 'fill') { saveHistory(); floodFill(index); renderGrid(); syncFrame(); return; }
	saveHistory(); state.grid[index] = state.tool === 'eraser' ? 'transparent' : state.color; renderGrid(); syncFrame();
}
function floodFill(startIndex) { const oldColor = state.grid[startIndex]; if (oldColor === state.color) return; const pending = [startIndex]; const visited = new Set(); while (pending.length) { const index = pending.pop(); if (visited.has(index) || state.grid[index] !== oldColor) continue; visited.add(index); state.grid[index] = state.color; const row = Math.floor(index / state.size); const column = index % state.size; if (column > 0) pending.push(index - 1); if (column < state.size - 1) pending.push(index + 1); if (row > 0) pending.push(index - state.size); if (row < state.size - 1) pending.push(index + state.size); } }
function syncFrame() { state.frames[state.animation][state.frameIndex] = [...state.grid]; renderFrames(); }
function setTool(tool) { state.tool = tool; document.querySelectorAll('.tool-button').forEach((button) => button.classList.toggle('active', button.dataset.tool === tool)); document.querySelector('#toolStatus').textContent = `${tool[0].toUpperCase()}${tool.slice(1)} active`; }
function renderSwatches() { swatches.innerHTML = ''; state.colors.forEach((color, index) => { const swatch = document.createElement('button'); swatch.className = `swatch${color === state.color ? ' active' : ''}`; swatch.style.backgroundColor = color; swatch.title = `Color ${index + 1}`; swatch.type = 'button'; swatch.addEventListener('click', () => { state.color = color; colorPicker.value = color; renderSwatches(); setTool('brush'); }); swatch.addEventListener('dblclick', () => { state.colors[index] = colorPicker.value; state.color = colorPicker.value; renderSwatches(); }); swatches.appendChild(swatch); }); }
function gridToDataUrl(frame) { const canvas = document.createElement('canvas'); canvas.width = state.size; canvas.height = state.size; const context = canvas.getContext('2d'); frame.forEach((color, index) => { if (color !== 'transparent') { context.fillStyle = color; context.fillRect(index % state.size, Math.floor(index / state.size), 1, 1); } }); return canvas.toDataURL(); }
function renderFrames() { const frames = state.frames[state.animation]; frameStrip.innerHTML = ''; frames.forEach((frame, index) => { const thumbnail = document.createElement('button'); thumbnail.className = `frame-thumb${index === state.frameIndex ? ' active' : ''}`; thumbnail.type = 'button'; thumbnail.style.backgroundImage = `url(${gridToDataUrl(frame)})`; thumbnail.title = `Frame ${index + 1}`; thumbnail.addEventListener('click', () => { state.frameIndex = index; state.grid = [...frame]; renderGrid(); renderFrames(); }); frameStrip.appendChild(thumbnail); }); document.querySelector('#frameCount').textContent = `${frames.length} frame${frames.length === 1 ? '' : 's'}`; }
function selectAnimation(name) { state.animation = name; state.frameIndex = 0; state.grid = [...state.frames[name][0]]; document.querySelectorAll('.animation-tab').forEach((button) => button.classList.toggle('active', button.dataset.animation === name)); document.querySelector('#fpsInput').value = state.fps[name]; renderGrid(); renderFrames(); }
function formatTime(seconds) { return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
function renderTimer() { document.querySelector('#timerDisplay').textContent = formatTime(state.timerSeconds); document.querySelector('#buddyTime').textContent = `${formatTime(state.timerSeconds)} remaining`; }
function setBuddyMessage(message) { document.querySelector('#buddyMessage').textContent = message; }
function openBuddy() { state.buddyOpen = true; buddyWindow.hidden = false; buddyWindow.classList.remove('idle'); setBuddyMessage(document.querySelector('#greetingInput').value || 'Hey! Ready to make a little progress?'); playBuddyAnimation('popUp', () => { buddyWindow.classList.add('idle'); clearInterval(state.messageInterval); state.messageInterval = setInterval(() => setBuddyMessage(document.querySelector('#idleInput').value || 'Still with you. Keep going.'), 12000); }); }
function closeBuddy() { buddyWindow.classList.remove('idle'); clearInterval(state.messageInterval); playBuddyAnimation('exit', () => { state.buddyOpen = false; buddyWindow.hidden = true; }); setBuddyMessage(document.querySelector('#exitInput').value || 'Nice work. See you next time!'); }
function playBuddyAnimation(name, done) { const frames = state.frames[name]; let index = 0; clearInterval(state.playInterval); const show = () => { buddyDisplay.style.backgroundImage = `url(${gridToDataUrl(frames[index])})`; index += 1; if (index >= frames.length) { clearInterval(state.playInterval); if (done) done(); } }; show(); state.playInterval = setInterval(show, 1000 / state.fps[name]); }
function toggleTimer() { if (state.timerRunning) { clearInterval(state.timerInterval); state.timerRunning = false; document.querySelector('#timerButton').textContent = 'Resume timer'; document.querySelector('#timerStatus').textContent = 'Paused'; return; } state.timerRunning = true; document.querySelector('#timerButton').textContent = 'Pause timer'; document.querySelector('#timerStatus').textContent = 'In progress'; state.timerInterval = setInterval(() => { state.timerSeconds -= 1; renderTimer(); if (state.timerSeconds <= 0) { state.timerSeconds = 900; openBuddy(); } }, 1000); }
function resetTimer() { clearInterval(state.timerInterval); state.timerRunning = false; state.timerSeconds = 900; document.querySelector('#timerButton').textContent = 'Start timer'; document.querySelector('#timerStatus').textContent = 'Ready when you are'; renderTimer(); }

document.querySelectorAll('.tool-button').forEach((button) => button.addEventListener('click', () => setTool(button.dataset.tool)));
document.querySelectorAll('.animation-tab').forEach((button) => button.addEventListener('click', () => selectAnimation(button.dataset.animation)));
document.querySelector('#gridSize').addEventListener('change', (event) => { state.size = Number(event.target.value); document.querySelector('#gridStatus').textContent = `${state.size} × ${state.size}`; buildGrid(); });
colorPicker.addEventListener('input', (event) => { state.color = event.target.value; renderSwatches(); });
document.querySelector('#clearButton').addEventListener('click', () => { saveHistory(); state.grid = blankFrame(); syncFrame(); renderGrid(); });
document.querySelector('#undoButton').addEventListener('click', () => { const previous = state.history.pop(); if (previous) { state.grid = previous; syncFrame(); renderGrid(); } });
document.querySelector('#fpsInput').addEventListener('change', (event) => { state.fps[state.animation] = Math.max(1, Math.min(30, Number(event.target.value) || 1)); event.target.value = state.fps[state.animation]; });
document.querySelector('#addFrameButton').addEventListener('click', () => { state.frames[state.animation].push(blankFrame()); state.frameIndex = state.frames[state.animation].length - 1; state.grid = [...state.frames[state.animation][state.frameIndex]]; renderGrid(); renderFrames(); });
document.querySelector('#copyFrameButton').addEventListener('click', () => { state.frames[state.animation].splice(state.frameIndex + 1, 0, [...state.grid]); state.frameIndex += 1; renderFrames(); });
document.querySelector('#deleteFrameButton').addEventListener('click', () => { if (state.frames[state.animation].length === 1) return; state.frames[state.animation].splice(state.frameIndex, 1); state.frameIndex = Math.min(state.frameIndex, state.frames[state.animation].length - 1); state.grid = [...state.frames[state.animation][state.frameIndex]]; renderGrid(); renderFrames(); });
document.querySelector('#playButton').addEventListener('click', () => playBuddyAnimation(state.animation));
document.querySelector('#spawnButton').addEventListener('click', openBuddy); document.querySelector('#closeBuddyButton').addEventListener('click', closeBuddy); document.querySelector('#timerButton').addEventListener('click', toggleTimer); document.querySelector('#resetTimerButton').addEventListener('click', resetTimer);
window.addEventListener('keydown', (event) => { if (event.target.matches('input')) return; const key = event.key.toLowerCase(); const tools = { b: 'brush', e: 'eraser', f: 'fill', i: 'eyedropper' }; if (tools[key]) setTool(tools[key]); if (/^[1-9]$/.test(key)) { const color = state.colors[Number(key) - 1]; state.color = color; colorPicker.value = color; renderSwatches(); } });

buildGrid(); renderSwatches(); renderTimer();
