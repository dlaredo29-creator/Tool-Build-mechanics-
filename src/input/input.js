/* =========================================
   INPUT
   Mouse position becomes a normalized value
   from 0 to 1.
========================================= */

export function createInput(canvas) {

    const input = {
        x: 0.5,
        y: 0.5
    };


    function updateMouse(event) {

        const rect =
            canvas.getBoundingClientRect();


        const mouseX =
            event.clientX - rect.left;

        const mouseY =
            event.clientY - rect.top;


        input.x =
            mouseX / rect.width;

        input.y =
            mouseY / rect.height;


        // Keep values between 0 and 1.
        input.x =
            Math.max(
                0,
                Math.min(1, input.x)
            );

        input.y =
            Math.max(
                0,
                Math.min(1, input.y)
            );
    }


    window.addEventListener(
        "pointermove",
        updateMouse
    );


    return input;
}