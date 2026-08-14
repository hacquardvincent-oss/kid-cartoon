/* ============================================================
   games.js — les jeux (3 à 5 ans)

   Trois règles ont guidé ces jeux :
   on ne perd jamais, on ne lit jamais rien (tout est dit à voix
   haute et montré en image), et une manche tient en un seul geste.
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------------- petites aides ---------------- */
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    return n;
  }
  function melange(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function piocher(a, n) { return melange(a).slice(0, n); }
  function entier(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }

  /* ---------------- la voix ---------------- */
  var voixActive = true;
  function dire(texte) {
    if (!voixActive || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(texte);
    u.lang = 'fr-FR'; u.rate = .9; u.pitch = 1.1;
    window.speechSynthesis.speak(u);
  }
  function taire() { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }

  /* Un bouton d'abord visuel : une grande image, le mot en petit dessous.
     À quatre ans on ne lit pas encore, mais on reconnaît une flèche. */
  function bi(act, image, mot, fort) {
    return '<button class="bi' + (fort ? ' primary' : '') + '" data-act="' + act +
      '" aria-label="' + mot + '"><span class="bi-img">' + image +
      '</span><span class="bi-mot">' + mot + '</span></button>';
  }

  /* ============================================================
     LE CADRE : manches, étoiles, félicitations
     ============================================================ */
  function jouer(stage, def, onQuit) {
    var gagnees = 0, total = 0, valeur = null;
    stage.innerHTML = '';

    /* certains jeux se jouent à l'écran entier : rien à faire défiler, tout
       est atteignable du pouce */
    stage.classList.toggle('jeu-plein', !!def.plein);
    if (def.plein) {
      var fermer = el('button', 'jeu-fermer', '✕');
      fermer.setAttribute('aria-label', 'Fermer le jeu');
      fermer.onclick = function () { onQuit(); };
      stage.appendChild(fermer);
    }

    var barre = el('div', 'jeu-etoiles');
    var consigne = el('p', 'jeu-consigne');
    var zone = el('div', 'jeu-zone');
    stage.appendChild(barre);
    stage.appendChild(consigne);
    stage.appendChild(zone);

    function majEtoiles() {
      barre.innerHTML = '';
      for (var i = 0; i < total; i++) {
        barre.appendChild(el('i', 'etoile' + (i < gagnees ? ' on' : '')));
      }
    }

    function feter(suite) {
      var mots = ['Bravo !', 'Super !', 'Bien joué !', 'Youpi !', 'Parfait !'];
      var m = mots[entier(0, mots.length - 1)];
      var f = el('div', 'jeu-bravo', '<div class="bravo-etoile">⭐</div><b>' + m + '</b>');
      zone.appendChild(f);
      dire(m);
      setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); suite(); }, 1100);
    }

    function manche() {
      if (gagnees >= total) return fin();
      majEtoiles();
      zone.innerHTML = '';
      def.manche(zone, gagnees, {
        consigne: function (texte) { consigne.textContent = texte; dire(texte); },
        reussi: function () { gagnees++; majEtoiles(); feter(manche); }
      }, valeur);
    }

    /* certains jeux commencent par un choix : quel prénom, quelle lettre */
    function demarrer(v) {
      valeur = v;
      total = typeof def.manches === 'function' ? def.manches(v) : def.manches;
      gagnees = 0;
      manche();
    }
    function choisir() {
      barre.innerHTML = '';
      consigne.textContent = def.choixConsigne || '';
      zone.innerHTML = '';
      def.choisir(zone, demarrer);
    }

    function fin() {
      majEtoiles();
      consigne.textContent = '';
      zone.innerHTML = '';
      var f = el('div', 'jeu-fin',
        '<div class="fin-etoiles">⭐⭐⭐</div>' +
        '<h3>Bravo !</h3>' +
        '<p>' + def.felicitation + '</p>' +
        '<div class="jeu-actions">' +
        bi('rejouer', '↻', 'Rejouer', true) +
        (def.choisir ? bi('choisir', '✎', def.choixBouton || 'Changer', false) : '') +
        bi('autres', '⌂', 'Les jeux', false) + '</div>');
      zone.appendChild(f);
      dire('Bravo ! Tu as gagné toutes les étoiles.');
      f.addEventListener('click', function (e) {
        var a = e.target.getAttribute && e.target.getAttribute('data-act');
        if (a === 'rejouer') demarrer(valeur);
        else if (a === 'choisir') choisir();
        else if (a === 'autres') onQuit();
      });
    }

    if (def.choisir) choisir(); else demarrer(null);
  }

  /* ============================================================
     JEU 1 — RELIER : chaque héros retrouve son objet
     ============================================================ */
  /* ------------------------------------------------------------
     LE CASTING PAR DÉFAUT

     Ces personnages ne sont là que pour que les jeux tournent avant
     le créateur de personnages. Le jour où la famille existe, cette
     liste est remplacée par la sienne — et rien d'autre ne bouge :
     les jeux ne connaissent que `CASTING`, jamais un personnage précis.
     ------------------------------------------------------------ */
  var CASTING = [
    { nom: 'Léa', objet: 'le cerf-volant',
      qui: { t: 'enfant', teint: '#f2c49a', cheveux: '#4a2f22', coiffure: 'boucles', vetement: '#3ec9c9', bord: '#fff1a8' },
      qoi: { t: 'cerfvolant', ds: 1.15, dy: 70 } },
    { nom: 'Tom', objet: 'le ballon',
      qui: { t: 'enfant', teint: '#f7dcc4', cheveux: '#3c2a20', coiffure: 'carre', vetement: '#e8746b', haut: 'teeshirt', bas: 'short', couleurBas: '#4a6ea8' },
      qoi: { t: 'ballon', ds: 1.1, dy: 122 } },
    { nom: 'Jade', objet: 'la fleur',
      qui: { t: 'enfant', teint: '#c9885c', cheveux: '#2f2118', coiffure: 'deuxtresses', vetement: '#a98cf0' },
      qoi: { t: 'fleur', ds: 2.2, dy: 120 } },
    { nom: 'le doudou', objet: 'le cube',
      qui: { t: 'rond', couleur: '#f0a24a', forme: 'poire', oreilles: 'rondes', museau: true },
      qoi: { t: 'cube', ds: 1.5, dy: 136 } },
    { nom: 'le chien', objet: 'le caillou',
      qui: { t: 'animal', poil: '#c9a06a', clair: '#f7e7cf', oreilles: 'tombantes' },
      qoi: { t: 'caillou', ds: 1.5, dy: 130 } },
    { nom: 'le chat', objet: 'la pelote',
      qui: { t: 'animal', poil: '#8a8f9a', clair: '#e4e7ec', oreilles: 'pointues', queue: 'aucune' },
      qoi: { t: 'bouleneige', ds: 1, dy: 100, r: 52 } },
    { nom: 'le lapin', objet: 'la mangue',
      qui: { t: 'animal', poil: '#f2e2d0', clair: '#fffaf2', oreilles: 'longues', queue: 'pompon' },
      qoi: { t: 'mangue', ds: 1.6, dy: 128 } },
    { nom: 'le bébé', objet: 'la peluche',
      qui: { t: 'bebe', teint: '#f6cba6', cheveux: '#f7dc8a', vetement: '#8ec9f0' },
      qoi: { t: 'peluche', ds: 2, dy: 150 } },
    { nom: 'Maman', objet: 'la voiture',
      qui: { t: 'adulte', teint: '#f2c49a', cheveux: '#6b4a33', coiffure: 'queue', vetement: '#4f8a7a', haut: 'pull', bas: 'pantalon', couleurBas: '#3f4a5c' },
      qoi: { t: 'voiture', ds: .68, dy: 122 } },
    { nom: 'Mamie', objet: 'le gâteau de sable',
      qui: { t: 'adulte', teint: '#f0d7bd', cheveux: '#e4e2dc', coiffure: 'carre', vetement: '#a98cf0', lunettes: true },
      qoi: { t: 'chateausable', ds: .8, dy: 150 } }
  ];

  /* fusionner un réglage de personnage et sa position dans la scène */
  function merge(base, extra) {
    var o = {}, k;
    for (k in base) if (base.hasOwnProperty(k)) o[k] = base[k];
    for (k in extra) if (extra.hasOwnProperty(k)) o[k] = extra[k];
    return o;
  }

  /* une vignette de personnage : la même échelle pour tout le monde */
  function vignettePerso(c, ds) {
    var o = {}, k;
    for (k in c.qui) if (c.qui.hasOwnProperty(k)) o[k] = c.qui[k];
    o.ds = ds || .64; o.dy = 186;
    return o;
  }

  var PAIRES = CASTING.map(function (c) {
    return { nom: c.nom, objet: c.objet, a: vignettePerso(c), b: c.qoi };
  });

  function jeuRelier(zone, n, api) {
    var lot = piocher(PAIRES, 3);
    api.consigne('Touche un personnage, puis son objet.');

    var plateau = el('div', 'relier');
    var colA = el('div', 'relier-col');
    var colB = el('div', 'relier-col');
    var traits = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    traits.setAttribute('class', 'relier-traits');
    plateau.appendChild(traits);
    plateau.appendChild(colA);
    plateau.appendChild(colB);
    zone.appendChild(plateau);

    function carte(item, cle, col) {
      var c = el('button', 'carte');
      c.innerHTML = Art.vignette(item);
      c.dataset.cle = cle;
      col.appendChild(c);
      return c;
    }

    melange(lot).forEach(function (p) { carte(p.a, p.nom, colA); });
    melange(lot).forEach(function (p) { carte(p.b, p.nom, colB); });

    var choisie = null, trouvees = 0;

    function relier(c1, c2) {
      var r0 = plateau.getBoundingClientRect();
      var r1 = c1.getBoundingClientRect(), r2 = c2.getBoundingClientRect();
      var l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      l.setAttribute('x1', r1.right - r0.left - 6);
      l.setAttribute('y1', r1.top + r1.height / 2 - r0.top);
      l.setAttribute('x2', r2.left - r0.left + 6);
      l.setAttribute('y2', r2.top + r2.height / 2 - r0.top);
      traits.appendChild(l);
    }

    plateau.addEventListener('click', function (e) {
      var c = e.target.closest ? e.target.closest('.carte') : null;
      if (!c || c.classList.contains('ok')) return;
      var estGauche = c.parentNode === colA;

      if (estGauche) {
        if (choisie) choisie.classList.remove('choisie');
        choisie = c; c.classList.add('choisie');
        return;
      }
      if (!choisie) { c.classList.add('secoue'); setTimeout(function () { c.classList.remove('secoue'); }, 400); return; }

      if (choisie.dataset.cle === c.dataset.cle) {
        relier(choisie, c);
        choisie.classList.add('ok'); c.classList.add('ok');
        choisie.classList.remove('choisie');
        choisie = null;
        trouvees++;
        if (trouvees === lot.length) setTimeout(function () { api.reussi(); }, 450);
      } else {
        c.classList.add('secoue');
        var g = choisie;
        setTimeout(function () {
          c.classList.remove('secoue');
          g.classList.remove('choisie');
        }, 420);
        choisie = null;
      }
    });
  }

  /* ============================================================
     JEU 2 — COMPTER : combien y en a-t-il ?
     ============================================================ */
  var A_COMPTER = [
    { t: 'coquillage', pluriel: 'coquillages', decor: 'plage', s: 2.2, y: 500 },
    { t: 'etoilemer', pluriel: 'étoiles de mer', decor: 'plage', s: 1.9, y: 505 },
    { t: 'crabe', pluriel: 'crabes', decor: 'plage', s: 1.7, y: 515 },
    { t: 'fleur', pluriel: 'fleurs', decor: 'jardin', s: 2.4, y: 525 },
    { t: 'ballon', pluriel: 'ballons', decor: 'jardin', s: 1.2, y: 505 },
    { t: 'papillon', pluriel: 'papillons', decor: 'jardin', s: 2.2, y: 330 },
    { t: 'bouleneige', pluriel: 'boules de neige', decor: 'neige', s: 1.6, y: 500, r: 26 },
    { t: 'cube', pluriel: 'cubes', decor: 'chambre', s: 1.3, y: 520 }
  ];

  function jeuCompter(zone, n, api) {
    var o = piocher(A_COMPTER, 1)[0];
    var combien = Math.min(6, 2 + n);          // on monte doucement : 2, 3, 4, 5, 6
    api.consigne('Combien y a-t-il de ' + o.pluriel + ' ?');

    /* quelqu'un montre du doigt, les objets s'étalent bien à plat pour être comptés */
    var meneur = CASTING[0].qui, items = [{ x: 90, y: 522, s: .9, pose: 'montre' }], k;
    for (k in meneur) if (meneur.hasOwnProperty(k)) items[0][k] = meneur[k];

    var gauche = 250, largeur = 480;
    for (var i = 0; i < combien; i++) {
      items.push({
        t: o.t,
        x: combien === 1 ? gauche + largeur / 2 : gauche + largeur * i / (combien - 1),
        y: o.y + (i % 2 ? 28 : 0),
        s: o.s, r: o.r
      });
    }

    var tableau = el('div', 'jeu-tableau');
    tableau.innerHTML = Art.scene({ decor: o.decor, items: items }, {});
    zone.appendChild(tableau);

    var choix = melange([combien, Math.max(1, combien - 1), combien + 1]);
    var rangee = el('div', 'chiffres');
    choix.forEach(function (c) {
      var b = el('button', 'chiffre', String(c));
      b.onclick = function () {
        if (c === combien) {
          b.classList.add('ok');
          setTimeout(function () { api.reussi(); }, 350);
        } else {
          b.classList.add('secoue');
          setTimeout(function () { b.classList.remove('secoue'); }, 420);
          dire('Essaie encore. Compte avec ton doigt !');
        }
      };
      rangee.appendChild(b);
    });
    zone.appendChild(rangee);
  }

  /* ============================================================
     JEU 3 — ÉCRIRE : tracer les lettres d'un prénom
     Chaque lettre est une suite de tracés SVG. On laisse le navigateur
     échantillonner le chemin : les courbes sont de vraies courbes, et un
     enfant qui apprend le O n'apprend pas un polygone.
     ============================================================ */
  var LETTRES = {
    A: ['M 22,86 L 50,14', 'M 50,14 L 78,86', 'M 32,60 L 68,60'],
    B: ['M 30,14 L 30,86', 'M 30,14 L 54,14 C 74,14 74,48 54,48 L 30,48',
      'M 30,48 L 58,48 C 80,48 80,86 58,86 L 30,86'],
    C: ['M 74,28 C 64,16 48,12 38,20 C 24,30 20,40 20,50 C 20,60 24,70 38,80 C 48,88 64,84 74,72'],
    D: ['M 30,14 L 30,86', 'M 30,14 L 48,14 C 78,14 78,86 48,86 L 30,86'],
    E: ['M 72,14 L 30,14', 'M 30,14 L 30,86', 'M 30,50 L 64,50', 'M 30,86 L 72,86'],
    'É': ['M 72,26 L 32,26', 'M 32,26 L 32,86', 'M 32,56 L 64,56', 'M 32,86 L 72,86', 'M 40,16 L 62,4'],
    'È': ['M 72,26 L 32,26', 'M 32,26 L 32,86', 'M 32,56 L 64,56', 'M 32,86 L 72,86', 'M 62,16 L 40,4'],
    F: ['M 72,14 L 30,14', 'M 30,14 L 30,86', 'M 30,50 L 62,50'],
    G: ['M 74,28 C 64,16 48,12 38,20 C 24,30 20,40 20,50 C 20,60 24,70 38,80 C 54,90 74,82 74,64',
      'M 74,64 L 54,64'],
    H: ['M 28,14 L 28,86', 'M 72,14 L 72,86', 'M 28,50 L 72,50'],
    I: ['M 50,14 L 50,86'],
    J: ['M 64,14 L 64,66 C 64,84 40,90 30,76'],
    K: ['M 30,14 L 30,86', 'M 72,14 L 34,52', 'M 42,44 L 74,86'],
    L: ['M 32,14 L 32,86', 'M 32,86 L 70,86'],
    M: ['M 24,86 L 24,14', 'M 24,14 L 50,58', 'M 50,58 L 76,14', 'M 76,14 L 76,86'],
    N: ['M 28,86 L 28,14', 'M 28,14 L 72,86', 'M 72,86 L 72,14'],
    O: ['M 50,14 C 30,14 20,32 20,50 C 20,68 30,86 50,86 C 70,86 80,68 80,50 C 80,32 70,14 50,14'],
    P: ['M 30,86 L 30,14', 'M 30,14 L 56,14 C 78,14 78,52 56,52 L 30,52'],
    Q: ['M 50,14 C 30,14 20,32 20,50 C 20,68 30,86 50,86 C 70,86 80,68 80,50 C 80,32 70,14 50,14',
      'M 58,66 L 80,90'],
    R: ['M 30,86 L 30,14', 'M 30,14 L 56,14 C 76,14 76,50 56,50 L 30,50', 'M 46,50 L 74,86'],
    S: ['M 74,26 C 66,14 40,10 32,24 C 25,37 40,46 52,50 C 66,55 80,62 74,76 C 66,91 34,88 26,74'],
    T: ['M 22,14 L 78,14', 'M 50,14 L 50,86'],
    U: ['M 26,14 L 26,62 C 26,82 74,82 74,62 L 74,14'],
    V: ['M 24,14 L 50,86', 'M 50,86 L 76,14'],
    W: ['M 18,14 L 32,86', 'M 32,86 L 50,38', 'M 50,38 L 68,86', 'M 68,86 L 82,14'],
    X: ['M 26,14 L 74,86', 'M 74,14 L 26,86'],
    Y: ['M 26,14 L 50,50', 'M 74,14 L 50,50', 'M 50,50 L 50,86'],
    Z: ['M 26,14 L 74,14', 'M 74,14 L 26,86', 'M 26,86 L 74,86']
  };

  /* Les prénoms à tracer. Ceux-ci sont des prénoms d'attente : le jour où la
     famille est créée, c'est elle qui remplit cette liste — un enfant apprend
     d'abord à écrire SON prénom, pas un prénom d'exemple. */
  var PRENOMS = ['MAMAN', 'PAPA', 'LÉA', 'TOM', 'JADE', 'HUGO', 'ZOÉ', 'NOÉ',
    'ALICE', 'GASPARD', 'MAMIE', 'PAPI'];

  var NS = 'http://www.w3.org/2000/svg';
  var lotPrenoms = null;

  /* la grille de choix : un bouton par prénom, plus le tirage au sort */
  function grilleChoix(zone, items, pret, hasard) {
    var g = el('div', 'choix-grille');
    items.forEach(function (t) {
      var b = el('button', 'choix-b', t);
      b.onclick = function () { pret(t); };
      g.appendChild(b);
    });
    zone.appendChild(g);
    var h = el('button', 'choix-hasard', hasard || '🎲 Au hasard');
    h.onclick = function () { pret(null); };
    zone.appendChild(h);
  }
  function choixPrenom(zone, pret) { grilleChoix(zone, PRENOMS, pret, '🎲 Cinq au hasard'); }

  function jeuEcrire(zone, n, api, choisi) {
    if (choisi) return ecrireMot(zone, choisi, api);
    if (n === 0 || !lotPrenoms) {
      lotPrenoms = piocher(PRENOMS, PRENOMS.length);
    }
    return ecrireMot(zone, lotPrenoms[n % lotPrenoms.length], api);
  }

  function ecrireMot(zone, nom, api, consigne) {
    var lettres = nom.split('').filter(function (c) { return LETTRES[c]; });
    api.consigne(consigne || ('Écris ' + nom + '.'));

    /* le prénom en toutes lettres, pour savoir où on en est */
    var bandeau = el('div', 'prenom');
    lettres.forEach(function (c) { bandeau.appendChild(el('span', null, c)); });
    zone.appendChild(bandeau);

    var cadre = el('div', 'trace');
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    cadre.appendChild(svg);
    zone.appendChild(cadre);

    var iLettre = 0, iTrace = 0, jalons = [], trace = [];
    var chemins = [], depart, encre;

    function chemin(d, cls, w) {
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('d', d); p.setAttribute('class', cls);
      p.setAttribute('stroke-width', w); p.setAttribute('fill', 'none');
      svg.appendChild(p);
      return p;
    }

    /* les points de passage : c'est le navigateur qui mesure la courbe */
    function jalonsDe(p) {
      var L = p.getTotalLength(), res = [], pas = 6;
      var n2 = Math.max(2, Math.round(L / pas));
      for (var i = 0; i <= n2; i++) {
        var pt = p.getPointAtLength(L * i / n2);
        res.push({ x: pt.x, y: pt.y, vu: false });
      }
      return res;
    }

    function dessinerLettre() {
      svg.innerHTML = '';
      chemins = LETTRES[lettres[iLettre]].map(function (d) {
        return { d: d, guide: chemin(d, 'guide', 13) };
      });
      chemins.forEach(function (c) { chemin(c.d, 'pointille', 1.6); });
      depart = document.createElementNS(NS, 'circle');
      depart.setAttribute('class', 'depart'); depart.setAttribute('r', 5);
      svg.appendChild(depart);
      encre = document.createElementNS(NS, 'polyline');
      encre.setAttribute('class', 'encre');
      svg.appendChild(encre);
      iTrace = 0;
      majTrace();
      var sp = bandeau.children;
      for (var i = 0; i < sp.length; i++) {
        sp[i].className = i < iLettre ? 'fait' : (i === iLettre ? 'ici' : '');
      }
    }

    function majTrace() {
      if (iTrace >= chemins.length) { depart.style.display = 'none'; return; }
      jalons = jalonsDe(chemins[iTrace].guide);
      depart.style.display = '';
      depart.setAttribute('cx', jalons[0].x);
      depart.setAttribute('cy', jalons[0].y);
    }

    function coord(e) {
      var r = svg.getBoundingClientRect();
      return { x: (e.clientX - r.left) / r.width * 100, y: (e.clientY - r.top) / r.height * 100 };
    }

    var dessine = false;
    function debut(e) {
      if (iTrace >= chemins.length) return;
      dessine = true; trace = []; encre.setAttribute('points', '');
      svg.setPointerCapture && svg.setPointerCapture(e.pointerId);
      bouge(e);
    }
    function bouge(e) {
      if (!dessine) return;
      e.preventDefault();
      var p = coord(e);
      trace.push(p.x.toFixed(1) + ',' + p.y.toFixed(1));
      encre.setAttribute('points', trace.join(' '));
      var vus = 0;
      jalons.forEach(function (j) {
        if (!j.vu) {
          var dx = j.x - p.x, dy = j.y - p.y;
          if (dx * dx + dy * dy < 121) j.vu = true;   // rayon 11
        }
        if (j.vu) vus++;
      });
      if (vus / jalons.length >= .8) traceFini();
    }
    function fin() { dessine = false; }

    function traceFini() {
      dessine = false;
      chemins[iTrace].guide.classList.add('fait');
      chemin(chemins[iTrace].d, 'ecrit', 11);
      svg.appendChild(depart); svg.appendChild(encre);
      encre.setAttribute('points', '');
      iTrace++;
      if (iTrace < chemins.length) { majTrace(); dire('Encore un trait !'); return; }
      majTrace();
      iLettre++;
      if (iLettre >= lettres.length) { setTimeout(function () { api.reussi(); }, 450); return; }
      var sp = bandeau.children;
      sp[iLettre - 1].className = 'fait';
      setTimeout(function () {
        dessinerLettre();
        dire('Maintenant le ' + lettres[iLettre] + '.');
      }, 500);
    }

    svg.addEventListener('pointerdown', debut);
    svg.addEventListener('pointermove', bouge);
    svg.addEventListener('pointerup', fin);
    svg.addEventListener('pointercancel', fin);

    dessinerLettre();
  }

  /* ============================================================
     JEU 5 — L'ALPHABET
     Deux exercices en alternance : reconnaître la lettre parmi trois,
     puis la tracer. On apprend à la voir avant de savoir l'écrire.
     ============================================================ */
  var ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  var lotLettres = null;

  function choixLettre(zone, pret) {
    grilleChoix(zone, ALPHABET, pret, '🎲 Six au hasard');
  }

  function jeuAlphabet(zone, n, api, choisie) {
    var lettre;
    if (choisie) lettre = choisie;
    else {
      if (n === 0 || !lotLettres) lotLettres = piocher(ALPHABET, ALPHABET.length);
      lettre = lotLettres[Math.floor(n / 2) % lotLettres.length];
    }
    /* une fois sur deux on reconnaît, une fois sur deux on trace */
    if (n % 2 === 0) reconnaitreLettre(zone, lettre, api);
    else tracerLettre(zone, lettre, api);
  }

  function reconnaitreLettre(zone, lettre, api) {
    api.consigne('Touche la lettre ' + lettre + '.');
    var autres = piocher(ALPHABET.filter(function (c) { return c !== lettre; }), 2);
    var lot = melange([lettre].concat(autres));
    var g = el('div', 'lettres-choix');
    lot.forEach(function (c) {
      var b = el('button', 'lettre-b');
      b.innerHTML = '<svg viewBox="0 0 100 100">' + LETTRES[c].map(function (d) {
        return '<path d="' + d + '" fill="none" stroke="currentColor" stroke-width="11" ' +
          'stroke-linecap="round" stroke-linejoin="round"/>';
      }).join('') + '</svg>';
      b.onclick = function () {
        if (c === lettre) { b.classList.add('juste'); setTimeout(function () { api.reussi(); }, 350); }
        else {
          b.classList.add('faux');
          setTimeout(function () { b.classList.remove('faux'); }, 400);
          dire('Non, ça c\'est le ' + c + '. Cherche le ' + lettre + '.');
        }
      };
      g.appendChild(b);
    });
    zone.appendChild(g);
  }

  function tracerLettre(zone, lettre, api) {
    ecrireMot(zone, lettre, api, 'Trace la lettre ' + lettre + '.');
  }

  /* ============================================================
     LE CATALOGUE
     ============================================================ */
  /* ============================================================
     JEU 4 — LES 6 DIFFÉRENCES
     On repart des planches déjà dessinées : à gauche la case d'origine,
     à droite la même case retouchée en six endroits. Les retouches sont
     fabriquées à partir de la scène elle-même — rien n'est dessiné à la
     main, et une nouvelle histoire donne aussitôt une nouvelle planche.
     ============================================================ */
  var A_TROUVER = 6;

  /* un personnage, c'est n'importe quelle silhouette : le jeu n'a plus de
     liste de héros à tenir à jour */
  var PERSOS = Object.keys(Art.silhouettes);

  /* de quoi ajouter un élément qui n'a rien à faire là, selon le décor */
  var AJOUTS = {
    plage: ['coquillage', 'etoilemer', 'crabe'], mer: ['coquillage', 'etoilemer'],
    jardin: ['fleur', 'ballon', 'buisson'], colline: ['fleur', 'buisson', 'caillou'],
    ruisseau: ['fleur', 'caillou', 'buisson'], campement: ['fleur', 'buche', 'buisson'],
    foret: ['fleur', 'buisson', 'caillou'], neige: ['bouleneige', 'sapin', 'bouleneige'],
    village: ['fleur', 'buisson', 'ballon'], route: ['fleur', 'buisson', 'caillou'],
    chambre: ['cube', 'ballon', 'valise'], uni: ['fleur', 'ballon', 'buisson']
  };

  /* ------------------------------------------------------------
     Les planches du jeu des différences sont celles des histoires : une
     histoire écrite donne aussitôt une énigme. Tant qu'il n'y en a
     aucune, on se rabat sur ces trois scènes de démonstration — le jeu
     doit tourner le premier jour, avant la première histoire.
     ------------------------------------------------------------ */
  var SCENES_DEMO = [
    {
      decor: 'plage', heure: 'jour',
      fond: [{ t: 'palmier', x: 110, y: 400, s: 1.1 }, { t: 'parasol', x: 690, y: 420, s: .8, color: '#ff5c8a' }],
      items: [
        merge(CASTING[0].qui, { x: 250, y: 520, s: .95, pose: 'salue' }),
        merge(CASTING[4].qui, { x: 470, y: 524, s: .85, pose: 'assis' }),
        merge(CASTING[3].qui, { x: 640, y: 522, s: .8, pose: 'brasenlair' })
      ],
      avant: [
        { t: 'coquillage', x: 120, y: 542, s: 1.6 }, { t: 'etoilemer', x: 340, y: 552, s: 1.4 },
        { t: 'seau', x: 560, y: 546, s: .9, color: '#3ec9c9' }, { t: 'crabe', x: 740, y: 540, s: 1.2 }
      ]
    },
    {
      decor: 'jardin', heure: 'jour',
      fond: [{ t: 'arbre', x: 120, y: 400, s: 1.15 }, { t: 'buisson', x: 700, y: 420, s: 1.1 }],
      items: [
        merge(CASTING[1].qui, { x: 240, y: 522, s: .95, pose: 'court' }),
        merge(CASTING[2].qui, { x: 450, y: 520, s: .95, pose: 'montre' }),
        merge(CASTING[6].qui, { x: 640, y: 526, s: .8, pose: 'saute' })
      ],
      avant: [
        { t: 'fleur', x: 90, y: 548, s: 1.7 }, { t: 'fleur', x: 330, y: 552, s: 1.5, color: '#fff1a8' },
        { t: 'ballon', x: 560, y: 544, s: 1.1 }, { t: 'papillon', x: 700, y: 300, s: 1.5 }
      ]
    },
    {
      decor: 'chambre', heure: 'nuit',
      fond: [{ t: 'etagere', x: 180, y: 400, s: .9 }],
      items: [
        merge(CASTING[8].qui, { x: 260, y: 528, s: 1, pose: 'tient' }),
        merge(CASTING[7].qui, { x: 450, y: 530, s: .9, pose: 'assis' }),
        merge(CASTING[3].qui, { x: 620, y: 528, s: .8, pose: 'debout' })
      ],
      avant: [
        { t: 'cube', x: 120, y: 548, s: 1.3 }, { t: 'tourcubes', x: 340, y: 550, s: .9, n: 3 },
        { t: 'peluche', x: 700, y: 544, s: 1.6 }
      ]
    }
  ];
  /* deux rangs : au premier plan, et un peu en retrait dans le décor */
  var PLACES = [[70, 550], [190, 548], [320, 552], [470, 550], [610, 548], [730, 546],
    [110, 468], [250, 464], [400, 460], [550, 464], [690, 466]];

  /* un tirage reproductible : une planche donnée pose toujours la même énigme */
  function graineur(g) {
    return function () { g = (g * 1103515245 + 12345) % 2147483648; return g / 2147483648; };
  }
  function melangeAvec(a, r) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(r() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* Le catalogue des planches jouables. On ne le fige pas : il est reconstruit
     à chaque partie, pour qu'une histoire ajoutée le matin soit jouable le soir.
     On ne retient qu'une planche sur deux — deux planches voisines se
     ressemblent trop pour faire deux énigmes différentes. */
  function planchesJouables() {
    var out = [];
    UNIVERSES.forEach(function (u) {
      u.stories.forEach(function (s) {
        s.pages.forEach(function (pg, i) {
          if (i % 2 === 0 && pg.scene && (pg.scene.items || []).length) {
            out.push({ scene: pg.scene, graine: out.length });
          }
        });
      });
    });
    if (!out.length) {
      out = SCENES_DEMO.map(function (sc, i) { return { scene: sc, graine: i }; });
    }
    return out;
  }

  var HUMEURS = ['content', 'surpris', 'triste'];

  /* ------------------------------------------------------------
     Fabriquer les six différences.

     L'ordre compte : on choisit d'abord la FENÊTRE — la portion de case
     qu'on va montrer — puis on ne retouche que ce qui s'y trouve. C'est
     l'inverse de l'intuition, mais c'est ce qui garantit un dessin assez
     grand sur un téléphone : une fenêtre de 400 unités sur 800, c'est un
     dessin deux fois plus gros. Si on n'y trouve pas six différences, on
     élargit d'un cran.
     ------------------------------------------------------------ */
  function fabriquerDifferences(scene, graine, format) {
    var W = 800, H = 560;
    format = format || W / H;
    var r = graineur(graine);
    var copie = JSON.parse(JSON.stringify(scene));
    delete copie.bulles;

    var elements = [];
    ['fond', 'items', 'avant'].forEach(function (c) {
      (copie[c] || []).forEach(function (it) {
        var perso = PERSOS.indexOf(it.t) >= 0;
        elements.push({
          it: it, perso: perso,
          x: it.x, y: it.y - (perso ? 110 * (it.s || 1) : 22)
        });
      });
    });

    var pivots = elements.filter(function (e) { return e.perso; });
    var pv = pivots.length ? pivots[Math.floor(r() * pivots.length)] : { x: W / 2, y: 380 };

    function fenetre(largeur) {
      /* la fenêtre prend le format de la case à l'écran : sur un téléphone
         en plein écran, elle est plus haute que large */
      var w = Math.min(largeur, W), h = w / format;
      if (h > H) { h = H; w = Math.min(W, h * format); }
      return {
        x: Math.min(Math.max(pv.x - w / 2, 0), W - w),
        y: Math.min(Math.max(pv.y - h * 0.42, 0), H - h),
        w: w, h: h
      };
    }
    function dedans(f, x, y, m) {
      m = m || 0;
      return x > f.x + m && x < f.x + f.w - m && y > f.y + m && y < f.y + f.h - m;
    }

    /* le plan : ce qu'on va changer, sans encore rien changer */
    function planifier(f) {
      var ecartMin = f.w * 0.16;
      var zones = [], plan = [];
      function loin(x, y, d) {
        return zones.every(function (z) {
          return (z.x - x) * (z.x - x) + (z.y - y) * (z.y - y) > d * d;
        });
      }

      var objets = [], persos = [];
      elements.forEach(function (e) {
        if (!dedans(f, e.x, e.y, 10)) return;
        (e.perso ? persos : objets).push(e);
      });

      var efface = 0;
      var candidats = melangeAvec(objets, r).map(function (e, k) {
        var quoi = (k % 3 === 0 && efface < 2) ? 'retirer' : 'taille';
        if (quoi === 'retirer') efface++;
        return { e: e, quoi: quoi };
      }).concat(melangeAvec(persos, r).map(function (e, k) {
        return { e: e, quoi: ['pose', 'flip', 'humeur'][k % 3] };
      }));
      candidats = melangeAvec(candidats, r);

      [ecartMin, ecartMin * 0.7, ecartMin * 0.45].forEach(function (d) {
        candidats.forEach(function (c) {
          if (plan.length >= A_TROUVER || c.pris) return;
          if (!loin(c.e.x, c.e.y, d)) return;
          c.pris = true; plan.push(c); zones.push({ x: c.e.x, y: c.e.y });
        });
      });

      /* on complète avec des objets qui n'étaient pas là, posés au sol
         dans la fenêtre */
      var pool = AJOUTS[scene.decor] || AJOUTS.uni;
      var solBas = Math.min(f.y + f.h - f.h * 0.06, 552);
      var places = [];
      [0.12, 0.34, 0.56, 0.78, 0.24, 0.68].forEach(function (t) {
        places.push({ x: Math.round(f.x + f.w * t), y: Math.round(solBas) });
        places.push({ x: Math.round(f.x + f.w * t), y: Math.round(solBas - f.h * 0.22) });
      });
      places = melangeAvec(places, r).filter(function (pl) {
        return (scene.items || []).every(function (it) {
          return Math.abs(it.x - pl.x) > f.w * 0.09;
        });
      });
      [ecartMin, ecartMin * 0.7, ecartMin * 0.45].forEach(function (d) {
        places.forEach(function (pl) {
          if (plan.length >= A_TROUVER || pl.pris) return;
          if (!loin(pl.x, pl.y - f.h * 0.05, d)) return;
          pl.pris = true;
          plan.push({ ajout: { t: pool[Math.floor(r() * pool.length)], x: pl.x, y: pl.y, s: f.w / 800 * 1.5 } });
          zones.push({ x: pl.x, y: pl.y - f.h * 0.05 });
        });
      });

      return { plan: plan, zones: zones };
    }

    /* on serre autant que possible, puis on desserre s'il le faut */
    var f, essai;
    var tailles = [520, 600, 690, 800];
    for (var i = 0; i < tailles.length; i++) {
      f = fenetre(tailles[i]);
      essai = planifier(f);
      if (essai.plan.length >= A_TROUVER) break;
    }

    essai.plan.forEach(function (c) {
      if (c.ajout) { (copie.avant = copie.avant || []).push(c.ajout); return; }
      var it = c.e.it;
      if (c.quoi === 'retirer') it.t = 'rien';
      else if (c.quoi === 'taille') it.s = (it.s === undefined ? 1 : it.s) * (r() < .5 ? .55 : 1.5);
      else if (c.quoi === 'flip') it.flip = !it.flip;
      else if (c.quoi === 'humeur') {
        var h = HUMEURS.filter(function (m) { return m !== (it.humeur || 'content'); });
        it.humeur = h[Math.floor(r() * h.length)];
      } else if (c.quoi === 'pose') {
        if (it.x > 110 && it.x < 690 && it.pose !== 'assis') it.pose = it.pose === 'brasenlair' ? 'montre' : 'brasenlair';
        else it.flip = !it.flip;
      }
    });

    return { scene: copie, zones: essai.zones, cadre: f };
  }

  var lotPlanches = null;

  function jeuDifferences(zone, n, api) {
    if (n === 0 || !lotPlanches) lotPlanches = melange(planchesJouables());
    var choix = lotPlanches[n % lotPlanches.length];
    api.consigne('Trouve les 6 différences.');

    /* On pose d'abord les deux cases vides, on mesure la place réellement
       disponible, et seulement ensuite on choisit le cadrage : c'est ce qui
       permet de tout tenir à l'écran sans faire défiler la page. */
    var plateau = el('div', 'diff');
    var vues = [el('div', 'diff-vue'), el('div', 'diff-vue')];
    vues.forEach(function (v) { plateau.appendChild(v); });
    zone.appendChild(plateau);

    var score = el('p', 'diff-score');
    zone.appendChild(score);

    var boite = vues[0].getBoundingClientRect();
    var format = (boite.width > 20 && boite.height > 20) ? boite.width / boite.height : 800 / 560;
    var fab = fabriquerDifferences(choix.scene, 1000 + choix.graine * 7919, format);
    var cadre = fab.cadre;
    vues[0].innerHTML = Art.scene(choix.scene, { sansBulles: true, cadre: cadre });
    vues[1].innerHTML = Art.scene(fab.scene, { sansBulles: true, cadre: cadre });

    var vus = fab.zones.map(function () { return false; });
    function majScore() {
      score.innerHTML = '<b>' + vus.filter(Boolean).length + '</b> / ' + A_TROUVER;
    }
    majScore();

    function marquer(z) {
      vues.forEach(function (v) {
        var sv = v.querySelector('svg');
        var c = document.createElementNS(NS, 'circle');
        c.setAttribute('cx', z.x); c.setAttribute('cy', z.y);
        c.setAttribute('r', Math.round(cadre.w / 800 * 62));
        c.setAttribute('stroke-width', Math.round(cadre.w / 800 * 9));
        c.setAttribute('class', 'diff-marque');
        sv.appendChild(c);
      });
    }

    function toucher(e) {
      var v = e.currentTarget, r = v.getBoundingClientRect();
      var x = cadre.x + (e.clientX - r.left) / r.width * cadre.w;
      var y = cadre.y + (e.clientY - r.top) / r.height * cadre.h;
      var best = -1, bd = 1e9;
      fab.zones.forEach(function (z, i) {
        if (vus[i]) return;
        var d = (z.x - x) * (z.x - x) + (z.y - y) * (z.y - y);
        if (d < bd) { bd = d; best = i; }
      });
      var portee = cadre.w / 800 * 118;      // on vise en pixels, pas en unités
      if (best < 0 || bd > portee * portee) {
        v.classList.add('rate');
        setTimeout(function () { v.classList.remove('rate'); }, 260);
        return;
      }
      vus[best] = true;
      marquer(fab.zones[best]);
      majScore();
      if (vus.every(Boolean)) setTimeout(function () { api.reussi(); }, 500);
      else dire(['Oui !', 'Bien vu !', 'Encore une !'][Math.floor(Math.random() * 3)]);
    }
    vues.forEach(function (v) { v.addEventListener('click', toucher); });
  }

  var JEUX = [
    {
      id: 'relier', nom: 'Relie les amis', emoji: '🔗',
      sous: 'Chaque héros retrouve son objet',
      vignette: vignettePerso(CASTING[0]),
      def: { manches: 4, manche: jeuRelier, felicitation: 'Tu as relié tous les amis !' }
    },
    {
      id: 'compter', nom: 'Compte jusqu\'à six', emoji: '🔢',
      sous: 'Combien y en a-t-il ?',
      vignette: vignettePerso(CASTING[2]),
      def: { manches: 5, manche: jeuCompter, felicitation: 'Tu sais compter jusqu\'à 6 !' }
    },
    {
      id: 'ecrire', nom: 'Écris les prénoms', emoji: '✏️',
      sous: 'Ceux de la maison, lettre après lettre',
      vignette: vignettePerso(CASTING[8]),
      def: {
        manches: function (v) { return v ? 1 : 5; },
        manche: jeuEcrire,
        choisir: choixPrenom,
        choixConsigne: 'Choisis un prénom à écrire.',
        choixBouton: 'Un autre prénom',
        felicitation: 'Bien écrit !'
      }
    },
    {
      id: 'differences', nom: 'Les 6 différences', emoji: '🔍',
      sous: 'Deux cases presque pareilles',
      vignette: vignettePerso(CASTING[4], .6),
      def: {
        manches: 6, manche: jeuDifferences, plein: true,
        felicitation: 'Tu as l\'œil ! Six fois six différences.'
      }
    },
    {
      id: 'alphabet', nom: 'L\'alphabet', emoji: '🔤',
      sous: 'Reconnaître puis tracer chaque lettre',
      vignette: vignettePerso(CASTING[1]),
      def: {
        manches: function (v) { return v ? 2 : 6; },
        manche: jeuAlphabet,
        choisir: choixLettre,
        choixConsigne: 'Choisis une lettre.',
        choixBouton: 'Une autre lettre',
        felicitation: 'Tu connais tes lettres !'
      }
    }
  ];

  global.Jeux = {
    liste: JEUX,
    trouver: function (id) {
      for (var i = 0; i < JEUX.length; i++) if (JEUX[i].id === id) return JEUX[i];
      return null;
    },
    lancer: function (stage, jeu, onQuit) { jouer(stage, jeu.def, onQuit); },
    voix: function (v) { if (v !== undefined) { voixActive = v; if (!v) taire(); } return voixActive; },
    taire: taire
  };
})(window);
