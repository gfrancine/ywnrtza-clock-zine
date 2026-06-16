import "./style.css";
import "./wakelock";

// import P5 from "p5";
const { default: P5 } = await import("p5");

// setup p5.capture, which needs p5 in the global namespace
// (window as any).p5 = P5;
// await import("p5.capture"); // dynamic import to avoid hoisting

// import sketch from "./sketch";
import sketch from "./sketch-zine";
new P5(sketch);
