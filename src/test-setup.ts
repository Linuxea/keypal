import "@testing-library/jest-dom/vitest";

// jsdom doesn't support canvas.getContext("2d")
HTMLCanvasElement.prototype.getContext = function () {
  return {
    fillStyle: "",
    fillRect: () => {},
    clearRect: () => {},
    drawImage: () => {},
    beginPath: () => {},
    arc: () => {},
    fill: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    fillText: () => {},
    save: () => {},
    restore: () => {},
    translate: () => {},
    scale: () => {},
    font: "",
    textAlign: "",
    textBaseline: "",
    imageSmoothingEnabled: false,
  } as unknown as CanvasRenderingContext2D;
} as unknown as typeof HTMLCanvasElement.prototype.getContext;
