> # TL;DR (!!)
>
> YWNSTCA is **souce-available** (as opposed to open source), which means the source code is proprietary/fully under my copyright but viewable. Feel free to browse the code and see how it works!
>
> One catch: this repo (ironically) does **NOT** contain the YWNRTZA clock, because _You Will Never Read This Zine Again_ isn't source-available, so this repo can't actually build anything.
>
> This repository includes both the public website (what you see when scanning the QR code), and the zine's generation code itself, which generates the PDF files I use for print.

# 'You Will Never See This Clock Again'

_You Will Never See This Clock Again_ is a procedurally-generated zine about procedurally-generated clocks by [@gracefrancines](https://instagram.com/gracefrancines).

It's part of the [_You Will Never Read This Zine Again_](https://gfrancine.gitlab.io/ywnrtza-2026) project, an ongoing experimental publication where I explore how the principles of computational art—simple rules lead to complex outcomes—can scale unconventional graphic design in places where it's difficult otherwise, e.g., multi-page appliciations.

# Developing

This repo contains the sources for:

1. The public website (starts at `sketch.ts`), which is a Git repository published upstream as a static GitLab Pages website (https://gfrancine.gitlab.io/ywnrtza-clock),
2. The zine PDF generation (`sketch-zine.ts`), which is meant to be run locally in development.

Switch between both by un/commenting lines in the `main.ts` file:

```ts
import sketch from "./sketch";
// import sketch from "./sketch-zine";
new P5(sketch);
```

This repo doesn't contain the YWNRTZA clock and cnanot build anything by itself. It requires (or, leeches off) the main YWNRTZA zine repository at the location `../book`, installed as the `ywnrtza` package:

```json
"dependencies": {
  "ywnrtza": "file:../book"
}
```

## Commands

### Setup

NodeJS [>v20.19](https://vite.dev/guide/) is required.

```sh
npm i # install dependencies
npm run dev # start a local live development server
```

### Development

```sh
npm run fmt # format the codebase, always run pre-commit

npm run sync-assets # copies the assets folder from ywnrtza/public/assets

npm run build # build the production site
npm run dev # re-run every time the `ywnrtza` assets folder changes
npm run deploy # deploy the public site to GitLab Pages

npm run no-git # temporarily moves the .git folder to the hidden/ folder to disable git
npm run git # restore the .git folder
```

## Deployment

> Make sure the entry point in `main.ts` is set to `./sketch.ts` and not `./sketch-zine.ts`!

`npm run deploy` builds the site and pushes it to a separate upstream GitLab repository from this one, made just for the built static files.

To set up the deployment Git repository run these commands:

```sh
mkdir gl-pages # create the target dir
cd gl-pages
git init # create a new git repo
git remote add origin <git remote link here>
cp ../deploy-gitlab-ci.yml .gitlab-ci.yml # copy the GitLab CI workflow from the root
git add -A && git commit -m "Initial commit"
git push --set-upstream origin master # initial upstream push
npm run deploy # build and deploy the site
```

Subsequent deployments can simply use `npm run deploy`.

## Source-Available?

My rationale for releasing YWNSTCA as only source-available was that most of the source code are very closely coupled to the creative/design parts of the project. There isn't really a straightforward way for me to share them permissively for modification in a way that I'm comfortable with.

I still think it would be nice if this zine wasn't a complete black box and anybody curious about it could see how it worked if they wanted to, and maybe it would encourage them to make something similar of their own. I think more creatives should touch code.

I still try to open-source some tools I made in the process of working on this zine, I suggest looking at them instead!

- [**f-impose**](https://github.com/gfrancine/) is a set of PDF imposition tools for indie printmaking, which I used to impose the generated PDF zine.

# Copyright

(c) Grace Francine (https://gitlab.com/gfrancine)
