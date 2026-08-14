/* ============================================================
   histoires.js — du canevas à l'histoire du soir

   UN CANEVAS N'EST PAS UNE HISTOIRE

   Un canevas ne connaît aucun prénom. Il décrit des RÔLES — « celui qui
   fonce », « celle qui range » — et ce qui leur arrive. Au moment de la
   lecture, on distribue ces rôles sur les personnages que la famille a
   créés, et l'histoire devient celle de cet enfant-là.

   C'est ce qui permet d'écrire des phrases précises sans écrire pour
   personne : « Il ne demanda pas. Il prit. » vaut pour n'importe quel
   rapide, et ne vaut que pour un rapide.

   TROIS CHOSES QUI ONT L'AIR DE DÉTAILS ET N'EN SONT PAS

   1. Le casting est FIGÉ à la première lecture. Sans ça, l'histoire
      changerait de héros d'un soir à l'autre — et à quatre ans, ce n'est
      pas la même histoire.
   2. Le français impose le genre. On ne peut pas écrire « content » sans
      savoir. Le gabarit `{e:role}` sert exactement à ça.
   3. Une famille peut être vide, ou n'avoir qu'un personnage. Une
      histoire doit quand même se lire le premier soir : les rôles qui ne
      trouvent personne sont tenus par des figurants.
   ============================================================ */
(function (global) {
  'use strict';

  var CLE_DISTRIB = 'kidcartoon.v1.distributions';

  /* ------------------------------------------------------------
     LA TROUPE DE FIGURANTS

     Ils ne servent qu'à combler : dès qu'un personnage de la famille peut
     tenir le rôle, c'est lui qui passe devant.
     ------------------------------------------------------------ */
  var TROUPE = [
    { prenom: 'Lou', genre: 'elle', archetype: 'curieuse', silhouette: 'enfant',
      reglages: { teint: '#f2c49a', cheveux: '#4a2f22', coiffure: 'boucles',
        vetement: '#3ec9c9', haut: 'teeshirt', bas: 'jupe', couleurBas: '#8a3f5c' } },
    { prenom: 'Tino', genre: 'il', archetype: 'rapide', silhouette: 'enfant',
      reglages: { teint: '#f7dcc4', cheveux: '#3c2a20', coiffure: 'carre',
        vetement: '#e8746b', haut: 'teeshirt', bas: 'short', couleurBas: '#4a6ea8' } },
    { prenom: 'Nena', genre: 'elle', archetype: 'rangetout', silhouette: 'enfant',
      reglages: { teint: '#c9885c', cheveux: '#2f2118', coiffure: 'deuxtresses',
        vetement: '#a98cf0', haut: 'pull', bas: 'pantalon', couleurBas: '#3f4a5c' } },
    { prenom: 'Sami', genre: 'il', archetype: 'timide', silhouette: 'enfant',
      reglages: { teint: '#e8b98f', cheveux: '#6b4a33', coiffure: 'carre',
        vetement: '#7ab648', haut: 'teeshirt', bas: 'pantalon', couleurBas: '#7a4a2c' } },
    { prenom: 'Bidou', genre: 'il', archetype: 'farceur', silhouette: 'rond',
      reglages: { couleur: '#f0a24a', forme: 'poire', oreilles: 'rondes', museau: true } },
    { prenom: 'Maman', genre: 'elle', archetype: 'rangetout', silhouette: 'adulte', lien: 'maman',
      reglages: { teint: '#f2c49a', cheveux: '#6b4a33', coiffure: 'queue',
        vetement: '#4f8a7a', haut: 'pull', bas: 'pantalon', couleurBas: '#3f4a5c' } },
    { prenom: 'Papa', genre: 'il', archetype: 'grognon', silhouette: 'adulte', lien: 'papa',
      reglages: { teint: '#e8b98f', cheveux: '#3c2a20', coiffure: 'carre',
        vetement: '#5aa9e8', haut: 'pull', bas: 'pantalon', couleurBas: '#2f2118' } }
  ];

  function famille() {
    return (global.Perso && Perso.tous()) || [];
  }

  /* ------------------------------------------------------------
     LA DISTRIBUTION

     Chaque rôle demande un archétype ; à défaut, un adulte, ou n'importe
     qui. Personne ne tient deux rôles : dans une histoire à trois, voir
     deux fois le même enfant casse tout.
     ------------------------------------------------------------ */
  /* À qualité égale, c'est l'enfant qui joue : « moi » passe devant dans le
     vivier retenu, mais il ne double JAMAIS l'archétype. Une curieuse qui
     tiendrait le rôle de la range-tout entendrait « les gens qui rangent
     voient tout » — et ce serait faux pour elle. C'est le corpus qui doit
     couvrir les six tempéraments, pas la distribution qui doit tricher. */
  function moiDabord(liste) {
    var moi = liste.filter(function (p) { return p.lien === 'moi'; });
    return moi.length ? moi.concat(liste) : liste;
  }

  function candidats(role, gens, pris) {
    var libres = gens.filter(function (p) { return !pris[cleDe(p)]; });
    var f = [];
    if (role.archetype) {
      f = moiDabord(libres.filter(function (p) { return p.archetype === role.archetype; }));
    }
    if (!f.length && role.adulte) {
      f = libres.filter(function (p) { return p.silhouette === 'adulte'; });
    }
    if (!f.length && role.enfant) {
      f = libres.filter(function (p) { return p.silhouette === 'enfant'; });
    }
    return f.length ? f : libres;
  }
  function cleDe(p) { return p.id || ('troupe:' + p.prenom); }

  function distribuer(canevas) {
    var gens = famille(), pris = {}, roles = {};
    canevas.roles.forEach(function (r) {
      /* la famille d'abord, la troupe ensuite — et jamais deux fois la
         même personne dans la même histoire */
      var c = candidats(r, gens, pris)[0] || candidats(r, TROUPE, pris)[0];
      if (!c) c = TROUPE[0];
      pris[cleDe(c)] = true;
      roles[r.cle] = c;
    });
    return roles;
  }

  /* On fige la distribution : la même histoire garde ses héros d'un soir à
     l'autre. Si un personnage a été supprimé entre-temps, son rôle est
     redistribué — et l'histoire le dit au parent plutôt que de faire
     semblant. */
  function distribution(canevas) {
    var stock = {};
    try { stock = JSON.parse(localStorage.getItem(CLE_DISTRIB) || '{}'); } catch (e) { }
    var gens = famille(), parId = {}, i;
    for (i = 0; i < gens.length; i++) parId[gens[i].id] = gens[i];
    for (i = 0; i < TROUPE.length; i++) parId['troupe:' + TROUPE[i].prenom] = TROUPE[i];

    var fige = stock[canevas.id], roles = {}, complet = true;
    if (fige) {
      canevas.roles.forEach(function (r) {
        var p = parId[fige[r.cle]];
        if (p) roles[r.cle] = p; else complet = false;
      });
      if (complet) return { roles: roles, refait: false };
    }
    roles = distribuer(canevas);
    var aRanger = {};
    canevas.roles.forEach(function (r) { aRanger[r.cle] = cleDe(roles[r.cle]); });
    stock[canevas.id] = aRanger;
    try { localStorage.setItem(CLE_DISTRIB, JSON.stringify(stock)); } catch (e) { }
    return { roles: roles, refait: !!fige };
  }

  /* ------------------------------------------------------------
     LE TEXTE

     Un gabarit minuscule, mais qui couvre ce dont une histoire a besoin :
       {heros}     le prénom
       {il:heros}  il / elle          {Il:heros} en début de phrase
       {lui:heros} lui / elle
       {e:heros}   '' / 'e'   →  « content{e:heros} »
     Une majuscule sur le gabarit met une majuscule sur le mot : sans ça,
     toutes les phrases devraient commencer par un prénom, et ça s'entend
     à la lecture à voix haute. Rien de plus : dès qu'un gabarit devient
     malin, l'écriture devient illisible, et c'est l'écriture qui compte.
     ------------------------------------------------------------ */
  function genre(p) {
    return (global.Perso && Perso.genreDe) ? Perso.genreDe(p) : (p.genre || 'elle');
  }

  function majuscule(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function texte(modele, roles) {
    return String(modele).replace(/\{(\w+)(?::(\w+))?\}/g, function (tout, a, b) {
      var cle = b || a, p = roles[cle];
      if (!p) return tout;
      var grand = /^[A-ZÉÀ]/.test(a);
      var mot = a.toLowerCase();
      var f = genre(p) === 'elle';
      var out;
      if (!b) return p.prenom;
      if (mot === 'il') out = f ? 'elle' : 'il';
      else if (mot === 'lui') out = f ? 'elle' : 'lui';
      else if (mot === 'e') out = f ? 'e' : '';
      else out = p.prenom;
      return grand ? majuscule(out) : out;
    });
  }

  /* ------------------------------------------------------------
     LA PLANCHE

     Une planche ne porte aucune coordonnée : elle dit qui est là et ce
     qu'ils font. C'est `Scene.composer` qui place — et c'est la seule
     raison pour laquelle une histoire écrite une fois marche avec un
     bébé, une mamie et un doudou aussi bien qu'avec trois enfants.
     ------------------------------------------------------------ */
  function fusion(a, b) {
    var o = {}, k;
    for (k in a) if (a.hasOwnProperty(k)) o[k] = a[k];
    for (k in b) if (b.hasOwnProperty(k)) o[k] = b[k];
    return o;
  }

  function dessinDe(p, extra) {
    var base = (global.Perso && p.reglages)
      ? Perso.pourDessin(p) : fusion({ t: p.silhouette }, p.reglages);
    return fusion(base, extra);
  }

  function composerPlanche(pl, roles) {
    var qui = pl.qui || [];
    var casting = qui.map(function (cle) {
      return dessinDe(roles[cle], {
        pose: (pl.poses && pl.poses[cle]) || 'debout',
        humeur: (pl.humeurs && pl.humeurs[cle]) || 'content'
      });
    });
    var bulles = (pl.bulles || []).map(function (b) {
      return { qui: Math.max(0, qui.indexOf(b.qui)), t: texte(b.t, roles) };
    });
    var bruits = (pl.bruits || []).map(function (b) {
      return { qui: Math.max(0, qui.indexOf(b.qui)), t: b.t };
    });
    return Scene.composer({
      decor: pl.decor, heure: pl.heure, flocons: pl.flocons,
      casting: casting, fond: pl.fond, avant: pl.avant,
      bulles: bulles.length ? bulles : null,
      bruits: bruits.length ? bruits : null
    });
  }

  /* ------------------------------------------------------------
     L'HISTOIRE PERSONNALISÉE

     C'est la forme que le lecteur attend : un titre, une couverture, des
     pages. On la fabrique une fois, et on la garde en mémoire pour la
     session — recomposer vingt planches à chaque ouverture de la
     bibliothèque ferait ramer un téléphone.
     ------------------------------------------------------------ */
  var enMemoire = {};

  function personnaliser(canevas) {
    if (enMemoire[canevas.id]) return enMemoire[canevas.id];
    var d = distribution(canevas);
    var roles = d.roles;
    var pages = canevas.planches.map(function (pl) {
      return { scene: composerPlanche(pl, roles), text: texte(pl.texte, roles) };
    });
    var h = {
      id: canevas.id,
      title: texte(canevas.titre, roles),
      subtitle: texte(canevas.sous, roles),
      tag: canevas.themes[0],
      themes: canevas.themes,
      minutes: canevas.minutes || Math.max(2, Math.round(pages.length * 0.6)),
      cover: pages[0].scene,
      pages: pages,
      /* de quoi afficher « avec Camille, Papa et Bidou » */
      distribution: canevas.roles.map(function (r) { return roles[r.cle].prenom; }),
      redistribue: d.refait
    };
    enMemoire[canevas.id] = h;
    return h;
  }

  /* Quand la famille change, tout est à refaire : les héros ne sont plus
     les mêmes. On oublie ce qu'on avait composé, on garde les
     distributions figées (elles se répareront toutes seules). */
  function oublier() { enMemoire = {}; }

  /* ------------------------------------------------------------
     LE RECUEIL

     Un seul, pour l'instant : il n'y a pas encore de quoi en faire deux,
     et un onglet unique vaut mieux qu'une taxinomie vide.
     ------------------------------------------------------------ */
  function construire() {
    if (!global.CANEVAS || !global.UNIVERSES) return;
    UNIVERSES.length = 0;
    var histoires = CANEVAS.map(personnaliser);
    if (!histoires.length) return;
    UNIVERSES.push({
      id: 'maison', name: 'À la maison', emoji: '🏠',
      tagline: 'Des histoires avec vos personnages.',
      c1: '#d8342b', c2: '#f7c518',
      cover: histoires[0].cover,
      stories: histoires
    });
  }

  global.Histoires = {
    TROUPE: TROUPE,
    texte: texte,
    distribuer: distribuer,
    distribution: distribution,
    personnaliser: personnaliser,
    composerPlanche: composerPlanche,
    construire: construire,
    oublier: function () { oublier(); construire(); }
  };

  /* On construit tout de suite : `app.js` lit UNIVERSES au chargement, et
     une bibliothèque vide au premier affichage ne se rattrape pas. */
  construire();
})(window);
