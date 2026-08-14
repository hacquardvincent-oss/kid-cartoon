#!/usr/bin/env node
/* ============================================================
   construire-page-unique.js

   Fabrique une version du site en UN SEUL FICHIER HTML, avec le
   CSS, le JavaScript et la police embarqués. Pratique pour :
     - envoyer le site par mail / message,
     - le déposer sur n'importe quel hébergeur,
     - le garder sur le téléphone hors connexion.

   Usage :  node outils/construire-page-unique.js
   Sortie :  dist/kid-cartoon.html
   ============================================================ */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const b64 = (p) => fs.readFileSync(path.join(ROOT, p)).toString('base64');

/* --- CSS : polices et images deviennent des data: URI --- */
let css = read('assets/css/style.css');
css = css.replace(/url\('\.\.\/fonts\/([^']+)'\)/g, (_, file) =>
  "url('data:font/woff2;base64," + b64('assets/fonts/' + file) + "')");
css = css.replace(/url\('\.\.\/img\/([^']+)'\)/g, (_, file) =>
  "url('data:image/png;base64," + b64('assets/img/' + file) + "')");

/* --- HTML : on ne garde que le contenu du <body> --- */
const html = read('index.html');
const body = html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>'));
const content = body
  .replace(/<script src="[^"]*"><\/script>\s*/g, '')
  .trim();

/* --- JavaScript --- */
/* même ordre que dans index.html : app.js a besoin de Jeux au démarrage */
const js = ['assets/js/art.js', 'assets/js/scene.js', 'assets/js/stories.js',
  'assets/js/games.js', 'assets/js/app.js']
  .map(read).join('\n');

/* --- assemblage ---
   Volontairement sans <html>/<head>/<body> : le fichier reste
   valide tel quel dans un navigateur, et il peut aussi être servi
   par un hébergeur qui fournit sa propre enveloppe. */
const out = `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Kid Cartoon — histoires du soir et jeux</title>
<style>
${css}
</style>

${content}

<script>
${js}
<\/script>
`;

const dir = path.join(ROOT, 'dist');
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, 'kid-cartoon.html');
fs.writeFileSync(file, out, 'utf8');

console.log('Écrit : ' + path.relative(ROOT, file) +
  '  (' + Math.round(out.length / 1024) + ' Ko)');
