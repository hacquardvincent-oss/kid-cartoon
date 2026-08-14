/* ============================================================
   scene.js — la mise en scène automatique

   POURQUOI CE FICHIER EXISTE

   Dans l'application précédente, chaque planche était placée à la main :
   on écrivait `{ t: 'lheroine', x: 250, y: 520, s: .9 }` et on regardait le
   résultat. Ça marchait parce qu'on connaissait les personnages en
   écrivant l'histoire.

   Ici, non. Les personnages sont inventés par la famille : on ne sait pas,
   au moment d'écrire, si le héros sera un bébé de 140 unités de large ou
   un adulte de 250. Un x écrit à la main serait faux une fois sur deux.

   Le placement devient donc un calcul. Une histoire ne dit plus « le
   grognon est à 250 » mais « il y a trois personnages sur cette planche,
   celui du milieu parle » ; la mise en scène mesure les personnages
   réellement dessinés et décide des positions, des échelles et des bulles.

   TROIS LEÇONS DE L'APPLICATION PRÉCÉDENTE SONT ENCODÉES ICI

     · il faut au moins 190 unités entre deux centres, sinon deux
       personnages se marchent dessus même sans que leurs boîtes se croisent ;
     · un personnage assis descend SOUS son point d'appui — ici on ne
       corrige plus « d'environ 14 unités », on remonte de ce que la mesure
       dit exactement ;
     · une bulle à plus de 300 unités de celui qui parle traverse la case et
       devient illisible.

   COMMENT ON MESURE

   On dessine le personnage seul, à l'échelle 1, dans un SVG caché, et on
   demande au navigateur sa boîte réelle — traits d'encre compris. Chaque
   silhouette marque sa tête (`data-tete`), donc on obtient aussi la boîte
   du visage : c'est ce qui permet de poser une bulle à côté d'un visage
   plutôt que dessus. Les mesures sont gardées en mémoire : un même
   personnage dans une même pose n'est mesuré qu'une fois par session.
   ============================================================ */
(function (global) {
  'use strict';

  var W = 800, H = 560;

  /* Le cadre de jeu. La ligne de sol est basse : c'est le bas de la case
     qu'on garde en plein écran, jamais le haut. */
  var SOL = 526;

  /* Chaque décor a sa ligne de sol. Elle ne se devine pas : dans le décor
     « ruisseau », l'eau est au premier plan, et un personnage posé à 526 a
     les pieds dans le courant. */
  var SOLS = {
    plage: 526, mer: 470, jardin: 526, colline: 522, campement: 522,
    foret: 522, ruisseau: 438, neige: 522, village: 522, route: 520,
    chambre: 528, uni: 526
  };

  var MARGE = 24;          // le blanc gardé à gauche et à droite
  var ECART_CENTRES = 190; // la leçon la plus chère de l'application précédente
  var ECART_BOITES = 14;   // et un peu d'air entre deux silhouettes

  /* Les tailles relatives des silhouettes. Sans ça, un adulte et un enfant
     font la même hauteur — la fabrique est la même — et la planche ne
     raconte plus rien. */
  var TAILLES = {
    bebe: .60, enfant: 1, adulte: 1.26, animal: .92, rond: .84
  };

  /* On vise HAUT : le plus grand personnage remplit la hauteur disponible,
     et c'est la largeur qui fait redescendre tout le monde s'il le faut.
     L'inverse — choisir une échelle selon le nombre de personnages — donne
     des planches à moitié vides, avec du ciel là où il faudrait des têtes.
     Le plafond, lui, borne la casse : un personnage seul ne doit pas
     devenir un gros plan. */
  var ECHELLE_MAX = 1.5;
  var ECHELLE_MIN = .34;
  /* la place laissée au-dessus des têtes, selon qu'il y a du lettrage */
  var CIEL_LETTRAGE = 200, CIEL_NU = 80;

  /* ============================================================
     LA MESURE
     ============================================================ */

  var atelier = null, cache = {};

  /* un SVG hors écran, aux dimensions exactes de la case : une unité de
     scène y vaut un pixel, donc les rectangles du navigateur sont
     directement des unités */
  function atelierSVG() {
    if (atelier) return atelier;
    var d = document.createElement('div');
    d.setAttribute('aria-hidden', 'true');
    d.style.cssText = 'position:absolute;left:-10000px;top:0;width:' + W +
      'px;height:' + H + 'px;overflow:hidden;pointer-events:none';
    document.body.appendChild(d);
    atelier = d;
    return d;
  }

  /* les réglages qui changent le dessin — donc la boîte. La position et
     l'échelle n'en font pas partie : on mesure toujours à l'échelle 1. */
  var HORS_DESSIN = { x: 1, y: 1, s: 1, ds: 1, dy: 1, op: 1, rot: 1, taille: 1, nom: 1, role: 1 };

  function signature(it) {
    var k, s = [];
    for (k in it) {
      if (it.hasOwnProperty(k) && !HORS_DESSIN[k]) s.push(k + '=' + it[k]);
    }
    return s.sort().join('&');
  }

  function boite(el, base) {
    var r = el.getBoundingClientRect();
    return {
      g: r.left - base.left, d: r.right - base.left,
      h: r.top - base.top, b: r.bottom - base.top,
      l: r.width, ht: r.height
    };
  }

  /* Mesure un élément dessiné à l'échelle 1, dans le repère où ses pieds
     sont à l'origine. Renvoie des écarts signés : `g` est négatif (à gauche
     de l'ancre), `b` positif si l'élément descend sous ses pieds — c'est
     exactement ce dont on a besoin pour un personnage assis. */
  function mesurer(it) {
    var cle = signature(it);
    if (cache[cle]) return cache[cle];

    var d = atelierSVG();
    /* on dessine l'élément au centre bas de la case ; l'ancre est connue,
       les écarts se déduisent */
    var ax = W / 2, ay = H - 60;
    d.innerHTML = Art.scene({
      decor: 'uni',
      items: [merge(it, { x: ax, y: ay, s: 1 })]
    }, {});
    var svg = d.querySelector('svg');
    svg.style.width = W + 'px';
    svg.style.height = H + 'px';

    var base = svg.getBoundingClientRect();
    var noeud = svg.querySelector('[data-t]');
    var m = { g: -80, d: 80, h: -200, b: 0, tete: null };
    if (noeud) {
      var b = boite(noeud, base);
      m.g = b.g - ax; m.d = b.d - ax; m.h = b.h - ay; m.b = b.b - ay;
      var tete = noeud.querySelector('[data-tete]');
      if (tete) {
        var tb = boite(tete, base);
        m.tete = { g: tb.g - ax, d: tb.d - ax, h: tb.h - ay, b: tb.b - ay };
      }
    }
    /* l'ombre au sol déborde de quelques unités sous les pieds ; elle ne
       compte pas comme du personnage */
    if (m.b > 0 && m.b < 12) m.b = 0;
    m.l = m.d - m.g;
    m.ht = m.b - m.h;
    /* faute de tête marquée (un objet, par exemple), on prend le haut */
    if (!m.tete) m.tete = { g: m.g, d: m.d, h: m.h, b: m.h + Math.min(90, m.ht * .4) };
    cache[cle] = m;
    return m;
  }

  function merge(base, extra) {
    var o = {}, k;
    for (k in base) if (base.hasOwnProperty(k)) o[k] = base[k];
    for (k in extra) if (extra.hasOwnProperty(k)) o[k] = extra[k];
    return o;
  }

  /* ============================================================
     LE PLACEMENT
     ============================================================ */

  function chevauchent(a, b, air) {
    air = air || 0;
    return !(a.d + air <= b.g || b.d + air <= a.g || a.b + air <= b.h || b.b + air <= a.h);
  }

  /* Range le casting sur la ligne de sol.

     On place par les BORDS, jamais par les centres : une pose `salue` tend
     un bras à droite, `montre` tend un doigt encore plus loin. Deux
     personnages centrés à 200 unités l'un de l'autre peuvent très bien se
     toucher. On garde quand même la règle des 190 unités entre centres :
     deux silhouettes qui ne se croisent pas mais se frôlent se lisent mal. */
  function ranger(casting, opts) {
    opts = opts || {};
    var sol = opts.sol || SOL;
    var n = casting.length;
    var m = casting.map(mesurer);
    var naturelles = casting.map(function (c) { return c.taille || TAILLES[c.t] || 1; });

    /* 1. la hauteur commande. On cherche l'échelle commune qui amène le plus
       grand personnage juste sous le plafond ; les tailles relatives font le
       reste, et c'est ce qui garde un bébé petit à côté d'un adulte. */
    var plafond = opts.plafond === undefined ? (opts.bulles ? CIEL_LETTRAGE : CIEL_NU) : opts.plafond;
    var hauteurVoulue = sol - plafond;
    var i, plusGrand = 0;
    for (i = 0; i < n; i++) plusGrand = Math.max(plusGrand, -m[i].h * naturelles[i]);
    var base = opts.echelle || Math.min(ECHELLE_MAX, hauteurVoulue / (plusGrand || 1));
    var s = naturelles.map(function (k) { return base * k; });

    /* 2. on pose, de gauche à droite, PAR LES BORDS. Un bras qui salue tend
       la boîte de 40 unités d'un seul côté : placer par les centres ferait
       se toucher deux personnages pourtant « espacés de 200 ». */
    var dispo = W - 2 * MARGE;
    function poser(air) {
      var xs = [], curseur = 0, j;
      for (j = 0; j < n; j++) {
        var x = curseur - m[j].g * s[j];
        if (j > 0) {
          /* et la règle des 190 unités entre centres par-dessus : deux corps
             qui ne se croisent pas peuvent quand même se frôler */
          var ecart = (x + centre(m[j], s[j])) - (xs[j - 1] + centre(m[j - 1], s[j - 1]));
          var manque = ECART_CENTRES * Math.min(1, (s[j] + s[j - 1]) / 2) - ecart;
          if (manque > 0) x += manque;
        }
        xs.push(x);
        curseur = x + m[j].d * s[j] + air;
      }
      return xs;
    }
    function etendue(xs) {
      return (xs[n - 1] + m[n - 1].d * s[n - 1]) - (xs[0] + m[0].g * s[0]);
    }

    /* 3. on serre jusqu'à ce que la rangée tienne : d'abord l'air entre les
       corps, ensuite l'échelle de tout le monde. On repose à chaque fois,
       parce que rapetisser change aussi l'écart minimal exigé. */
    var air = ECART_BOITES, xs = poser(air);
    var essai;
    for (essai = 0; essai < 8 && etendue(xs) > dispo; essai++) {
      if (air > 2) air = Math.max(2, air - 5);
      else {
        var k = Math.max(.7, dispo / etendue(xs));
        for (i = 0; i < n; i++) s[i] = Math.max(ECHELLE_MIN, s[i] * k);
      }
      xs = poser(air);
    }

    /* 4. on centre la rangée dans la case */
    var gauche = xs[0] + m[0].g * s[0];
    var droite = xs[n - 1] + m[n - 1].d * s[n - 1];
    var decalage = (W - (droite - gauche)) / 2 - gauche;

    return casting.map(function (c, j) {
      /* un personnage assis descend sous son point d'appui : on le remonte
         d'exactement ce que la mesure dit, pas d'une constante */
      var dessous = Math.max(0, m[j].b * s[j]);
      return merge(c, {
        x: Math.round(xs[j] + decalage),
        y: Math.round(sol - dessous),
        s: Math.round(s[j] * 1000) / 1000
      });
    });
  }

  function centre(m, s) { return (m.g + m.d) / 2 * s; }

  /* boîte d'un personnage une fois posé */
  function boitePosee(it) {
    var m = mesurer(it), s = it.s === undefined ? 1 : it.s;
    var g = it.flip ? -m.d : m.g, d = it.flip ? -m.g : m.d;
    return {
      g: it.x + g * s, d: it.x + d * s,
      h: it.y + m.h * s, b: it.y + m.b * s,
      tete: {
        g: it.x + (it.flip ? -m.tete.d : m.tete.g) * s,
        d: it.x + (it.flip ? -m.tete.g : m.tete.d) * s,
        h: it.y + m.tete.h * s, b: it.y + m.tete.b * s
      }
    };
  }

  /* ============================================================
     LE LETTRAGE

     Une bulle cherche sa place. On lui propose des positions — au-dessus,
     décalée d'un côté, plus haut — et on garde la première qui ne couvre
     aucun visage, ne sort pas du cadre, et dont la queue reste courte.
     ============================================================ */

  var QUEUE_MAX = 300;

  function placerBulle(b, boites, iQui, occupe) {
    var taille = Art.mesurerBulle(b);
    var tete = boites[iQui].tete;
    var cx = (tete.g + tete.d) / 2;
    var visages = boites.map(function (bo) { return bo.tete; });

    /* la queue vise le haut du crâne de celui qui parle */
    var tx = cx, ty = tete.h - 4;

    var essais = [];
    [0, -70, 70, -140, 140].forEach(function (dx) {
      [26, 66, 112].forEach(function (dy) {
        essais.push({ x: cx - taille.w / 2 + dx, y: tete.h - dy - taille.h });
      });
    });

    var meilleur = null, meilleurScore = -1e9;
    essais.forEach(function (e) {
      var x = Math.max(MARGE, Math.min(W - MARGE - taille.w, e.x));
      var y = e.y;
      var r = { g: x, d: x + taille.w, h: y, b: y + taille.h };
      var score = 0;
      if (y < 8) score -= 1000 + (8 - y) * 4;            // sort par le haut
      visages.forEach(function (v) { if (chevauchent(r, v, 4)) score -= 600; });
      occupe.forEach(function (o) { if (chevauchent(r, o, 8)) score -= 500; });
      var queue = Math.abs((x + taille.w / 2) - tx) + Math.abs(r.b - ty);
      if (queue > QUEUE_MAX) score -= (queue - QUEUE_MAX) * 3;
      score -= queue * .3;                                // au plus près
      if (score > meilleurScore) { meilleurScore = score; meilleur = r; }
    });

    occupe.push(meilleur);
    return merge(b, {
      x: Math.round(meilleur.g), y: Math.round(meilleur.h),
      tx: Math.round(tx), ty: Math.round(ty)
    });
  }

  /* Un bruitage au-dessus d'une tête, c'est la convention de la BD ; un
     bruitage SUR un visage, c'est un défaut. On le pose donc en biais,
     au-dessus et sur le côté. */
  function placerBruit(f, boites, iQui, occupe) {
    var tete = boites[iQui].tete;
    /* Un bruitage est penché de 8°, et un texte large penché est BEAUCOUP
       plus haut que sa police : « BADABOUM ! » fait 325 unités de large,
       donc l'inclinaison ajoute à elle seule 45 unités de hauteur. Sans ce
       calcul, la boîte estimée passe à côté d'un visage que le dessin
       couvre pour de bon — et le contrôle le signale, à raison. */
    var fs = f.fs || 54;
    var lt = f.t.length * fs * .58;
    var rot = Math.abs(f.rot === undefined ? -8 : f.rot) * Math.PI / 180;
    var bw = lt * Math.cos(rot) + fs * Math.sin(rot);
    var bh = lt * Math.sin(rot) + fs * Math.cos(rot);
    var large = bw / 2 + 6;
    var dessus = bh * .74 + 6, dessous = bh * .30 + 6;
    /* Il faut des échappatoires. Sur une planche à deux personnages bras en
       l'air, toutes les places « juste à côté de la tête » sont prises, et le
       bruitage finit sur un visage — le défaut que le contrôle attrape le
       plus souvent. On lui ouvre donc aussi le ciel, au-dessus de tout le
       monde, où il ne gêne personne. */
    var cx = (tete.g + tete.d) / 2;
    var colonnes = [tete.d + large, tete.g - large, cx,
      tete.d + large * 1.7, tete.g - large * 1.7];
    var etages = [-20, -62, -108, -150, 34];
    var essais = [];
    etages.forEach(function (dy) {
      colonnes.forEach(function (x) { essais.push({ x: x, y: tete.h + dy }); });
    });
    var meilleur = null, meilleurScore = -1e9;
    essais.forEach(function (e) {
      var x = Math.max(MARGE + large, Math.min(W - MARGE - large, e.x));
      var y = Math.max(dessus + 4, e.y);
      var r = { g: x - large, d: x + large, h: y - dessus, b: y + dessous };
      var score = -Math.abs(x - (tete.g + tete.d) / 2) * .2;
      boites.forEach(function (bo) { if (chevauchent(r, bo.tete, 2)) score -= 600; });
      occupe.forEach(function (o) { if (chevauchent(r, o, 6)) score -= 400; });
      if (score > meilleurScore) { meilleurScore = score; meilleur = { x: x, y: y, r: r }; }
    });
    occupe.push(meilleur.r);
    return merge(f, { x: Math.round(meilleur.x), y: Math.round(meilleur.y) });
  }

  /* ============================================================
     COMPOSER

     L'entrée d'une histoire :
       Scene.composer({
         decor: 'jardin', heure: 'jour',
         casting: [ perso, perso, perso ],     // réglages complets + pose
         bulles: [ { qui: 1, t: 'Attends-moi !' } ],
         bruits: [ { qui: 0, t: 'BADABOUM !' } ],
         fond: [...], avant: [...]
       })
     Sortie : une scène prête pour Art.scene, avec x, y, s et le lettrage.
     ============================================================ */
  function composer(d) {
    var casting = (d.casting || []).slice();
    var poses = ranger(casting, {
      sol: d.sol || SOLS[d.decor] || SOL,
      echelle: d.echelle, plafond: d.plafond,
      bulles: (d.bulles && d.bulles.length) || (d.bruits && d.bruits.length)
    });

    var boites = poses.map(boitePosee);
    var occupe = [];
    var bulles = (d.bulles || []).map(function (b) {
      return placerBulle(b, boites, Math.min(b.qui || 0, poses.length - 1), occupe);
    });
    var bruits = (d.bruits || []).map(function (f) {
      return placerBruit(f, boites, Math.min(f.qui || 0, poses.length - 1), occupe);
    });

    var scene = {
      decor: d.decor || 'uni', heure: d.heure, flocons: d.flocons, aurore: d.aurore,
      fond: d.fond, items: poses, avant: d.avant
    };
    if (bulles.length) scene.bulles = bulles;
    if (bruits.length) scene.bruits = bruits;
    return scene;
  }

  /* ============================================================
     LE CONTRÔLE

     Le même outil qui place sait dire ce qui ne va pas — y compris sur une
     planche écrite à la main. Il mesure la planche RÉELLEMENT DESSINÉE,
     pas le modèle qui l'a produite : c'est la seule façon d'attraper les
     défauts qu'on ne voit pas venir.
     ============================================================ */
  function controler(scene) {
    var d = atelierSVG();
    d.innerHTML = Art.scene(scene, {});
    var svg = d.querySelector('svg');
    svg.style.width = W + 'px';
    svg.style.height = H + 'px';
    var base = svg.getBoundingClientRect();
    var defauts = [];

    var elements = [], persos = [];
    Array.prototype.forEach.call(svg.querySelectorAll('[data-t]'), function (n) {
      var b = boite(n, base);
      var e = { t: n.getAttribute('data-t'), rang: n.getAttribute('data-rang'), b: b };
      var tete = n.querySelector('[data-tete]');
      if (tete) { e.tete = boite(tete, base); persos.push(e); }
      elements.push(e);
    });

    /* 1. hors cadre */
    elements.forEach(function (e) {
      var sort = [];
      if (e.b.g < -2) sort.push('à gauche de ' + Math.round(-e.b.g));
      if (e.b.d > W + 2) sort.push('à droite de ' + Math.round(e.b.d - W));
      if (e.b.h < -2) sort.push('en haut de ' + Math.round(-e.b.h));
      if (e.b.b > H + 2) sort.push('en bas de ' + Math.round(e.b.b - H));
      if (sort.length) {
        defauts.push({ type: 'hors-cadre', quoi: e.t, dit: e.t + ' sort du cadre ' + sort.join(', ') });
      }
    });

    /* 2. lettrage sur un visage */
    Array.prototype.forEach.call(svg.querySelectorAll('[data-lettrage]'), function (n) {
      var b = boite(n, base), quoi = n.getAttribute('data-lettrage');
      persos.forEach(function (p) {
        if (chevauchent(b, p.tete)) {
          defauts.push({
            type: 'lettrage-sur-visage', quoi: quoi,
            dit: 'un ' + quoi + ' couvre le visage d\'un ' + p.t
          });
        }
      });
    });

    /* 3. corps qui se chevauchent — seulement entre personnages du même
       rang : un personnage devant un arbre, c'est de la profondeur, deux
       personnages l'un dans l'autre, c'est un défaut */
    for (var i = 0; i < persos.length; i++) {
      for (var j = i + 1; j < persos.length; j++) {
        if (persos[i].rang !== persos[j].rang) continue;
        if (chevauchent(persos[i].b, persos[j].b)) {
          var recouvre = Math.min(persos[i].b.d, persos[j].b.d) - Math.max(persos[i].b.g, persos[j].b.g);
          defauts.push({
            type: 'chevauchement', quoi: persos[i].t + ' / ' + persos[j].t,
            dit: persos[i].t + ' et ' + persos[j].t + ' se chevauchent sur ' + Math.round(recouvre) + ' unités'
          });
        }
      }
    }

    /* 4. une bulle trop loin de celui qui parle */
    (scene.bulles || []).forEach(function (b) {
      if (b.tx === undefined) return;
      var t = Art.mesurerBulle(b);
      var queue = Math.abs((b.x + t.w / 2) - b.tx) + Math.abs((b.y + t.h) - b.ty);
      if (queue > QUEUE_MAX + 40) {
        defauts.push({
          type: 'queue-trop-longue', quoi: b.t,
          dit: 'la queue de « ' + b.t.slice(0, 24) + '… » fait ' + Math.round(queue) + ' unités'
        });
      }
    });

    d.innerHTML = '';
    return defauts;
  }

  global.Scene = {
    composer: composer,
    ranger: ranger,
    mesurer: mesurer,
    boite: boitePosee,
    controler: controler,
    SOL: SOL, SOLS: SOLS, W: W, H: H,
    tailles: TAILLES
  };
})(window);
