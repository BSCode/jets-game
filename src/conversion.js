const PIXEL_SCALE = 500;

export function canvasToPhys(canvasPos, width, height){
    return planck.Vec2(
        (canvasPos.x - width / 2) / PIXEL_SCALE,
        -(canvasPos.y - height / 2) / PIXEL_SCALE
    )
}

export function physToCanvas(physPos, width, height){
    return {
        x: (physPos.x * PIXEL_SCALE) + (width / 2),
        y: (height / 2) - (physPos.y * PIXEL_SCALE)
    }
}

export function radToPhys(canvasRad){
    return canvasRad / PIXEL_SCALE;
}