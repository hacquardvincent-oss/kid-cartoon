/* ============================================================
   perso.js — le créateur de personnages, et leur rangement

   LE CADRE EST VOLONTAIREMENT FERMÉ

   On ne propose pas une roue chromatique et un curseur de taille. On
   propose sept teints, huit couleurs de cheveux, dix couleurs de
   vêtement. Un espace de création borné donne de meilleurs résultats
   qu'un espace ouvert — l'enfant choisit vite, le parent ne bricole pas,
   et surtout : tout ce qui sort d'ici est dessinable et mesurable par le
   moteur, donc plaçable par la mise en scène.

   L'ARCHÉTYPE EST LE CHAMP LE PLUS IMPORTANT

   Le prénom sert à l'enfant. La silhouette sert au dessin. Mais c'est
   l'archétype qui décide de ce que le personnage FAIT dans une histoire.
   Les canevas ne sont pas écrits pour « le héros » — ça produit une prose
   plate — mais pour des tempéraments. Six, pas plus : c'est ce chiffre,
   et pas le nombre de personnages, qui fixe le volume d'écriture.
   ============================================================ */
(function (global) {
  'use strict';

  var CLE = 'kidcartoon.v1.famille';

  /* Huit personnages : une grille qui tient sur un écran de téléphone sans
     défilement. Au-delà, l'enfant ne les reconnaît plus, il les cherche. */
  var MAX = 8;

  /* ------------------------------------------------------------
     LES SIX ARCHÉTYPES

     L'article est genré parce qu'une histoire a besoin d'écrire « il » ou
     « elle » — mais le tempérament, lui, ne l'est pas : on peut donner
     « la range-tout » à un papa et « le grognon » à une mamie. C'est
     précisément ce qui permet d'écrire des phrases précises et de les
     appliquer à n'importe quel personnage de n'importe quelle famille.
     ------------------------------------------------------------ */
  var ARCHETYPES = [
    { id: 'grognon', nom: 'Grognon', emoji: '😠',
      dit: 'Il râle, il dit non, il boude. C\'est lui qui fait les grosses colères — et qui apprend à souffler.' },
    { id: 'timide', nom: 'Timide', emoji: '🙈',
      dit: 'Elle n\'ose pas. C\'est elle qui apprend à demander, et qui découvre que ça marche.' },
    { id: 'rapide', nom: 'Rapide', emoji: '💨',
      dit: 'Il fonce avant de réfléchir. C\'est lui qui casse quelque chose — et qui le répare.' },
    { id: 'curieuse', nom: 'Curieuse', emoji: '🔎',
      dit: 'Elle demande pourquoi, tout le temps. C\'est elle qui entraîne les autres dehors.' },
    { id: 'farceur', nom: 'Farceur', emoji: '😜',
      dit: 'Il taquine pour rire. C\'est lui qui va trop loin, et qui doit dire pardon.' },
    { id: 'rangetout', nom: 'Range-tout', emoji: '🧺',
      dit: 'Elle veut que tout soit à sa place. C\'est elle qui apprend à prêter ses affaires.' }
  ];

  /* Le lien ne change rien au dessin : il sert à l'écriture (« Maman dit
     non ») et au rangement de la grille. */
  var LIENS = ['moi', 'maman', 'papa', 'frère', 'sœur', 'mamie', 'papi',
    'copain', 'copine', 'doudou', 'imaginaire', 'animal'];

  /* En français, une histoire ne peut pas éviter le genre : on écrit « il
     revint » ou « elle revint », « content » ou « contente ». Ce n'est pas
     un réglage de dessin, c'est un réglage de PHRASE — et sans lui, tous
     les canevas seraient condamnés à des tournures contournées.
     Le lien le devine dans la plupart des cas ; on peut toujours corriger. */
  var GENRES = ['il', 'elle'];
  var GENRE_DU_LIEN = {
    maman: 'elle', 'sœur': 'elle', mamie: 'elle', copine: 'elle',
    papa: 'il', 'frère': 'il', papi: 'il', copain: 'il'
  };
  function genreDe(p) {
    return p.genre || GENRE_DU_LIEN[p.lien] || 'elle';
  }

  /* ------------------------------------------------------------
     LES PALETTES
     ------------------------------------------------------------ */
  var PALETTES = {
    teint: ['#f9dcbd', '#f6cba6', '#f2c49a', '#e8b98f', '#c9885c', '#a4683f', '#7a4a2c'],
    cheveux: ['#f7dc8a', '#f0be48', '#c9702f', '#9a6a3c', '#6b4a33', '#4a2f22', '#2f2118', '#e4e2dc'],
    vetement: ['#3ec9c9', '#e8746b', '#a98cf0', '#7ac6a8', '#f0a24a', '#5aa9e8',
      '#e8436e', '#7ab648', '#f7c518', '#8a8f9a'],
    bas: ['#4a6ea8', '#3f4a5c', '#c9702f', '#7a4a2c', '#4f7a5c', '#8a3f5c', '#e4e2dc', '#2f2118'],
    poil: ['#c9a06a', '#8a8f9a', '#f2e2d0', '#6f9ed8', '#e0954e', '#4a3a2e', '#d8b8a0', '#a8c8b0'],
    rond: ['#f0a24a', '#7ac6a8', '#a98cf0', '#e8746b', '#5aa9e8', '#f7c518', '#e895b8', '#8fd0a8']
  };

  /* Quels réglages a le droit d'exister sur quelle silhouette. C'est aussi
     ce que le créateur affiche : on ne montre pas une coiffure à un chien. */
  var SILHOUETTES = [
    { id: 'enfant', nom: 'Enfant', champs: ['teint', 'cheveux', 'coiffure', 'haut', 'bas', 'accessoires'] },
    { id: 'adulte', nom: 'Adulte', champs: ['teint', 'cheveux', 'coiffure', 'haut', 'bas', 'accessoires'] },
    { id: 'bebe', nom: 'Bébé', champs: ['teint', 'cheveux', 'vetement'] },
    { id: 'animal', nom: 'Animal', champs: ['poil', 'oreilles', 'queue'] },
    { id: 'rond', nom: 'Doudou', champs: ['rond', 'forme', 'oreilles', 'museau'] }
  ];

  var OREILLES_ANIMAL = ['pointues', 'rondes', 'tombantes', 'longues'];
  var OREILLES_ROND = ['rondes', 'longues', 'aucune'];
  var FORMES_ROND = ['rond', 'ovale', 'poire', 'carre'];
  var QUEUES = ['dressee', 'pompon', 'aucune'];
  var ACCESSOIRES = [
    { id: 'lunettes', nom: 'Lunettes', emoji: '👓' },
    { id: 'couronne', nom: 'Couronne', emoji: '👑' },
    { id: 'chapeau', nom: 'Chapeau', emoji: '🎩' },
    { id: 'noeuds', nom: 'Nœuds', emoji: '🎀' },
    { id: 'barrette', nom: 'Barrette', emoji: '📎' }
  ];

  /* ------------------------------------------------------------
     LE RANGEMENT

     Rien ne sort de l'appareil. C'est une promesse produit autant qu'une
     simplification : une application pour enfants qui n'envoie rien n'a
     presque rien à déclarer.
     ------------------------------------------------------------ */
  function lire() {
    try {
      var v = JSON.parse(localStorage.getItem(CLE) || '[]');
      return Array.isArray(v) ? v : [];
    } catch (e) { return []; }
  }
  function ecrire(liste) {
    try { localStorage.setItem(CLE, JSON.stringify(liste)); } catch (e) { /* mode privé */ }
    ecouteurs.forEach(function (f) { f(liste); });
  }
  var ecouteurs = [];

  function id() {
    return 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
  }

  function enregistrer(p) {
    var liste = lire();
    if (p.id) {
      for (var i = 0; i < liste.length; i++) {
        if (liste[i].id === p.id) { liste[i] = p; ecrire(liste); return p; }
      }
    }
    if (liste.length >= MAX) return null;
    p.id = id();
    liste.push(p);
    ecrire(liste);
    return p;
  }

  function supprimer(pid) {
    ecrire(lire().filter(function (p) { return p.id !== pid; }));
  }

  /* ------------------------------------------------------------
     DU PERSONNAGE RANGÉ AU PERSONNAGE DESSINÉ

     Le stockage garde l'identité (prénom, lien, archétype) à côté des
     réglages de dessin. Le moteur, lui, ne veut que les réglages — et
     surtout pas le prénom, qui changerait la signature de mesure et
     ferait remesurer le même dessin pour rien.
     ------------------------------------------------------------ */
  function pourDessin(p, extra) {
    var o = { t: p.silhouette }, k;
    for (k in p.reglages) if (p.reglages.hasOwnProperty(k)) o[k] = p.reglages[k];
    for (k in extra) if (extra.hasOwnProperty(k)) o[k] = extra[k];
    return o;
  }

  function vignette(p, ds) {
    return Art.vignette(pourDessin(p, { ds: ds || .62, dy: 186 }));
  }

  /* un personnage neuf, déjà présentable : on ne commence jamais devant
     une silhouette grise */
  function neuf(silhouette) {
    var r = { enfant: {
        teint: PALETTES.teint[1], cheveux: PALETTES.cheveux[4], coiffure: 'couettes',
        vetement: PALETTES.vetement[0], haut: 'teeshirt', bas: 'pantalon', couleurBas: PALETTES.bas[0]
      },
      adulte: {
        teint: PALETTES.teint[2], cheveux: PALETTES.cheveux[5], coiffure: 'carre',
        vetement: PALETTES.vetement[3], haut: 'pull', bas: 'pantalon', couleurBas: PALETTES.bas[1]
      },
      bebe: { teint: PALETTES.teint[1], cheveux: PALETTES.cheveux[0], vetement: PALETTES.vetement[5] },
      animal: { poil: PALETTES.poil[0], clair: '#f7e7cf', oreilles: 'tombantes' },
      rond: { couleur: PALETTES.rond[0], forme: 'poire', oreilles: 'rondes', museau: true }
    }[silhouette];
    return {
      silhouette: silhouette, prenom: '', lien: 'copain', genre: 'il',
      archetype: 'curieuse', reglages: r
    };
  }

  /* le poil clair suit le poil : un animal dont le museau ne s'éclaircit
     pas avec sa fourrure a l'air malade */
  function majClair(p) {
    if (p.silhouette === 'animal') p.reglages.clair = Art.shade(p.reglages.poil, 0.55);
  }

  /* ============================================================
     LE CRÉATEUR

     C'est un écran de PARENT, contrairement au reste de l'application :
     ici on a le droit d'écrire des mots. Mais l'enfant regarde par-dessus
     l'épaule et montre du doigt, donc tout ce qui se choisit est une
     grande pastille de couleur ou une image — jamais une liste déroulante.
     ============================================================ */
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    return n;
  }

  function ouvrir(zone, onFini) {
    var edition = null;      // le personnage en cours d'édition, ou null

    function grille() {
      zone.innerHTML = '';
      var liste = lire();
      zone.appendChild(el('p', 'hello',
        liste.length
          ? '<b>' + liste.length + '</b> personnage' + (liste.length > 1 ? 's' : '') +
            ' — touche-le pour le changer.'
          : 'Créez ensemble les personnages de vos histoires.'));

      var g = el('div', 'famille-grille');
      liste.forEach(function (p) {
        var c = el('button', 'perso-carte');
        var a = archetype(p.archetype);
        c.innerHTML = '<div class="perso-vignette">' + vignette(p) + '</div>' +
          '<div class="perso-nom">' + (p.prenom || '—') + '</div>' +
          '<div class="perso-lien">' + p.lien + ' · ' + (a ? a.emoji + ' ' + a.nom : '') + '</div>';
        c.onclick = function () { editer(p); };
        g.appendChild(c);
      });

      if (liste.length < MAX) {
        var plus = el('button', 'perso-carte perso-ajout',
          '<div class="perso-plus">+</div><div class="perso-nom">Ajouter</div>');
        plus.onclick = function () { choisirSilhouette(); };
        g.appendChild(plus);
      }
      zone.appendChild(g);

      if (liste.length) {
        zone.appendChild(el('p', 'foot-note',
          'Ces personnages deviennent les héros des histoires et des jeux. ' +
          'Rien ne sort du téléphone.'));
      }
    }

    function choisirSilhouette() {
      zone.innerHTML = '';
      zone.appendChild(el('p', 'hello', 'Quelle sorte de personnage ?'));
      var g = el('div', 'famille-grille');
      SILHOUETTES.forEach(function (s) {
        var p = neuf(s.id);
        var c = el('button', 'perso-carte');
        c.innerHTML = '<div class="perso-vignette">' + vignette(p) + '</div>' +
          '<div class="perso-nom">' + s.nom + '</div>';
        c.onclick = function () { editer(p); };
        g.appendChild(c);
      });
      zone.appendChild(g);
      var retour = el('button', 'chip', '↩ Retour');
      retour.onclick = grille;
      zone.appendChild(retour);
    }

    function editer(p) {
      edition = JSON.parse(JSON.stringify(p));
      dessinerEditeur();
    }

    function dessinerEditeur() {
      var p = edition;
      var champs = silhouetteDe(p.silhouette).champs;
      zone.innerHTML = '';

      var apercu = el('div', 'perso-apercu');
      zone.appendChild(apercu);
      function majApercu() {
        apercu.innerHTML = Art.vignette(pourDessin(p, { ds: .74, dy: 190 }));
      }
      majApercu();

      /* une rangée de choix : une pastille par valeur */
      function rangee(titre, valeurs, courant, poser, rendu) {
        var bloc = el('div', 'reglage');
        bloc.appendChild(el('span', 'reglage-titre', titre));
        var r = el('div', 'reglage-choix');
        valeurs.forEach(function (v) {
          var b = el('button', 'pastille' + (courant() === v ? ' is-active' : ''));
          b.innerHTML = rendu(v);
          b.onclick = function () {
            poser(v);
            majApercu();
            /* on redessine la rangée pour déplacer la coche */
            Array.prototype.forEach.call(r.children, function (x) { x.className = 'pastille'; });
            b.className = 'pastille is-active';
          };
          r.appendChild(b);
        });
        bloc.appendChild(r);
        zone.appendChild(bloc);
      }
      function couleur(v) { return '<i style="background:' + v + '"></i>'; }
      function mot(v) { return '<span>' + v + '</span>'; }

      if (champs.indexOf('teint') >= 0) {
        rangee('Teint', PALETTES.teint,
          function () { return p.reglages.teint; },
          function (v) { p.reglages.teint = v; }, couleur);
      }
      if (champs.indexOf('cheveux') >= 0) {
        rangee('Cheveux', PALETTES.cheveux,
          function () { return p.reglages.cheveux; },
          function (v) { p.reglages.cheveux = v; }, couleur);
      }
      if (champs.indexOf('coiffure') >= 0) {
        rangee('Coiffure', Art.coiffures,
          function () { return p.reglages.coiffure; },
          function (v) { p.reglages.coiffure = v; }, mot);
      }
      if (champs.indexOf('haut') >= 0) {
        rangee('Haut', Art.hauts,
          function () { return p.reglages.haut; },
          function (v) { p.reglages.haut = v; }, mot);
        rangee('Couleur du haut', PALETTES.vetement,
          function () { return p.reglages.vetement; },
          function (v) { p.reglages.vetement = v; }, couleur);
      }
      if (champs.indexOf('bas') >= 0) {
        rangee('Bas', Art.bas,
          function () { return p.reglages.bas; },
          function (v) { p.reglages.bas = v; }, mot);
        rangee('Couleur du bas', PALETTES.bas,
          function () { return p.reglages.couleurBas; },
          function (v) { p.reglages.couleurBas = v; }, couleur);
      }
      if (champs.indexOf('vetement') >= 0) {
        rangee('Pyjama', PALETTES.vetement,
          function () { return p.reglages.vetement; },
          function (v) { p.reglages.vetement = v; }, couleur);
      }
      if (champs.indexOf('poil') >= 0) {
        rangee('Poil', PALETTES.poil,
          function () { return p.reglages.poil; },
          function (v) { p.reglages.poil = v; majClair(p); }, couleur);
        rangee('Oreilles', OREILLES_ANIMAL,
          function () { return p.reglages.oreilles; },
          function (v) { p.reglages.oreilles = v; }, mot);
        rangee('Queue', QUEUES,
          function () { return p.reglages.queue || 'dressee'; },
          function (v) { p.reglages.queue = v; }, mot);
      }
      if (champs.indexOf('rond') >= 0) {
        rangee('Couleur', PALETTES.rond,
          function () { return p.reglages.couleur; },
          function (v) { p.reglages.couleur = v; }, couleur);
        rangee('Forme', FORMES_ROND,
          function () { return p.reglages.forme; },
          function (v) { p.reglages.forme = v; }, mot);
        rangee('Oreilles', OREILLES_ROND,
          function () { return p.reglages.oreilles; },
          function (v) { p.reglages.oreilles = v; }, mot);
        rangee('Museau', ['oui', 'non'],
          function () { return p.reglages.museau ? 'oui' : 'non'; },
          function (v) { p.reglages.museau = v === 'oui'; }, mot);
      }
      if (champs.indexOf('accessoires') >= 0) {
        var bloc = el('div', 'reglage');
        bloc.appendChild(el('span', 'reglage-titre', 'Accessoires'));
        var r = el('div', 'reglage-choix');
        ACCESSOIRES.forEach(function (a) {
          var b = el('button', 'pastille pastille-large' +
            (p.reglages[a.id] ? ' is-active' : ''), '<span>' + a.emoji + ' ' + a.nom + '</span>');
          b.onclick = function () {
            /* un accessoire porte une couleur : on lui en donne une par
               défaut, et l'enlever c'est le remettre à rien */
            p.reglages[a.id] = p.reglages[a.id] ? null : couleurAccessoire(a.id, p);
            b.classList.toggle('is-active', !!p.reglages[a.id]);
            majApercu();
          };
          r.appendChild(b);
        });
        bloc.appendChild(r);
        zone.appendChild(bloc);
      }

      /* --- l'identité --- */
      var idbloc = el('div', 'reglage');
      idbloc.appendChild(el('span', 'reglage-titre', 'Son prénom'));
      var champ = el('input', 'perso-prenom');
      champ.type = 'text';
      champ.value = p.prenom || '';
      champ.maxLength = 14;
      champ.placeholder = 'Comment s\'appelle-t-il ?';
      champ.oninput = function () { p.prenom = champ.value; };
      idbloc.appendChild(champ);
      zone.appendChild(idbloc);

      rangee('Qui est-ce ?', LIENS,
        function () { return p.lien; },
        function (v) {
          p.lien = v;
          /* on suit le lien tant que personne n'a corrigé à la main */
          if (!p.genreChoisi && GENRE_DU_LIEN[v]) p.genre = GENRE_DU_LIEN[v];
          majGenre();
        }, mot);

      var gbloc = el('div', 'reglage');
      gbloc.appendChild(el('span', 'reglage-titre', 'Dans les histoires, on dit'));
      var gr = el('div', 'reglage-choix');
      GENRES.forEach(function (v) {
        var b = el('button', 'pastille pastille-large', '<span>' + v + '</span>');
        b.dataset.genre = v;
        b.onclick = function () {
          p.genre = v; p.genreChoisi = true; majGenre();
        };
        gr.appendChild(b);
      });
      gbloc.appendChild(gr);
      zone.appendChild(gbloc);
      function majGenre() {
        Array.prototype.forEach.call(gr.children, function (b) {
          b.className = 'pastille pastille-large' +
            (b.dataset.genre === genreDe(p) ? ' is-active' : '');
        });
      }
      majGenre();

      /* --- l'archétype : le champ le plus important --- */
      var abloc = el('div', 'reglage');
      abloc.appendChild(el('span', 'reglage-titre', 'Son caractère'));
      abloc.appendChild(el('p', 'reglage-aide',
        'C\'est lui qui décide de ce que le personnage fait dans les histoires. ' +
        'Le tempérament n\'a pas de genre : une mamie peut être « Grognon ».'));
      var ar = el('div', 'reglage-choix');
      var dit = el('p', 'archetype-dit');
      ARCHETYPES.forEach(function (a) {
        var b = el('button', 'pastille pastille-large' + (p.archetype === a.id ? ' is-active' : ''),
          '<span>' + a.emoji + ' ' + a.nom + '</span>');
        b.onclick = function () {
          p.archetype = a.id;
          Array.prototype.forEach.call(ar.children, function (x) { x.className = 'pastille pastille-large'; });
          b.className = 'pastille pastille-large is-active';
          dit.textContent = a.dit;
        };
        ar.appendChild(b);
      });
      abloc.appendChild(ar);
      dit.textContent = (archetype(p.archetype) || ARCHETYPES[0]).dit;
      abloc.appendChild(dit);
      zone.appendChild(abloc);

      /* --- les boutons --- */
      var actions = el('div', 'perso-actions');
      var ok = el('button', 'cta', '<span class="cta-img">✓</span><span class="cta-mot">Enregistrer</span>');
      ok.onclick = function () {
        if (!p.prenom.trim()) { champ.focus(); champ.classList.add('manque'); return; }
        enregistrer(p);
        if (onFini) onFini();
        grille();
      };
      actions.appendChild(ok);
      var annuler = el('button', 'chip', '↩ Annuler');
      annuler.onclick = grille;
      actions.appendChild(annuler);
      if (p.id) {
        var sup = el('button', 'chip chip-danger', '🗑 Supprimer');
        sup.onclick = function () { confirmerSuppression(p); };
        actions.appendChild(sup);
      }
      zone.appendChild(actions);
      window.scrollTo(0, 0);
    }

    /* Supprimer un personnage n'est pas anodin : une histoire déjà lue s'en
       souvient. Tant que le stockage des histoires n'existe pas, on se
       contente de le dire — mais on le dit. */
    function confirmerSuppression(p) {
      var f = el('div', 'perso-confirme',
        '<p>Supprimer <b>' + (p.prenom || 'ce personnage') + '</b> ?</p>' +
        '<p class="petit">Les histoires déjà lues qui le font apparaître ne pourront plus ' +
        'être relues à l\'identique.</p>');
      var oui = el('button', 'chip chip-danger', 'Oui, supprimer');
      oui.onclick = function () { supprimer(p.id); if (onFini) onFini(); grille(); };
      var non = el('button', 'chip', 'Non, garder');
      non.onclick = function () { f.remove(); };
      f.appendChild(oui); f.appendChild(non);
      zone.appendChild(f);
      f.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }

    grille();
  }

  function couleurAccessoire(cle, p) {
    if (cle === 'couronne') return '#ffd93d';
    if (cle === 'chapeau') return Art.shade(p.reglages.vetement || '#3ec9c9', 0.2);
    if (cle === 'noeuds' || cle === 'barrette') return '#ff5c8a';
    return true;    // les lunettes n'ont pas de couleur
  }

  function archetype(aid) {
    for (var i = 0; i < ARCHETYPES.length; i++) if (ARCHETYPES[i].id === aid) return ARCHETYPES[i];
    return null;
  }
  function silhouetteDe(sid) {
    for (var i = 0; i < SILHOUETTES.length; i++) if (SILHOUETTES[i].id === sid) return SILHOUETTES[i];
    return SILHOUETTES[0];
  }

  global.Perso = {
    MAX: MAX,
    ARCHETYPES: ARCHETYPES,
    LIENS: LIENS,
    SILHOUETTES: SILHOUETTES,
    PALETTES: PALETTES,
    tous: lire,
    enregistrer: enregistrer,
    supprimer: supprimer,
    archetype: archetype,
    GENRES: GENRES,
    genreDe: genreDe,
    pourDessin: pourDessin,
    vignette: vignette,
    ouvrir: ouvrir,
    /* prévenir quand la famille change : les jeux s'en servent pour se
       remettre à jour sans que personne ait à y penser */
    surChangement: function (f) { ecouteurs.push(f); }
  };
})(window);
