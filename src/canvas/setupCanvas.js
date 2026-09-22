/* =========================================
   CANVAS SETUP
   Handles HiDPI scaling
========================================= */

export function setupCanvas(canvas) {

    const ctx = canvas.getContext("2d");

    function resizeCanvas() {

        const pixelRatio =
            window.devicePixelRatio || 1;

        const width =
            canvas.clientWidth;

        const height =
            canvas.clientHeight;


        // Set the real pixel dimensions.
        canvas.width =
            width * pixelRatio;

        canvas.height =
            height * pixelRatio;


        // Scale drawing coordinates back to
        // normal CSS-pixel measurements.
        ctx.setTransform(
            pixelRatio,
            0,
            0,
            pixelRatio,
            0,
            0
        );
    }


    window.addEventListener(
        "resize",
        resizeCanvas
    );


    resizeCanvas();


    return ctx;
}