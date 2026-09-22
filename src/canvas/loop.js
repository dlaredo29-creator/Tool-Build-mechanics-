/* =========================================
   ANIMATION LOOP
========================================= */

export function startLoop(draw) {

    function frame() {

        draw();

        requestAnimationFrame(frame);
    }


    requestAnimationFrame(frame);
}