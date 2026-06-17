# YWRNTZA Clock Zine

This repo leeches off the main YWNRTZA zine repo at the location `../book`, installed as the `ywnrtza` package:

```json
"dependencies": {
  "ywnrtza": "file:../book"
}
```

This repo contains both:

1. The public-facing p5 sketch (`sketch.ts`), which is published to a remote repository as a static GitLab Pages website (https://gfrancine.gitlab.io/ywnrtza-clock) with, and
2. The zine generation sketch (`sketch-zine.ts`), which is meant to be used locally.

Switch between both by un/commenting lines in the `main.ts` file:

```ts
import sketch from "./sketch";
// import sketch from "./sketch-zine";
new P5(sketch);
```
