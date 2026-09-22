/* =========================================
   REUSABLE STUDIO ENGINE
   Main entry point
========================================= */

import { setupCanvas } from "./src/canvas/setupCanvas.js";
import { startLoop } from "./src/canvas/loop.js";
import { createInput } from "./src/input/input.js";


// =========================================
// CANVAS
// =========================================

const canvas = document.querySelector("#systemCanvas");

const ctx = setupCanvas(canvas);


// =========================================
// INPUT
// =========================================

const input = createInput(canvas);


// =========================================
// SYSTEM STATE
// =========================================

const state = {
    radius: 40,
    pulse: 0
};


// =========================================
// DRAW
// =========================================

function draw() {

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // Clear the canvas.
    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    // Convert mouse X position into a radius.
    const targetRadius =
        20 + input.x * 100;


    // Smoothly move toward the target radius.
    state.radius +=
        (targetRadius - state.radius) * 0.08;


    // The ring pulses continuously.
    state.pulse += 0.04;


    const pulseAmount =
        Math.sin(state.pulse) * 5;


    const finalRadius =
        state.radius + pulseAmount;


    // Center of the canvas.
    const centerX = width / 2;
    const centerY = height / 2;


    // Draw the single visual form.
    ctx.beginPath();

    ctx.arc(
        centerX,
        centerY,
        finalRadius,
        0,
        Math.PI * 2
    );


    ctx.strokeStyle = "#8FE8FF";
    ctx.lineWidth = 2;

    ctx.stroke();
}


// =========================================
// START
// =========================================

startLoop(draw);