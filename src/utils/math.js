/* =========================================
   MATH UTILITIES
========================================= */

export function clamp(value, min, max) {

    return Math.max(
        min,
        Math.min(max, value)
    );
}


export function lerp(start, end, amount) {

    return start +
        (end - start) * amount;
}


export function map(
    value,
    inputMin,
    inputMax,
    outputMin,
    outputMax
) {

    const normalized =
        (value - inputMin) /
        (inputMax - inputMin);


    return outputMin +
        normalized *
        (outputMax - outputMin);
}