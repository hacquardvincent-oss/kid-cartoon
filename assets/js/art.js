/* ============================================================
   art.js — petit moteur de dessin SVG
   Tout est dessiné à la main en SVG : décors, personnages,
   accessoires et bulles de BD. Aucune image externe.
   ============================================================ */
(function (global) {
  'use strict';

  var INK = '#3a2a22';
  var VW = 800, VH = 560;
  var uid = 0;

  /* ---------- utilitaires couleur ---------- */
  function shade(hex, amt) {
    var n = parseInt(hex.slice(1), 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    function f(v) {
      var x = amt < 0 ? v * (1 + amt) : v + (255 - v) * amt;
      return Math.max(0, Math.min(255, Math.round(x)));
    }
    return '#' + ((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1);
  }

  /* ---------- silhouette unifiée ----------
     On dessine deux fois les mêmes formes : d'abord épaissies
     en couleur d'encre (le contour), puis remplies par-dessus.
     Résultat : un contour unique autour de l'union des formes. */
  function U(parts, fill, w) {
    w = w || 9;
    var under = '', over = '', i;
    for (i = 0; i < parts.length; i++) {
      under += parts[i].replace(/%F%/g, INK).replace(/%S%/g,
        'stroke="' + INK + '" stroke-width="' + w + '" stroke-linejoin="round"');
      over += parts[i].replace(/%F%/g, fill).replace(/%S%/g, '');
    }
    return under + over;
  }

  /* ---------- membre (bras / jambe) ---------- */
  function limb(d, color, w) {
    return '<path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="' + (w + 7) +
      '" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="' + w +
      '" stroke-linecap="round" stroke-linejoin="round"/>';
  }

  function line(d, color, w, extra) {
    return '<path d="' + d + '" fill="none" stroke="' + (color || INK) + '" stroke-width="' + (w || 4) +
      '" stroke-linecap="round" stroke-linejoin="round" ' + (extra || '') + '/>';
  }

  function g(tf, inner) { return '<g transform="' + tf + '">' + inner + '</g>'; }

  /* La tête est marquée dans le dessin. C'est ce qui permet à la mise en scène
     de placer une bulle « à côté du visage » sans le deviner : elle mesure la
     vraie boîte de la tête dans le navigateur. */
  function gTete(tf, inner) {
    return '<g data-tete="1" transform="' + tf + '">' + inner + '</g>';
  }

  /* ============================================================
     PERSONNAGES
     Repère local : les pieds sont en (0,0), le personnage
     se dessine vers le haut (y négatif). Hauteur ≈ 230.
     ============================================================ */

  var CHAUSSURE = '#4a3a2e';


  function hand(x, y, teint, r) {
    return '<circle cx="' + x + '" cy="' + y + '" r="' + (r || 11) + '" fill="' + teint +
      '" stroke="' + INK + '" stroke-width="4"/>';
  }


  var COIFFURES = ['couettes', 'tresse', 'deuxtresses', 'longs', 'boucles',
    'carre', 'queue', 'queuehaute'];
  var LISTE_HAUTS = ['robe', 'teeshirt', 'pull'];
  var LISTE_BAS = ['aucun', 'pantalon', 'short', 'jupe'];

  /* ---------- la fabrique enfant : silhouette, coiffure, garde-robe ---------- */
  function cheveuxDe(style, cheveux) {
    var d = shade(cheveux, -0.2);
    var cap = '<path d="M -46,-44 C -48,-88 -26,-104 0,-104 C 26,-104 48,-88 46,-44 C 40,-62 26,-72 8,-74 C -10,-84 -32,-72 -40,-52 Z" fill="%F%" %S%/>';
    if (style === 'tresse') {
      return {
        arriere: U([cap,
          '<path d="M 38,-64 C 62,-56 66,-20 56,10 C 50,26 36,26 32,10 C 24,-18 24,-52 38,-64 Z" fill="%F%" %S%/>'], cheveux, 8),
        devant: line('M 40,-40 q 12,10 6,22 M 42,-14 q 12,10 6,22', d, 3.5)
      };
    }
    if (style === 'deuxtresses') {
      return {
        arriere: U([cap,
          '<path d="M -42,-58 C -66,-46 -68,-6 -58,16 C -52,28 -40,26 -38,12 C -32,-16 -32,-48 -42,-58 Z" fill="%F%" %S%/>',
          '<path d="M 42,-58 C 66,-46 68,-6 58,16 C 52,28 40,26 38,12 C 32,-16 32,-48 42,-58 Z" fill="%F%" %S%/>'], cheveux, 8),
        devant: ''
      };
    }
    if (style === 'longs') {
      return {
        arriere: U([cap,
          '<path d="M -46,-56 C -62,-20 -60,16 -52,34 L 52,34 C 60,16 62,-20 46,-56 Z" fill="%F%" %S%/>'], cheveux, 8),
        devant: ''
      };
    }
    /* boucles en bataille : une masse de boucles + quelques mèches rebelles */
    if (style === 'boucles') {
      return {
        arriere: U([
          '<circle cx="0" cy="-62" r="35" fill="%F%" %S%/>',
          '<circle cx="-45" cy="-52" r="25" fill="%F%" %S%/>',
          '<circle cx="-27" cy="-83" r="26" fill="%F%" %S%/>',
          '<circle cx="5" cy="-93" r="27" fill="%F%" %S%/>',
          '<circle cx="35" cy="-79" r="25" fill="%F%" %S%/>',
          '<circle cx="49" cy="-49" r="24" fill="%F%" %S%/>',
          '<circle cx="-41" cy="-21" r="20" fill="%F%" %S%/>',
          '<circle cx="45" cy="-19" r="20" fill="%F%" %S%/>',
          '<circle cx="-70" cy="-80" r="12" fill="%F%" %S%/>',
          '<circle cx="-25" cy="-121" r="11" fill="%F%" %S%/>',
          '<circle cx="16" cy="-118" r="9" fill="%F%" %S%/>',
          '<circle cx="42" cy="-113" r="13" fill="%F%" %S%/>',
          '<circle cx="70" cy="-84" r="11" fill="%F%" %S%/>',
          '<circle cx="-66" cy="-30" r="11" fill="%F%" %S%/>',
          '<circle cx="66" cy="-26" r="10" fill="%F%" %S%/>',
          '<circle cx="-56" cy="-104" r="10" fill="%F%" %S%/>'
        ], cheveux, 8),
        frange: U([
          '<circle cx="-40" cy="-58" r="15" fill="%F%" %S%/>',
          '<circle cx="-30" cy="-76" r="18" fill="%F%" %S%/>',
          '<circle cx="-4" cy="-85" r="19" fill="%F%" %S%/>',
          '<circle cx="22" cy="-79" r="18" fill="%F%" %S%/>',
          '<circle cx="40" cy="-62" r="15" fill="%F%" %S%/>'
        ], cheveux, 8) +
          line('M -34,-88 q 10,-9 19,-2 M 2,-96 q 11,-8 19,1 M -52,-70 q 7,-11 16,-7', d, 3.5) +
          line('M -56,-30 q -11,-9 -6,-20 M 58,-32 q 11,-9 6,-20', d, 3.5),
        devant: ''
      };
    }
    /* cheveux lisses coupés au carré : une masse nette qui encadre le visage */
    if (style === 'carre') {
      return {
        arriere: U(['<path d="M -52,-46 C -52,-98 -28,-110 0,-110 C 28,-110 52,-98 52,-46 L 52,-4 L -52,-4 Z" fill="%F%" %S%/>'], cheveux, 8),
        frange: U(['<path d="M -45,-62 C -47,-98 -25,-108 0,-108 C 25,-108 47,-98 45,-62 Z" fill="%F%" %S%/>'], cheveux, 8) +
          line('M -36,-76 q 36,-11 72,0', d, 3),
        devant: ''
      };
    }
    /* cheveux lisses tirés en arrière, noués en queue de cheval */
    if (style === 'queue' || style === 'queuehaute') {
      var haute = style === 'queuehaute';
      var ax = haute ? 28 : 50, ay = haute ? -102 : -66;
      var tresse = haute
        ? '<path d="M 26,-104 C 60,-124 90,-106 88,-72 C 87,-52 71,-47 65,-61 C 57,-81 40,-95 26,-104 Z" fill="%F%" %S%/>'
        : '<path d="M 46,-78 C 84,-76 96,-34 82,-6 C 74,10 58,8 56,-6 C 52,-38 38,-64 46,-78 Z" fill="%F%" %S%/>';
      return {
        arriere: U([cap, tresse], cheveux, 8) +
          '<circle cx="' + ax + '" cy="' + ay + '" r="8.5" fill="' + d +
          '" stroke="' + INK + '" stroke-width="3.5"/>',
        devant: ''
      };
    }
    // couettes (pigtails)
    return {
      arriere: U([cap,
        '<circle cx="-54" cy="-42" r="19" fill="%F%" %S%/>',
        '<circle cx="54" cy="-42" r="19" fill="%F%" %S%/>'], cheveux, 8),
      devant: ''
    };
  }

  function teteEnfant(o) {
    var teint = o.teint, cheveux = o.cheveux, humeur = o.humeur || 'content';
    var H = cheveuxDe(o.coiffure || 'couettes', cheveux);
    var s = H.arriere;
    s += U(['<ellipse cx="0" cy="-46" rx="42" ry="44" fill="%F%" %S%/>'], teint, 9);
    // frange
    s += H.frange || U(['<path d="M -42,-52 C -44,-88 -24,-100 0,-100 C 24,-100 44,-88 42,-52 C 34,-70 20,-78 4,-76 C -14,-84 -34,-72 -42,-52 Z" fill="%F%" %S%/>'], cheveux, 8);
    s += H.devant;
    if (humeur === 'dort') {
      s += line('M -24,-46 q 9,8 18,0', INK, 4) + line('M 6,-46 q 9,8 18,0', INK, 4);
    } else {
      var r = humeur === 'surpris' ? 8 : 6.5;
      s += '<circle cx="-15" cy="-48" r="' + r + '" fill="' + INK + '"/><circle cx="15" cy="-48" r="' + r + '" fill="' + INK + '"/>' +
        '<circle cx="-12.5" cy="-51" r="2.4" fill="#fff"/><circle cx="17.5" cy="-51" r="2.4" fill="#fff"/>';
    }
    if (humeur === 'fache') s += line('M -30,-62 L -6,-54 M 30,-62 L 6,-54', INK, 4.5);
    s += '<circle cx="-28" cy="-30" r="8.5" fill="#f79cb0" opacity=".75"/><circle cx="28" cy="-30" r="8.5" fill="#f79cb0" opacity=".75"/>';
    if (humeur === 'surpris') s += '<ellipse cx="0" cy="-22" rx="8" ry="10" fill="#b8355c" stroke="' + INK + '" stroke-width="3.5"/>';
    else if (humeur === 'triste' || humeur === 'fache') s += line('M -12,-18 q 12,-10 24,0', INK, 4);
    else s += line('M -14,-26 q 14,16 28,0', INK, 4.5);
    if (o.lunettes) {
      s += '<circle cx="-15" cy="-48" r="14" fill="none" stroke="' + INK + '" stroke-width="4"/>' +
        '<circle cx="15" cy="-48" r="14" fill="none" stroke="' + INK + '" stroke-width="4"/>' +
        line('M -1,-48 L 1,-48', INK, 4) +
        line('M -29,-50 L -42,-54 M 29,-50 L 42,-54', INK, 3.5);
    }
    if (o.couronne) {
      s += U(['<path d="M -26,-92 L -30,-118 L -12,-104 L 0,-124 L 12,-104 L 30,-118 L 26,-92 Z" fill="%F%" %S%/>'], o.couronne, 7);
    }
    if (o.noeuds) {
      s += '<circle cx="-54" cy="-64" r="9" fill="' + o.noeuds + '" stroke="' + INK + '" stroke-width="3.5"/>' +
        '<circle cx="54" cy="-64" r="9" fill="' + o.noeuds + '" stroke="' + INK + '" stroke-width="3.5"/>';
    }
    if (o.barrette) {
      s += U(['<path d="M -46,-92 L -66,-102 L -66,-82 Z" fill="%F%" %S%/>',
        '<path d="M -46,-92 L -26,-102 L -26,-82 Z" fill="%F%" %S%/>',
        '<circle cx="-46" cy="-92" r="6" fill="%F%" %S%/>'], o.barrette, 7);
    }
    return s;
  }

  /* ------------------------------------------------------------
     LA GARDE-ROBE

     Un vêtement posé sur un membre, c'est le MÊME tracé redessiné, dont on
     ne montre que le début : `pathLength="100"` normalise la longueur, donc
     `part` est un pourcentage. Une manche courte, c'est 34 ; un pantalon,
     c'est 86. Et surtout : ça marche dans n'importe quelle pose, sans avoir
     à couper une courbe de Bézier à la main — ce qui aurait voulu dire un
     vêtement par pose, et neuf occasions de se tromper.

     Le bout coupé garde son bouchon rond d'encre : c'est l'ourlet.
     ------------------------------------------------------------ */
  function membreHabille(d, couleur, w, part) {
    var coupe = ' pathLength="100" stroke-dasharray="' + part + ' 100"';
    return '<path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="' + (w + 7) +
      '" stroke-linecap="round" stroke-linejoin="round"' + coupe + '/>' +
      '<path d="' + d + '" fill="none" stroke="' + couleur + '" stroke-width="' + w +
      '" stroke-linecap="round" stroke-linejoin="round"' + coupe + '/>';
  }

  function chaussure(x, y, rot) {
    return '<ellipse cx="' + x + '" cy="' + y + '" rx="15" ry="9" fill="' + CHAUSSURE +
      '" stroke="' + INK + '" stroke-width="4"' +
      (rot ? ' transform="rotate(' + rot + ' ' + x + ' ' + y + ')"' : '') + '/>';
  }

  /* Les tracés des membres, sortis des fonctions : le vêtement a besoin de
     les redessiner, et deux copies d'un même tracé finissent toujours par
     diverger. */
  var BRAS_ENFANT = {
    debout: { g: 'M -26,-124 C -48,-116 -60,-104 -62,-90', d: 'M 26,-124 C 48,-116 60,-104 62,-90',
      mg: [-64, -86, 10], md: [64, -86, 10] },
    salue: { g: 'M -26,-124 C -48,-116 -60,-104 -62,-90', d: 'M 26,-126 C 56,-136 80,-158 86,-182',
      mg: [-64, -86, 10], md: [90, -188, 11] },
    brasenlair: { g: 'M -26,-124 C -56,-136 -80,-158 -86,-182', d: 'M 26,-124 C 56,-136 80,-158 86,-182',
      mg: [-90, -188, 10], md: [90, -188, 10] },
    montre: { g: 'M -26,-124 C -48,-114 -58,-100 -60,-88', d: 'M 26,-126 C 54,-130 76,-138 96,-146',
      mg: [-62, -84, 10], md: [100, -148, 10] },
    tient: { g: 'M -26,-124 C -46,-120 -58,-112 -58,-100', d: 'M 26,-124 C 46,-120 58,-112 58,-100',
      mg: [-60, -96, 10], md: [60, -96, 10] },
    magie: { g: 'M -26,-124 C -52,-132 -72,-146 -80,-164', d: 'M 26,-126 C 52,-134 74,-150 82,-168',
      mg: [-84, -170, 10], md: [86, -174, 10] },
    nage: { g: 'M -26,-124 C -50,-134 -66,-132 -78,-126', d: 'M 26,-124 C 50,-134 66,-132 78,-126',
      mg: [-82, -124, 10], md: [82, -124, 10] },
    hausse: { g: 'M -26,-126 C -50,-132 -66,-126 -72,-116', d: 'M 26,-126 C 50,-132 66,-126 72,-116',
      mg: [-76, -114, 10], md: [76, -114, 10] }
  };
  BRAS_ENFANT.saute = BRAS_ENFANT.brasenlair;

  var JAMBES_ENFANT = {
    debout: { g: 'M -13,-58 L -13,-16', d: 'M 13,-58 L 13,-16',
      pieds: chaussure(-15, -11) + chaussure(15, -11), hanche: [0, -58] },
    saute: { g: 'M -12,-58 C -24,-40 -38,-32 -48,-28', d: 'M 12,-58 C 24,-40 38,-34 48,-30',
      pieds: chaussure(-52, -26, -25) + chaussure(52, -28, 25), hanche: [0, -58] },
    court: { g: 'M -10,-58 C -22,-42 -32,-24 -34,-12', d: 'M 10,-58 C 20,-44 24,-28 22,-12',
      pieds: chaussure(-38, -9) + chaussure(26, -9), hanche: [0, -58] },
    assis: { g: 'M -6,-24 C 20,-24 40,-22 46,-6 C 49,4 50,16 50,26',
      d: 'M 6,-16 C 32,-16 54,-14 60,2 C 63,12 64,22 64,32',
      pieds: chaussure(54, 30) + chaussure(68, 36), hanche: [-2, -22] },
    nage: { pieds: '', hanche: [0, -58] }
  };

  /* Le haut : trois coupes, qui se distinguent à l'ourlet et à la manche.
     `part` est la longueur de manche. */
  var HAUTS = {
    robe: { d: 'M -28,-138 C -34,-112 -46,-80 -50,-56 L 50,-56 C 46,-80 34,-112 28,-138 Z',
      ourlet: -64, bordX: 47, manche: 34 },
    teeshirt: { d: 'M -28,-138 C -32,-118 -35,-98 -36,-80 L 36,-80 C 35,-98 32,-118 28,-138 Z',
      ourlet: -88, bordX: 33, manche: 34 },
    pull: { d: 'M -29,-140 C -34,-118 -38,-98 -39,-78 L 39,-78 C 38,-98 34,-118 29,-140 Z',
      ourlet: -86, bordX: 36, manche: 86 }
  };

  /* Le bas : la hanche est un morceau plein posé au sommet des jambes, et
     les jambes sont rhabillées sur une partie de leur longueur. La jupe,
     elle, n'habille pas les jambes du tout. */
  var BAS = {
    pantalon: { hanche: 'M -22,-84 L 22,-84 L 21,-50 L -21,-50 Z', part: 84 },
    short: { hanche: 'M -23,-84 L 23,-84 L 24,-46 L -24,-46 Z', part: 38 },
    jupe: { hanche: 'M -25,-84 L 25,-84 L 46,-44 L -46,-44 Z', part: 0 }
  };

  function brasEnfant(pose, teint, manche) {
    var b = BRAS_ENFANT[pose] || BRAS_ENFANT.debout;
    var s = limb(b.g, teint, 12) + limb(b.d, teint, 12);
    if (manche && manche.part) {
      s += membreHabille(b.g, manche.couleur, 15, manche.part) +
        membreHabille(b.d, manche.couleur, 15, manche.part);
    }
    return s + hand(b.mg[0], b.mg[1], teint, b.mg[2]) + hand(b.md[0], b.md[1], teint, b.md[2]);
  }

  function jambesEnfant(pose, teint, bas) {
    var j = JAMBES_ENFANT[pose] || JAMBES_ENFANT.debout;
    if (!j.g) return '';
    var s = limb(j.g, teint, 14) + limb(j.d, teint, 14);
    if (bas && BAS[bas.coupe] && BAS[bas.coupe].part) {
      var part = BAS[bas.coupe].part;
      s += membreHabille(j.g, bas.couleur, 17, part) +
        membreHabille(j.d, bas.couleur, 17, part);
    }
    return s + j.pieds;
  }

  /* La même fabrique sert à l'enfant et à l'adulte : ce qui les sépare, ce
     n'est pas la taille — le placement automatique s'en charge — mais la
     proportion de la tête. Un enfant a une grosse tête, un adulte non.
     Rétrécir la tête de 14 % suffit à faire basculer la lecture. */
  function enfant(o) {
    o = o || {};
    var teint = o.teint || '#f6cba6';
    var cheveux = o.cheveux || '#7b4a2d';
    var vetement = o.vetement || '#3ec9c9';
    var H = HAUTS[o.haut] || HAUTS.robe;
    /* on habille le bas d'abord, le haut par-dessus : une robe sur un
       pantalon, c'est une tenue d'enfant, et l'ordre suffit à la dessiner */
    var pose = o.pose || 'debout';
    var bas = (BAS[o.bas] && pose !== 'nage')
      ? { coupe: o.bas, couleur: o.couleurBas || shade(vetement, -0.34) } : null;
    var assis = pose === 'assis';
    var k = o.adulte ? 0.86 : 1;
    var s = '';
    if (pose !== 'nage') s += jambesEnfant(pose, teint, bas);
    var t = brasEnfant(pose, teint, { couleur: vetement, part: H.manche });
    if (bas && BAS[bas.coupe]) {
      t += U(['<path d="' + BAS[bas.coupe].hanche + '" fill="%F%" %S%/>'], bas.couleur, 8);
    }
    t += U(['<path d="' + H.d + '" fill="%F%" %S%/>'], vetement, 9);
    if (o.bord) t += line('M ' + (-H.bordX) + ',' + H.ourlet + ' L ' + H.bordX + ',' + H.ourlet, o.bord, 5);
    t += line('M -20,-136 q 20,16 40,0', shade(vetement, -0.25), 4);
    var tete = 'translate(0,-130)' + (k !== 1 ? ' scale(' + k + ')' : '');
    t += gTete(tete, teteEnfant({
      teint: teint, cheveux: cheveux, coiffure: o.coiffure, humeur: o.humeur,
      couronne: o.couronne, noeuds: o.noeuds, barrette: o.barrette, lunettes: o.lunettes
    }));
    if (o.chapeau) t += g(tete, chapeauSoleil(o.chapeau));
    return s + (assis ? g('translate(-6,42)', t) : t);
  }

  /* ---------- le petit frère : un bébé, donc une grosse tête ---------- */
  function teteBebe(o) {
    var teint = o.teint, cheveux = o.cheveux, humeur = o.humeur || 'content';
    var s = U(['<ellipse cx="0" cy="-30" rx="40" ry="38" fill="%F%" %S%/>'], teint, 9);
    /* les cheveux sont très courts : une calotte posée sur le haut du crâne */
    s += U(['<path d="M -37,-36 C -41,-66 41,-66 37,-36 C 26,-54 -26,-54 -37,-36 Z" fill="%F%" %S%/>'], cheveux, 6);
    s += line('M 2,-62 q 10,-10 17,-1', shade(cheveux, -0.25), 4);
    if (humeur === 'dort') {
      s += line('M -22,-32 q 8,8 16,0', INK, 4) + line('M 6,-32 q 8,8 16,0', INK, 4);
    } else {
      var r = humeur === 'surpris' ? 8.5 : 7;
      s += '<circle cx="-14" cy="-32" r="' + r + '" fill="' + INK + '"/>' +
        '<circle cx="14" cy="-32" r="' + r + '" fill="' + INK + '"/>' +
        '<circle cx="-11.5" cy="-35" r="2.6" fill="#fff"/><circle cx="16.5" cy="-35" r="2.6" fill="#fff"/>';
    }
    if (humeur === 'fache') s += line('M -26,-46 L -4,-39 M 26,-46 L 4,-39', INK, 4);
    s += '<circle cx="-26" cy="-18" r="9" fill="#f79cb0" opacity=".75"/>' +
      '<circle cx="26" cy="-18" r="9" fill="#f79cb0" opacity=".75"/>';
    if (humeur === 'surpris') s += '<ellipse cx="0" cy="-10" rx="8" ry="9" fill="#b8355c" stroke="' + INK + '" stroke-width="3.5"/>';
    else if (humeur === 'triste' || humeur === 'fache') s += line('M -11,-6 q 11,-9 22,0', INK, 4);
    else s += line('M -13,-14 q 13,14 26,0', INK, 4.5);
    return s;
  }

  function bebe(o) {
    o = o || {};
    var teint = o.teint || '#f6cba6';
    var cheveux = o.cheveux || '#f0be48';
    var vetement = o.vetement || '#8ec9f0';
    var pose = o.pose || 'debout';
    var assis = pose === 'assis' || pose === 'quatrepattes';
    var s = '';

    /* jambes courtes, pieds nus */
    if (pose === 'quatrepattes') {
      s += limb('M -14,-46 C -22,-32 -30,-22 -34,-14', teint, 15) +
        limb('M 14,-44 C 22,-30 28,-20 30,-12', teint, 15) +
        '<ellipse cx="-38" cy="-10" rx="12" ry="8" fill="' + teint + '" stroke="' + INK + '" stroke-width="4"/>' +
        '<ellipse cx="34" cy="-9" rx="12" ry="8" fill="' + teint + '" stroke="' + INK + '" stroke-width="4"/>';
    } else if (assis) {
      s += limb('M -6,-22 C 16,-22 32,-18 36,-6', teint, 15) +
        limb('M 8,-14 C 30,-14 46,-10 50,2', teint, 15) +
        '<ellipse cx="42" cy="-4" rx="12" ry="8" fill="' + teint + '" stroke="' + INK + '" stroke-width="4"/>' +
        '<ellipse cx="56" cy="4" rx="12" ry="8" fill="' + teint + '" stroke="' + INK + '" stroke-width="4"/>';
    } else if (pose === 'saute') {
      /* un bébé qui saute décolle à peine : deux pieds à dix unités du sol,
         et c'est déjà un exploit */
      s += limb('M -12,-46 C -20,-36 -28,-32 -34,-30', teint, 16) +
        limb('M 12,-46 C 20,-36 28,-34 34,-32', teint, 16) +
        '<ellipse cx="-38" cy="-29" rx="13" ry="8" fill="' + teint + '" stroke="' + INK + '" stroke-width="4" transform="rotate(-22 -38 -29)"/>' +
        '<ellipse cx="38" cy="-31" rx="13" ry="8" fill="' + teint + '" stroke="' + INK + '" stroke-width="4" transform="rotate(22 38 -31)"/>';
    } else if (pose === 'court') {
      /* la course d'un petit qui apprend : les jambes partent devant */
      s += limb('M -10,-42 C -18,-32 -24,-20 -26,-12', teint, 16) +
        limb('M 10,-42 C 16,-32 18,-22 17,-12', teint, 16) +
        '<ellipse cx="-30" cy="-9" rx="13" ry="8" fill="' + teint + '" stroke="' + INK + '" stroke-width="4"/>' +
        '<ellipse cx="20" cy="-9" rx="13" ry="8" fill="' + teint + '" stroke="' + INK + '" stroke-width="4"/>';
    } else {
      s += limb('M -12,-42 L -13,-14', teint, 16) + limb('M 12,-42 L 13,-14', teint, 16) +
        '<ellipse cx="-15" cy="-10" rx="13" ry="8" fill="' + teint + '" stroke="' + INK + '" stroke-width="4"/>' +
        '<ellipse cx="15" cy="-10" rx="13" ry="8" fill="' + teint + '" stroke="' + INK + '" stroke-width="4"/>';
    }

    var t = '';
    if (pose === 'brasenlair' || pose === 'porte' || pose === 'saute') {
      t += limb('M -22,-92 C -42,-104 -54,-122 -56,-138', teint, 12) +
        limb('M 22,-92 C 42,-104 54,-122 56,-138', teint, 12) +
        hand(-58, -142, teint, 10) + hand(58, -142, teint, 10);
    } else if (pose === 'salue') {
      t += limb('M -22,-92 C -38,-86 -46,-76 -48,-66', teint, 12) +
        limb('M 22,-94 C 44,-106 58,-124 60,-142', teint, 12) +
        hand(-50, -62, teint, 10) + hand(62, -146, teint, 10);
    } else if (pose === 'tient') {
      t += limb('M -22,-92 C -38,-88 -46,-80 -46,-70', teint, 12) +
        limb('M 22,-92 C 38,-88 46,-80 46,-70', teint, 12) +
        hand(-48, -66, teint, 10) + hand(48, -66, teint, 10);
    } else if (pose === 'quatrepattes') {
      t += limb('M -22,-90 C -40,-76 -50,-52 -52,-30', teint, 12) +
        limb('M 22,-90 C 40,-76 50,-52 52,-30', teint, 12) +
        hand(-54, -22, teint, 10) + hand(54, -22, teint, 10);
    } else if (pose === 'montre') {
      /* montrer du doigt : le premier geste avant les mots, et le seul
         qui compte vraiment dans une histoire */
      t += limb('M -22,-92 C -38,-84 -46,-74 -48,-64', teint, 12) +
        limb('M 22,-94 C 42,-98 60,-102 76,-106', teint, 12) +
        hand(-50, -60, teint, 10) + hand(80, -108, teint, 10);
    } else if (pose === 'hausse') {
      t += limb('M -22,-94 C -40,-100 -52,-96 -56,-88', teint, 12) +
        limb('M 22,-94 C 40,-100 52,-96 56,-88', teint, 12) +
        hand(-58, -85, teint, 10) + hand(58, -85, teint, 10);
    } else if (pose === 'court') {
      t += limb('M -22,-92 C -40,-96 -50,-88 -52,-78', teint, 12) +
        limb('M 22,-92 C 40,-96 50,-88 52,-78', teint, 12) +
        hand(-54, -74, teint, 10) + hand(54, -74, teint, 10);
    } else {
      t += limb('M -22,-92 C -38,-84 -46,-74 -48,-64', teint, 12) +
        limb('M 22,-92 C 38,-84 46,-74 48,-64', teint, 12) +
        hand(-50, -60, teint, 10) + hand(50, -60, teint, 10);
    }

    /* la grenouillère */
    t += U(['<path d="M -26,-104 C -33,-80 -35,-56 -31,-38 L 31,-38 C 35,-56 33,-80 26,-104 Z" fill="%F%" %S%/>'], vetement, 9);
    if (o.bord) t += line('M -33,-52 L 33,-52', o.bord, 5);
    t += gTete('translate(0,-100)', teteBebe({ teint: teint, cheveux: cheveux, humeur: o.humeur }));
    if (o.chapeau) t += g('translate(0,-100) scale(.8)', chapeauSoleil(o.chapeau));
    return s + (assis ? g('translate(-4,' + (pose === 'quatrepattes' ? 22 : 34) + ')', t) : t);
  }

  function chapeauSoleil(color) {
    return U([
      '<ellipse cx="0" cy="-84" rx="66" ry="14" fill="%F%" %S%/>',
      '<path d="M -34,-84 C -34,-116 -18,-126 0,-126 C 18,-126 34,-116 34,-84 Z" fill="%F%" %S%/>'
    ], color, 8) + line('M -32,-92 q 32,10 64,0', shade(color, -0.3), 5);
  }

  /* ---------- la fabrique animal : chien, chat, ours, lapin ---------- */
  function patte(x, y, poil, r) {
    r = r || 12;
    return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + poil +
      '" stroke="' + INK + '" stroke-width="4"/>';
  }

  function pattesAnimal(pose, poil, clair) {
    var pied = function (x, y, rot) {
      return '<ellipse cx="' + x + '" cy="' + y + '" rx="17" ry="10" fill="' + clair +
        '" stroke="' + INK + '" stroke-width="4"' + (rot ? ' transform="rotate(' + rot + ' ' + x + ' ' + y + ')"' : '') + '/>';
    };
    if (pose === 'saute') {
      return limb('M -14,-62 C -26,-44 -40,-34 -50,-30', poil, 16) +
        limb('M 14,-62 C 26,-44 40,-36 50,-32', poil, 16) + pied(-54, -28, -25) + pied(54, -30, 25);
    }
    if (pose === 'court') {
      return limb('M -12,-60 C -24,-44 -34,-24 -36,-12', poil, 16) +
        limb('M 12,-60 C 22,-46 26,-28 24,-12', poil, 16) + pied(-40, -9) + pied(28, -9);
    }
    if (pose === 'assis') {
      return limb('M -6,-24 C 22,-24 42,-22 48,-6 C 51,4 52,16 52,26', poil, 16) +
        limb('M 6,-16 C 34,-16 56,-14 62,2 C 65,12 66,22 66,32', poil, 16) + pied(56, 30) + pied(70, 36);
    }
    if (pose === 'nage') return '';
    return limb('M -15,-60 L -15,-14', poil, 16) + limb('M 15,-60 L 15,-14', poil, 16) +
      pied(-17, -10) + pied(17, -10);
  }

  function brasAnimal(pose, poil) {
    if (pose === 'salue') {
      return limb('M -26,-124 C -54,-116 -68,-104 -70,-90', poil, 14) +
        limb('M 26,-126 C 62,-138 90,-158 96,-184', poil, 14) + patte(-72, -86, poil) + patte(100, -190, poil, 13);
    }
    if (pose === 'brasenlair' || pose === 'saute') {
      return limb('M -28,-124 C -60,-138 -86,-160 -92,-184', poil, 14) +
        limb('M 28,-124 C 60,-138 86,-160 92,-184', poil, 14) + patte(-96, -190, poil) + patte(96, -190, poil);
    }
    if (pose === 'montre') {
      return limb('M -26,-124 C -54,-114 -68,-100 -70,-88', poil, 14) +
        limb('M 26,-126 C 58,-132 84,-140 104,-148', poil, 14) + patte(-72, -84, poil) + patte(108, -150, poil);
    }
    if (pose === 'tient') {
      return limb('M -26,-124 C -52,-120 -66,-110 -68,-98', poil, 14) +
        limb('M 26,-124 C 52,-120 66,-110 68,-98', poil, 14) + patte(-70, -94, poil) + patte(70, -94, poil);
    }
    if (pose === 'nage') {
      return limb('M -28,-124 C -52,-134 -68,-132 -80,-126', poil, 14) +
        limb('M 28,-124 C 52,-134 68,-132 80,-126', poil, 14) + patte(-84, -124, poil) + patte(84, -124, poil);
    }
    if (pose === 'hausse') {
      return limb('M -26,-126 C -56,-132 -74,-124 -80,-114', poil, 14) +
        limb('M 26,-126 C 56,-132 74,-124 80,-114', poil, 14) + patte(-84, -112, poil) + patte(84, -112, poil);
    }
    return limb('M -26,-124 C -54,-116 -68,-104 -70,-90', poil, 14) +
      limb('M 26,-124 C 54,-116 68,-104 70,-90', poil, 14) + patte(-72, -86, poil) + patte(72, -86, poil);
  }

  /* Les oreilles font l'espèce plus sûrement que tout le reste : les mêmes
     corps et le même museau donnent un chien, un chat, un ours ou un lapin
     selon ce qu'on pose sur le crâne. */
  var OREILLES = {
    pointues: ['<path d="M -36,-72 L -47,-118 L -8,-90 Z" fill="%F%" %S%/>',
      '<path d="M 10,-80 L 27,-122 L 42,-82 Z" fill="%F%" %S%/>'],
    rondes: ['<circle cx="-34" cy="-80" r="21" fill="%F%" %S%/>',
      '<circle cx="30" cy="-86" r="21" fill="%F%" %S%/>'],
    tombantes: ['<ellipse cx="-42" cy="-56" rx="16" ry="30" transform="rotate(-16 -42 -56)" fill="%F%" %S%/>',
      '<ellipse cx="36" cy="-62" rx="16" ry="30" transform="rotate(14 36 -62)" fill="%F%" %S%/>'],
    longues: ['<ellipse cx="-26" cy="-116" rx="14" ry="36" transform="rotate(-12 -26 -116)" fill="%F%" %S%/>',
      '<ellipse cx="20" cy="-122" rx="14" ry="36" transform="rotate(10 20 -122)" fill="%F%" %S%/>']
  };

  function teteAnimal(o) {
    var poil = o.poil, clair = o.clair, masque = o.masque;
    var humeur = o.humeur || 'content';
    var forme = OREILLES[o.oreilles] ? o.oreilles : 'pointues';
    var s = U(OREILLES[forme].concat([
      '<ellipse cx="0" cy="-50" rx="43" ry="40" fill="%F%" %S%/>',
      '<ellipse cx="47" cy="-30" rx="27" ry="20" fill="%F%" %S%/>'
    ]), poil, 9);

    /* le masque foncé est optionnel : sans lui, l'animal reste neutre */
    if (masque) {
      s += '<path d="M -42,-58 C -41,-84 -22,-94 0,-94 C 22,-94 41,-82 43,-52 ' +
        'C 32,-68 12,-66 -4,-60 C -20,-54 -33,-54 -42,-58 Z" fill="' + masque + '"/>';
      if (forme === 'pointues') {
        s += '<path d="M -36,-72 L -47,-118 L -20,-98 Z" fill="' + masque + '"/>';
        s += '<path d="M 18,-92 L 27,-122 L 38,-90 Z" fill="' + masque + '"/>';
      }
    }

    /* museau clair */
    s += '<ellipse cx="47" cy="-30" rx="26" ry="19" fill="' + clair + '"/>';
    s += '<ellipse cx="70" cy="-36" rx="9.5" ry="7.5" fill="' + INK + '"/>';
    s += line('M 66,-28 q 4,10 -6,12', INK, 3.5);

    /* yeux, bien au-dessus du museau */
    s += '<circle cx="12" cy="-62" r="12" fill="#fff" stroke="' + INK + '" stroke-width="3.5"/>' +
      '<circle cx="37" cy="-58" r="12" fill="#fff" stroke="' + INK + '" stroke-width="3.5"/>';
    if (humeur === 'dort') {
      s += line('M 4,-62 q 8,7 16,0', INK, 4) + line('M 29,-58 q 8,7 16,0', INK, 4);
    } else if (humeur === 'surpris') {
      s += '<circle cx="14" cy="-62" r="6" fill="' + INK + '"/><circle cx="39" cy="-58" r="6" fill="' + INK + '"/>';
    } else {
      s += '<circle cx="16" cy="-61" r="5.2" fill="' + INK + '"/><circle cx="41" cy="-57" r="5.2" fill="' + INK + '"/>';
    }
    if (humeur === 'fache') s += line('M 2,-78 L 24,-70 M 48,-76 L 30,-68', INK, 4.5);
    if (humeur === 'content' || humeur === 'surpris') {
      s += '<path d="M 40,-18 q 9,12 19,3" fill="#e07a8a" stroke="' + INK + '" stroke-width="3"/>';
    } else if (humeur === 'triste' || humeur === 'fache') {
      s += line('M 38,-12 q 10,-9 20,-2', INK, 4);
    }
    return s;
  }

  function animal(o) {
    o = o || {};
    var poil = o.poil || '#7aa6d8';
    var clair = o.clair || '#dbe8f5';
    var pose = o.pose || 'debout';
    var assis = pose === 'assis';
    var s = '';
    if (pose !== 'nage') s += pattesAnimal(pose, poil, clair);

    /* la queue, derrière : dressée par défaut, ou courte et ronde */
    var t = '';
    if (o.queue === 'pompon') {
      t += '<circle cx="-42" cy="-102" r="14" fill="' + clair + '" stroke="' + INK + '" stroke-width="4"/>';
    } else if (o.queue !== 'aucune') {
      t += line('M -32,-92 C -64,-96 -80,-118 -76,-140', poil, 15) +
        '<circle cx="-76" cy="-144" r="9" fill="' + clair + '" stroke="' + INK + '" stroke-width="4"/>';
    }
    t += brasAnimal(pose, poil);
    t += U(['<path d="M -29,-142 C -36,-114 -38,-78 -34,-52 L 34,-52 C 38,-78 36,-114 29,-142 Z" fill="%F%" %S%/>'], poil, 9);
    t += '<ellipse cx="4" cy="-82" rx="23" ry="30" fill="' + clair + '"/>';
    if (o.taches) {
      t += '<circle cx="-24" cy="-108" r="8" fill="' + shade(poil, -0.2) + '"/>' +
        '<circle cx="26" cy="-120" r="6" fill="' + shade(poil, -0.2) + '"/>' +
        '<circle cx="-30" cy="-68" r="5" fill="' + shade(poil, -0.2) + '"/>';
    }
    t += gTete('translate(0,-136)', teteAnimal({
      poil: poil, clair: clair, masque: o.masque, oreilles: o.oreilles, humeur: o.humeur
    }));
    if (o.chapeau) t += g('translate(0,-136)', chapeauSoleil(o.chapeau));
    return s + (assis ? g('translate(-6,44)', t) : t);
  }

  /* ---------- le personnage rond ----------
     La silhouette des doudous, des peluches et des amis imaginaires.
     Le principe : un gros corps, une tête plus petite POSÉE DESSUS, et
     deux oreilles — le tout passé d'un seul coup dans U(), qui n'en fait
     qu'une cacahuète sans aucun trait de construction. C'est ce qui la
     distingue d'un corps-visage sans cou : ici la tête existe.
     Les membres sont dans la couleur du corps, comme un jouet cousu. */
  var RONDS = {
    rond: { d: '<circle cx="0" cy="-110" r="68" fill="%F%" %S%/>', larg: 64 },
    ovale: { d: '<ellipse cx="0" cy="-114" rx="54" ry="74" fill="%F%" %S%/>', larg: 51 },
    poire: {
      d: '<path d="M 0,-186 C 30,-186 42,-166 39,-144 C 36,-122 66,-104 62,-82 ' +
        'C 58,-54 32,-42 0,-42 C -32,-42 -58,-54 -62,-82 C -66,-104 -36,-122 -39,-144 ' +
        'C -42,-166 -30,-186 0,-186 Z" fill="%F%" %S%/>', larg: 54
    },
    carre: { d: '<rect x="-62" y="-180" width="124" height="138" rx="34" fill="%F%" %S%/>', larg: 60 }
  };

  /* la tête est un disque de rayon 44 centré en -190 ; ce décalage permet de
     réutiliser tels quels les accessoires dessinés pour la fabrique enfant */
  var RONDTETE = -144;

  function piedRond(x, y, c, rot) {
    return '<ellipse cx="' + x + '" cy="' + y + '" rx="19" ry="11" fill="' + shade(c, -0.18) +
      '" stroke="' + INK + '" stroke-width="4"' +
      (rot ? ' transform="rotate(' + rot + ' ' + x + ' ' + y + ')"' : '') + '/>';
  }

  function jambesRond(pose, c) {
    if (pose === 'saute') {
      return limb('M -22,-52 C -34,-38 -46,-32 -56,-28', c, 17) +
        limb('M 22,-52 C 34,-38 46,-34 56,-30', c, 17) +
        piedRond(-60, -26, c, -25) + piedRond(60, -28, c, 25);
    }
    if (pose === 'court') {
      return limb('M -20,-50 C -30,-38 -40,-24 -42,-13', c, 17) +
        limb('M 20,-50 C 28,-38 32,-26 30,-13', c, 17) +
        piedRond(-46, -10, c) + piedRond(34, -10, c);
    }
    if (pose === 'assis') {
      return limb('M -8,-24 C 18,-24 38,-22 44,-8 C 47,2 48,14 48,24', c, 17) +
        limb('M 8,-16 C 34,-16 54,-14 60,0 C 63,10 64,20 64,30', c, 17) +
        piedRond(52, 28, c) + piedRond(66, 34, c);
    }
    return limb('M -22,-52 L -22,-16', c, 17) + limb('M 22,-52 L 22,-16', c, 17) +
      piedRond(-24, -11, c) + piedRond(24, -11, c);
  }

  /* les bras partent du flanc, à hauteur de poitrine ; L est la demi-largeur
     du corps, qui change avec la forme */
  function brasRond(pose, c, L) {
    var y = -128;
    function m(x, yy) {
      return '<circle cx="' + x + '" cy="' + yy + '" r="13" fill="' + c +
        '" stroke="' + INK + '" stroke-width="4.5"/>';
    }
    if (pose === 'salue') {
      return limb('M ' + (-L) + ',' + y + ' C ' + (-L - 26) + ',' + (y + 8) + ' ' + (-L - 36) + ',' + (y + 22) + ' ' + (-L - 38) + ',' + (y + 34), c, 14) +
        limb('M ' + L + ',' + y + ' C ' + (L + 28) + ',' + (y - 26) + ' ' + (L + 44) + ',' + (y - 52) + ' ' + (L + 46) + ',' + (y - 74), c, 14) +
        m(-L - 40, y + 38) + m(L + 48, y - 80);
    }
    if (pose === 'brasenlair' || pose === 'saute') {
      return limb('M ' + (-L) + ',' + y + ' C ' + (-L - 24) + ',' + (y - 28) + ' ' + (-L - 38) + ',' + (y - 56) + ' ' + (-L - 40) + ',' + (y - 76), c, 14) +
        limb('M ' + L + ',' + y + ' C ' + (L + 24) + ',' + (y - 28) + ' ' + (L + 38) + ',' + (y - 56) + ' ' + (L + 40) + ',' + (y - 76), c, 14) +
        m(-L - 42, y - 82) + m(L + 42, y - 82);
    }
    if (pose === 'montre') {
      return limb('M ' + (-L) + ',' + y + ' C ' + (-L - 24) + ',' + (y + 10) + ' ' + (-L - 34) + ',' + (y + 22) + ' ' + (-L - 36) + ',' + (y + 32), c, 14) +
        limb('M ' + L + ',' + y + ' C ' + (L + 26) + ',' + (y - 6) + ' ' + (L + 48) + ',' + (y - 12) + ' ' + (L + 66) + ',' + (y - 18), c, 14) +
        m(-L - 38, y + 36) + m(L + 70, y - 20);
    }
    if (pose === 'tient') {
      return limb('M ' + (-L) + ',' + y + ' C ' + (-L - 20) + ',' + (y + 4) + ' ' + (-L - 30) + ',' + (y + 12) + ' ' + (-L - 30) + ',' + (y + 22), c, 14) +
        limb('M ' + L + ',' + y + ' C ' + (L + 20) + ',' + (y + 4) + ' ' + (L + 30) + ',' + (y + 12) + ' ' + (L + 30) + ',' + (y + 22), c, 14) +
        m(-L - 32, y + 26) + m(L + 32, y + 26);
    }
    if (pose === 'hausse') {
      return limb('M ' + (-L) + ',' + y + ' C ' + (-L - 26) + ',' + (y - 8) + ' ' + (-L - 40) + ',' + (y - 2) + ' ' + (-L - 44) + ',' + (y + 10), c, 14) +
        limb('M ' + L + ',' + y + ' C ' + (L + 26) + ',' + (y - 8) + ' ' + (L + 40) + ',' + (y - 2) + ' ' + (L + 44) + ',' + (y + 10), c, 14) +
        m(-L - 46, y + 14) + m(L + 46, y + 14);
    }
    return limb('M ' + (-L) + ',' + y + ' C ' + (-L - 24) + ',' + (y + 8) + ' ' + (-L - 34) + ',' + (y + 20) + ' ' + (-L - 36) + ',' + (y + 32), c, 14) +
      limb('M ' + L + ',' + y + ' C ' + (L + 24) + ',' + (y + 8) + ' ' + (L + 34) + ',' + (y + 20) + ' ' + (L + 36) + ',' + (y + 32), c, 14) +
      m(-L - 38, y + 36) + m(L + 38, y + 36);
  }

  function rond(o) {
    o = o || {};
    var c = o.couleur || '#f0a24a';
    var forme = RONDS[o.forme] ? o.forme : 'rond';
    var F = RONDS[forme];
    var pose = o.pose || 'debout';
    var humeur = o.humeur || 'content';
    var assis = pose === 'assis';

    var s = jambesRond(pose, c);
    var t = brasRond(pose, c, F.larg);

    /* corps + tête + oreilles : un seul contour d'union */
    var parts = [F.d, '<circle cx="0" cy="-190" r="44" fill="%F%" %S%/>'];
    if (o.oreilles === 'longues') {
      parts.push('<ellipse cx="-30" cy="-238" rx="14" ry="30" transform="rotate(-14 -30 -238)" fill="%F%" %S%/>');
      parts.push('<ellipse cx="30" cy="-238" rx="14" ry="30" transform="rotate(14 30 -238)" fill="%F%" %S%/>');
    } else if (o.oreilles !== 'aucune') {
      parts.push('<circle cx="-33" cy="-222" r="17" fill="%F%" %S%/>');
      parts.push('<circle cx="33" cy="-222" r="17" fill="%F%" %S%/>');
    }
    t += U(parts, c, 9);

    /* le ventre plus clair : la couture des peluches, et ce qui pose le
       personnage comme un objet cousu plutôt qu'un aplat de couleur */
    if (o.ventre !== false) {
      t += '<ellipse cx="0" cy="-100" rx="' + Math.round(F.larg * 0.62) + '" ry="' +
        Math.round(F.larg * 0.72) + '" fill="' + shade(c, 0.3) + '" opacity=".9"/>';
    }

    /* le visage, sur la tête */
    if (humeur === 'dort') {
      t += line('M -25,-196 q 9,8 18,0', INK, 4) + line('M 7,-196 q 9,8 18,0', INK, 4);
    } else if (humeur === 'fache') {
      t += '<circle cx="-16" cy="-194" r="7" fill="' + INK + '"/><circle cx="16" cy="-194" r="7" fill="' + INK + '"/>' +
        line('M -32,-214 L -8,-206 M 32,-214 L 8,-206', INK, 5);
    } else {
      var r = humeur === 'surpris' ? 8.5 : 7;
      t += '<circle cx="-16" cy="-196" r="' + r + '" fill="' + INK + '"/>' +
        '<circle cx="16" cy="-196" r="' + r + '" fill="' + INK + '"/>' +
        '<circle cx="-13.5" cy="-199" r="2.6" fill="#fff"/><circle cx="18.5" cy="-199" r="2.6" fill="#fff"/>';
    }
    t += '<circle cx="-30" cy="-178" r="8.5" fill="' + shade(c, -0.22) + '" opacity=".55"/>' +
      '<circle cx="30" cy="-178" r="8.5" fill="' + shade(c, -0.22) + '" opacity=".55"/>';
    /* le museau : un petit nez cousu, qui n'apparaît que si on le demande */
    if (o.museau) {
      t += U(['<ellipse cx="0" cy="-168" rx="20" ry="14" fill="%F%" %S%/>'], shade(c, 0.34), 5);
      t += '<ellipse cx="0" cy="-176" rx="7" ry="5.5" fill="' + INK + '"/>';
      if (humeur === 'triste') t += line('M -11,-156 q 11,-9 22,0', INK, 4);
      else if (humeur === 'surpris') t += '<ellipse cx="0" cy="-154" rx="7" ry="8" fill="#b8355c" stroke="' + INK + '" stroke-width="3"/>';
      else t += line('M -11,-164 q 11,10 22,0', INK, 4);
    } else {
      if (humeur === 'surpris') t += '<ellipse cx="0" cy="-168" rx="8" ry="10" fill="#b8355c" stroke="' + INK + '" stroke-width="3.5"/>';
      else if (humeur === 'triste' || humeur === 'fache') t += line('M -13,-164 q 13,-11 26,0', INK, 4.5);
      else t += line('M -14,-174 q 14,16 28,0', INK, 4.5);
    }

    /* les accessoires sont ceux de la fabrique enfant, remontés sur la tête */
    if (o.lunettes) {
      t += g('translate(0,' + RONDTETE + ')',
        '<circle cx="-16" cy="-52" r="15" fill="none" stroke="' + INK + '" stroke-width="4"/>' +
        '<circle cx="16" cy="-52" r="15" fill="none" stroke="' + INK + '" stroke-width="4"/>' +
        line('M -1,-52 L 1,-52', INK, 4) + line('M -31,-54 L -44,-58 M 31,-54 L 44,-58', INK, 3.5));
    }
    if (o.couronne) {
      t += g('translate(0,' + RONDTETE + ')',
        U(['<path d="M -26,-92 L -30,-118 L -12,-104 L 0,-124 L 12,-104 L 30,-118 L 26,-92 Z" fill="%F%" %S%/>'], o.couronne, 7));
    }
    if (o.chapeau) t += g('translate(0,' + RONDTETE + ') scale(.86)', chapeauSoleil(o.chapeau));

    return s + (assis ? g('translate(-6,40)', t) : t);
  }

  /* ---------- bonhomme de neige ---------- */
  function bonhommeNeige(o) {
    o = o || {};
    var s = U([
      '<ellipse cx="0" cy="-30" rx="34" ry="30" fill="%F%" %S%/>',
      '<ellipse cx="0" cy="-78" rx="26" ry="24" fill="%F%" %S%/>',
      '<ellipse cx="0" cy="-118" rx="24" ry="22" fill="%F%" %S%/>',
      '<ellipse cx="-3" cy="-138" rx="10" ry="8" fill="%F%" %S%/>'
    ], '#fdfcff', 9);
    s += '<circle cx="-9" cy="-122" r="6" fill="' + INK + '"/><circle cx="9" cy="-122" r="6" fill="' + INK + '"/>' +
      '<circle cx="-7" cy="-124" r="2" fill="#fff"/><circle cx="11" cy="-124" r="2" fill="#fff"/>';
    s += U(['<path d="M 0,-114 L 34,-108 L 0,-102 Z" fill="%F%" %S%/>'], '#ff8a3d', 6);
    s += line('M -12,-100 q 12,10 24,0', INK, 4);
    s += '<circle cx="0" cy="-84" r="4.5" fill="' + INK + '"/><circle cx="0" cy="-72" r="4.5" fill="' + INK + '"/>';
    s += line('M -25,-84 C -44,-90 -52,-102 -54,-112', '#8a5a3b', 6) + line('M -50,-104 l -12,-4 M -50,-104 l -6,-12', '#8a5a3b', 5);
    s += line('M 25,-84 C 44,-90 52,-102 54,-112', '#8a5a3b', 6) + line('M 50,-104 l 12,-4 M 50,-104 l 6,-12', '#8a5a3b', 5);
    s += '<path d="M -14,-142 q 6,-16 16,-8" fill="none" stroke="#4a7a3a" stroke-width="5" stroke-linecap="round"/>';
    return s;
  }

  /* ---------- dinosaure en peluche ---------- */
  function peluche(o) {
    o = o || {};
    var c = o.color || '#6fc46f';
    var s = U([
      '<ellipse cx="0" cy="-26" rx="28" ry="22" fill="%F%" %S%/>',
      '<ellipse cx="24" cy="-52" rx="18" ry="15" fill="%F%" %S%/>',
      '<path d="M -26,-24 C -50,-20 -56,-4 -44,2 C -40,-8 -32,-12 -22,-14 Z" fill="%F%" %S%/>'
    ], c, 8);
    s += '<circle cx="28" cy="-56" r="4.5" fill="' + INK + '"/>';
    s += line('M -8,-46 l 6,-10 l 6,10 M 4,-50 l 6,-10 l 6,10', shade(c, -0.3), 5);
    s += line('M -12,-6 l 0,10 M 12,-6 l 0,10', c, 8);
    return s;
  }

  /* ============================================================
     ACCESSOIRES & DÉCORS
     ============================================================ */

  var P = {};

  P.soleil = function (o) {
    var c = o.color || '#ffd93d', r = 46;
    var rays = '', i;
    for (i = 0; i < 12; i++) {
      var a = i * Math.PI / 6;
      rays += line('M ' + (Math.cos(a) * (r + 12)).toFixed(1) + ',' + (Math.sin(a) * (r + 12)).toFixed(1) +
        ' L ' + (Math.cos(a) * (r + 26)).toFixed(1) + ',' + (Math.sin(a) * (r + 26)).toFixed(1), c, 7);
    }
    return rays + '<circle cx="0" cy="0" r="' + r + '" fill="' + c + '"/>';
  };

  P.lune = function () {
    return '<path d="M 18,-34 A 38,38 0 1 0 18,34 A 30,30 0 1 1 18,-34 Z" fill="#fff7d6"/>';
  };

  P.nuage = function (o) {
    return U(['<ellipse cx="-34" cy="4" rx="34" ry="24" fill="%F%" %S%/>',
      '<ellipse cx="4" cy="-10" rx="40" ry="30" fill="%F%" %S%/>',
      '<ellipse cx="42" cy="6" rx="30" ry="22" fill="%F%" %S%/>'], o.color || '#ffffff', 0);
  };

  P.palmier = function () {
    var s = line('M 0,0 C -8,-50 -6,-90 -14,-134', '#a9773f', 14);
    var leaves = [[-1, -8], [1, -8], [-1, 12], [1, 12], [-1, 32], [1, 32]];
    var out = '';
    for (var i = 0; i < leaves.length; i++) {
      var f = leaves[i][0], rot = leaves[i][1];
      out += g('translate(-14,-134) scale(' + f + ',1) rotate(' + rot + ')',
        U(['<path d="M 0,0 C 30,-22 66,-20 84,-2 C 62,-6 34,4 0,10 Z" fill="%F%" %S%/>'], '#5f9350', 7));
    }
    return s + out + U(['<circle cx="-14" cy="-128" r="9" fill="%F%" %S%/>',
      '<circle cx="-2" cy="-124" r="9" fill="%F%" %S%/>'], '#c98a3f', 5);
  };

  P.parasol = function (o) {
    var c1 = o.color || '#ff5c8a', c2 = '#fffdf5';
    var s = line('M 0,0 L 6,-120', '#c9a26b', 8);
    var arcs = '';
    for (var i = -3; i <= 2; i++) {
      var x0 = i * 30, x1 = (i + 1) * 30;
      arcs += '<path d="M ' + x0 + ',-118 Q ' + ((x0 + x1) / 2) + ',-150 ' + x1 + ',-118 L ' + x1 + ',-118 Z" fill="none"/>';
    }
    s += U(['<path d="M -96,-116 C -96,-176 96,-176 96,-116 Z" fill="%F%" %S%/>'], c1, 8);
    s += '<path d="M -60,-146 C -46,-172 -14,-176 -2,-172 L -2,-118 L -46,-118 Z" fill="' + c2 + '"/>' +
      '<path d="M 30,-160 C 48,-152 62,-138 66,-118 L 30,-118 Z" fill="' + c2 + '"/>' +
      '<path d="M -96,-116 C -96,-176 96,-176 96,-116" fill="none" stroke="' + INK + '" stroke-width="5"/>' +
      line('M -96,-116 L 96,-116', INK, 5);
    return s;
  };

  P.ballon = function (o) {
    var c = o.color || '#ff5c5c', r = o.r || 30;
    return '<circle cx="0" cy="' + (-r) + '" r="' + r + '" fill="#fffdf5" stroke="' + INK + '" stroke-width="5"/>' +
      '<path d="M 0,' + (-2 * r) + ' C ' + (r * 0.7) + ',' + (-r * 1.4) + ' ' + (r * 0.7) + ',' + (-r * 0.6) + ' 0,0" fill="' + c + '" opacity=".95"/>' +
      '<path d="M 0,' + (-2 * r) + ' C ' + (-r * 0.7) + ',' + (-r * 1.4) + ' ' + (-r * 0.7) + ',' + (-r * 0.6) + ' 0,0" fill="#ffd93d" opacity=".95"/>' +
      '<circle cx="0" cy="' + (-r) + '" r="' + r + '" fill="none" stroke="' + INK + '" stroke-width="5"/>';
  };

  P.chateausable = function (o) {
    var c = o.color || '#f0cf94', d = shade(c, -0.18);
    var s = U([
      '<path d="M -90,0 L -90,-54 L -54,-54 L -54,0 Z" fill="%F%" %S%/>',
      '<path d="M -58,0 L -58,-40 L 58,-40 L 58,0 Z" fill="%F%" %S%/>',
      '<path d="M 54,0 L 54,-54 L 90,-54 L 90,0 Z" fill="%F%" %S%/>',
      '<path d="M -26,0 L -26,-84 L 26,-84 L 26,0 Z" fill="%F%" %S%/>',
      '<path d="M -90,-54 l 0,-12 l 12,0 l 0,12 M -66,-54 l 0,-12 l 12,0 l 0,12" fill="%F%" %S%/>',
      '<path d="M 54,-54 l 0,-12 l 12,0 l 0,12 M 78,-54 l 0,-12 l 12,0 l 0,12" fill="%F%" %S%/>',
      '<path d="M -26,-84 l 0,-12 l 12,0 l 0,12 M -2,-84 l 0,-12 l 12,0 l 0,12" fill="%F%" %S%/>'
    ], c, 8);
    s += '<path d="M -14,0 L -14,-26 A 14,14 0 0 1 14,-26 L 14,0 Z" fill="' + d + '" stroke="' + INK + '" stroke-width="5"/>';
    s += line('M 0,-96 L 0,-124', '#8a6a4a', 4) + '<path d="M 0,-124 L 40,-114 L 0,-104 Z" fill="#ff5c8a" stroke="' + INK + '" stroke-width="4"/>';
    return s;
  };

  P.seau = function (o) {
    var c = o.color || '#ff5c8a';
    return U(['<path d="M -24,-44 L 24,-44 L 18,0 L -18,0 Z" fill="%F%" %S%/>'], c, 8) +
      line('M -24,-44 C -12,-70 12,-70 24,-44', shade(c, -0.3), 5) +
      P.pelle({ color: '#ffd93d', x: 0 });
  };

  P.pelle = function (o) {
    var c = o.color || '#ffd93d';
    return g('translate(26,-10) rotate(18)', line('M 0,0 L 0,-56', c, 7) +
      U(['<path d="M -14,0 L 14,0 L 10,26 L -10,26 Z" fill="%F%" %S%/>'], c, 7));
  };

  P.etoilemer = function (o) {
    var c = o.color || '#ff9f5c', pts = '', i;
    for (i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 9 : 24;
      pts += (Math.cos(a) * r).toFixed(1) + ',' + (Math.sin(a) * r).toFixed(1) + ' ';
    }
    return '<polygon points="' + pts + '" fill="' + c + '" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/>';
  };

  P.coquillage = function (o) {
    var c = o.color || '#ffd9e2';
    return U(['<path d="M 0,0 C -26,0 -30,-26 0,-34 C 30,-26 26,0 0,0 Z" fill="%F%" %S%/>'], c, 6) +
      line('M 0,-2 L 0,-32 M -10,-4 L -5,-30 M 10,-4 L 5,-30', shade(c, -0.28), 3);
  };

  P.mouette = function () {
    return line('M -22,0 q 11,-14 22,0 q 11,-14 22,0', INK, 4);
  };

  P.crabe = function (o) {
    var c = o.color || '#ff6b5c';
    return U(['<ellipse cx="0" cy="-14" rx="26" ry="18" fill="%F%" %S%/>',
      '<path d="M -32,-24 C -46,-34 -44,-48 -32,-46 C -22,-44 -22,-32 -26,-26 Z" fill="%F%" %S%/>',
      '<path d="M 32,-24 C 46,-34 44,-48 32,-46 C 22,-44 22,-32 26,-26 Z" fill="%F%" %S%/>'], c, 7) +
      '<circle cx="-9" cy="-22" r="5" fill="#fff" stroke="' + INK + '" stroke-width="2.5"/>' +
      '<circle cx="9" cy="-22" r="5" fill="#fff" stroke="' + INK + '" stroke-width="2.5"/>' +
      '<circle cx="-9" cy="-22" r="2.2" fill="' + INK + '"/><circle cx="9" cy="-22" r="2.2" fill="' + INK + '"/>' +
      line('M -18,-2 l -8,8 M 0,-2 l 0,10 M 18,-2 l 8,8', c, 5);
  };

  P.serviette = function (o) {
    var c = o.color || '#61c9e8';
    return U(['<path d="M -80,0 L -74,-26 L 74,-26 L 80,0 Z" fill="%F%" %S%/>'], c, 7) +
      line('M -60,-24 L -56,-2 M -20,-24 L -18,-2 M 20,-24 L 20,-2 M 58,-24 L 60,-2', shade(c, -0.25), 6);
  };

  P.glace = function (o) {
    var c = o.color || '#ff9ec4', c2 = o.color2 || '#fff1a8';
    return U(['<path d="M -18,-30 L 18,-30 L 0,16 Z" fill="%F%" %S%/>'], '#e0a860', 6) +
      U(['<circle cx="-10" cy="-42" r="17" fill="%F%" %S%/>'], c, 6) +
      U(['<circle cx="11" cy="-46" r="16" fill="%F%" %S%/>'], c2, 6) +
      U(['<circle cx="0" cy="-66" r="15" fill="%F%" %S%/>'], '#a97ce0', 6) +
      '<circle cx="-3" cy="-80" r="5" fill="#ff5c5c" stroke="' + INK + '" stroke-width="3"/>';
  };

  P.pasteque = function () {
    return U(['<path d="M -46,0 A 46,46 0 0 1 46,0 Z" fill="%F%" %S%/>'], '#ff6b7d', 7) +
      '<path d="M -46,0 A 46,46 0 0 0 46,0 Z" fill="none"/>' +
      line('M -46,0 L 46,0', '#8fd45c', 9) +
      '<circle cx="-20" cy="-16" r="3.5" fill="' + INK + '"/><circle cx="4" cy="-24" r="3.5" fill="' + INK + '"/>' +
      '<circle cx="24" cy="-14" r="3.5" fill="' + INK + '"/>';
  };

  P.bouee = function (o) {
    var c = o.color || '#ff8a5c';
    return '<circle cx="0" cy="-34" r="34" fill="' + c + '" stroke="' + INK + '" stroke-width="6"/>' +
      '<path d="M -34,-34 a 34,34 0 0 1 34,-34 l 0,0 a 34,34 0 0 1 0,0 Z" fill="#fffdf5"/>' +
      '<path d="M 0,-68 A 34,34 0 0 1 34,-34 L 0,-34 Z" fill="#fffdf5"/>' +
      '<path d="M -34,-34 A 34,34 0 0 1 0,-68 L 0,-34 Z" fill="#fffdf5"/>' +
      '<circle cx="0" cy="-34" r="34" fill="none" stroke="' + INK + '" stroke-width="6"/>' +
      '<circle cx="0" cy="-34" r="13" fill="#bfe8f7" stroke="' + INK + '" stroke-width="5"/>';
  };

  P.tente = function (o) {
    var c = o.color || '#f2a03d';
    var s = U(['<path d="M 0,-130 L 96,0 L -96,0 Z" fill="%F%" %S%/>'], c, 9);
    s += '<path d="M 0,-124 L 40,0 L -40,0 Z" fill="' + shade(c, -0.35) + '" stroke="' + INK + '" stroke-width="5"/>';
    s += line('M 0,-124 L 0,0', INK, 4);
    s += line('M -96,0 L -118,-16 M 96,0 L 118,-16', INK, 4);
    return s;
  };

  P.feudecamp = function () {
    var s = line('M -44,-6 L 44,-18 M -44,-18 L 44,-6', '#8a5a3b', 11);
    s += U(['<path d="M 0,-96 C 26,-70 30,-46 20,-28 C 14,-16 -14,-16 -20,-28 C -30,-46 -26,-70 0,-96 Z" fill="%F%" %S%/>'], '#ff8a1f', 7);
    s += '<path d="M 0,-66 C 12,-50 14,-38 8,-30 C 4,-24 -4,-24 -8,-30 C -14,-38 -12,-50 0,-66 Z" fill="#ffd93d"/>';
    return s;
  };

  P.buche = function () {
    return U(['<rect x="-56" y="-24" width="112" height="24" rx="12" fill="%F%" %S%/>'], '#a9773f', 7) +
      '<ellipse cx="56" cy="-12" rx="9" ry="12" fill="#c99a5f" stroke="' + INK + '" stroke-width="4"/>';
  };

  P.arbre = function (o) {
    var c = o.color || '#5f9350';
    return line('M 0,0 L 0,-70', '#8a5a3b', 16) +
      U(['<circle cx="-34" cy="-96" r="38" fill="%F%" %S%/>',
        '<circle cx="24" cy="-108" r="42" fill="%F%" %S%/>',
        '<circle cx="0" cy="-72" r="36" fill="%F%" %S%/>',
        '<circle cx="44" cy="-72" r="30" fill="%F%" %S%/>'], c, 9);
  };

  P.sapin = function (o) {
    var c = o.color || '#3d6b52';
    return line('M 0,0 L 0,-30', '#6b4a33', 12) +
      U(['<path d="M 0,-140 L 34,-86 L -34,-86 Z" fill="%F%" %S%/>',
        '<path d="M 0,-112 L 44,-52 L -44,-52 Z" fill="%F%" %S%/>',
        '<path d="M 0,-80 L 54,-22 L -54,-22 Z" fill="%F%" %S%/>'], c, 8);
  };

  P.sapinneige = function () {
    return P.sapin({ color: '#3d6b52' }) +
      '<path d="M 0,-140 L 22,-105 L -22,-105 Z" fill="#fdfcff"/>' +
      '<path d="M 0,-112 L 28,-74 L -28,-74 Z" fill="#fdfcff" opacity=".9"/>';
  };

  P.buisson = function (o) {
    return U(['<ellipse cx="-24" cy="-14" rx="28" ry="22" fill="%F%" %S%/>',
      '<ellipse cx="12" cy="-24" rx="32" ry="26" fill="%F%" %S%/>',
      '<ellipse cx="40" cy="-12" rx="24" ry="20" fill="%F%" %S%/>'], o.color || '#6fa057', 8);
  };

  P.fleur = function (o) {
    var c = o.color || '#ff7ab8', s = line('M 0,0 L 0,-26', '#5f9350', 4), i;
    for (i = 0; i < 5; i++) {
      var an = i * 72 * Math.PI / 180;
      s += '<circle cx="' + (Math.cos(an) * 10).toFixed(1) + '" cy="' + (-26 + Math.sin(an) * 10).toFixed(1) + '" r="9" fill="' + c + '" stroke="' + INK + '" stroke-width="3"/>';
    }
    s += '<circle cx="0" cy="-26" r="6" fill="#ffd93d" stroke="' + INK + '" stroke-width="3"/>';
    return s;
  };

  P.papillon = function (o) {
    var c = o.color || '#ffb85c';
    return U(['<ellipse cx="-14" cy="-8" rx="14" ry="11" fill="%F%" %S%/>',
      '<ellipse cx="14" cy="-8" rx="14" ry="11" fill="%F%" %S%/>',
      '<ellipse cx="-11" cy="6" rx="10" ry="8" fill="%F%" %S%/>',
      '<ellipse cx="11" cy="6" rx="10" ry="8" fill="%F%" %S%/>'], c, 6) +
      '<ellipse cx="0" cy="-1" rx="4" ry="14" fill="' + INK + '"/>' +
      line('M -2,-14 l -8,-10 M 2,-14 l 8,-10', INK, 3);
  };

  /* ficelle : relie un point à un autre (cerf-volant, ballon…) */
  P.ficelle = function (o) {
    var dx = o.dx || 0, dy = o.dy || 0;
    var qx = o.qx !== undefined ? o.qx : dx * 0.35;
    var qy = o.qy !== undefined ? o.qy : dy * 0.15;
    return line('M 0,0 Q ' + qx + ',' + qy + ' ' + dx + ',' + dy, o.color || INK, o.w || 3);
  };

  P.cerfvolant = function (o) {
    var c = o.color || '#e8436e';
    return U(['<path d="M 0,-46 L 32,0 L 0,46 L -32,0 Z" fill="%F%" %S%/>'], c, 7) +
      '<path d="M 0,-46 L 32,0 L 0,0 Z" fill="' + shade(c, 0.35) + '"/>' +
      '<path d="M 0,46 L -32,0 L 0,0 Z" fill="' + shade(c, 0.35) + '"/>' +
      line('M 0,-46 L 0,46 M -32,0 L 32,0', INK, 3.5) +
      line('M 0,46 c -14,14 14,26 0,40 c -14,14 14,26 0,40', INK, 3.5);
  };

  P.bateau = function (o) {
    var c = o.color || '#e8436e';
    return U(['<path d="M -70,-20 L 70,-20 L 50,16 L -50,16 Z" fill="%F%" %S%/>'], c, 8) +
      line('M 0,-20 L 0,-116', '#a9773f', 7) +
      U(['<path d="M 6,-112 L 62,-30 L 6,-30 Z" fill="%F%" %S%/>'], '#fffdf5', 7) +
      U(['<path d="M -6,-104 L -50,-32 L -6,-32 Z" fill="%F%" %S%/>'], '#ffd93d', 7);
  };

  P.voiture = function (o) {
    var c = o.color || '#e8436e';
    var s = U(['<path d="M -110,-40 L -78,-88 L 66,-88 L 100,-40 Z" fill="%F%" %S%/>',
      '<rect x="-120" y="-46" width="230" height="46" rx="20" fill="%F%" %S%/>'], c, 9);
    s += '<path d="M -72,-80 L -8,-80 L -8,-48 L -92,-48 Z" fill="#bfe8f7" stroke="' + INK + '" stroke-width="5"/>' +
      '<path d="M 4,-80 L 60,-80 L 88,-48 L 4,-48 Z" fill="#bfe8f7" stroke="' + INK + '" stroke-width="5"/>';
    s += '<circle cx="-64" cy="2" r="26" fill="#4a3b42" stroke="' + INK + '" stroke-width="5"/>' +
      '<circle cx="56" cy="2" r="26" fill="#4a3b42" stroke="' + INK + '" stroke-width="5"/>' +
      '<circle cx="-64" cy="2" r="10" fill="#cfd6da"/><circle cx="56" cy="2" r="10" fill="#cfd6da"/>';
    return s;
  };

  P.valise = function (o) {
    var c = o.color || '#c96b3d';
    return U(['<rect x="-40" y="-52" width="80" height="52" rx="8" fill="%F%" %S%/>'], c, 7) +
      line('M -14,-52 q 14,-18 28,0', INK, 5) + line('M -40,-30 L 40,-30', shade(c, -0.3), 5);
  };

  P.chamallow = function () {
    return line('M 0,0 L 70,-40', '#a9773f', 5) +
      '<rect x="64" y="-56" width="18" height="18" rx="5" fill="#fff6ec" stroke="' + INK + '" stroke-width="3.5"/>' +
      '<rect x="76" y="-64" width="18" height="18" rx="5" fill="#ffe8d0" stroke="' + INK + '" stroke-width="3.5"/>';
  };

  /* l'arroseur du jardin */
  P.arroseur = function (o) {
    var c = o.color || '#4f8a3d';
    var s = line('M 0,0 L 0,-34', c, 8) +
      U(['<ellipse cx="0" cy="-2" rx="24" ry="8" fill="%F%" %S%/>'], c, 6) +
      '<circle cx="0" cy="-38" r="9" fill="' + c + '" stroke="' + INK + '" stroke-width="4"/>';
    var i;
    for (i = -2; i <= 2; i++) {
      var a1 = i * 22;
      s += line('M 0,-42 q ' + (a1 * 1.8) + ',-40 ' + (a1 * 3.4) + ',-6', '#8fd0e8', 5, 'opacity=".85"');
    }
    return s;
  };

  /* le trampoline du jardin */
  P.trampoline = function (o) {
    var c = o.color || '#3f6ea8';
    return line('M -78,0 L -62,-34 M 78,0 L 62,-34 M -40,0 L -34,-34 M 40,0 L 34,-34', '#8a97a8', 7) +
      U(['<ellipse cx="0" cy="-38" rx="96" ry="22" fill="%F%" %S%/>'], c, 8) +
      '<ellipse cx="0" cy="-40" rx="78" ry="15" fill="#4a4550" stroke="' + INK + '" stroke-width="5"/>';
  };

  /* la mangue, fruit de l'été */
  P.mangue = function (o) {
    return U(['<path d="M 0,0 C -26,-4 -32,-30 -18,-44 C -4,-58 24,-52 28,-32 C 32,-14 20,2 0,0 Z" fill="%F%" %S%/>'], o.color || '#f2b93f', 7) +
      '<path d="M 10,-44 C 24,-38 30,-20 22,-8 C 16,0 6,0 2,-2 C 18,-10 22,-30 10,-44 Z" fill="#e2593c"/>' +
      '<path d="M 4,-6 C -14,-10 -20,-28 -10,-40" fill="none" stroke="#e8a83c" stroke-width="5" stroke-linecap="round"/>' +
      line('M 12,-50 q 4,-12 -4,-16', '#6f9147', 5);
  };

  /* la glacière */
  P.glaciere = function (o) {
    var c = o.color || '#4f9cb5';
    return U(['<rect x="-46" y="-40" width="92" height="40" rx="6" fill="%F%" %S%/>'], c, 8) +
      U(['<rect x="-50" y="-52" width="100" height="14" rx="5" fill="%F%" %S%/>'], '#fdf7ea', 8) +
      line('M -20,-46 L 20,-46', shade(c, -0.3), 4);
  };

  P.herisson = function (o) {
    var c = o.color || '#8a6a4a';
    var spikes = '<path d="M -44,-2 L -38,-30 L -31,-15 L -25,-38 L -18,-21 L -10,-46 L -3,-29 L 4,-50 ' +
      'L 12,-31 L 19,-45 L 26,-29 L 33,-39 L 38,-19 L 42,-25 L 42,-2 Z" fill="%F%" %S%/>';
    var body = '<path d="M -42,-2 C -44,-24 -20,-36 4,-34 C 28,-32 42,-18 42,-2 Z" fill="%F%" %S%/>';
    var s = U([spikes, body], c, 7);
    s += U(['<path d="M 30,-2 C 30,-22 44,-30 58,-26 C 70,-22 74,-12 72,-2 Z" fill="%F%" %S%/>'], '#f2ddc2', 7);
    s += '<circle cx="52" cy="-18" r="4.2" fill="' + INK + '"/>' +
      '<ellipse cx="70" cy="-12" rx="5.5" ry="4.5" fill="' + INK + '"/>' +
      line('M 56,-6 q 8,5 14,0', INK, 3);
    s += '<ellipse cx="-16" cy="0" rx="9" ry="5" fill="' + shade(c, -0.3) + '"/>' +
      '<ellipse cx="26" cy="0" rx="9" ry="5" fill="' + shade(c, -0.3) + '"/>';
    return s;
  };

  P.bouleneige = function (o) {
    var r = o.r || 14;
    return '<circle cx="0" cy="0" r="' + r + '" fill="#fdfcff" stroke="' + INK + '" stroke-width="4"/>' +
      '<circle cx="' + (-r * .3) + '" cy="' + (-r * .3) + '" r="' + (r * .3) + '" fill="#e8f4fb"/>';
  };

  P.etoile = function (o) {
    var r = o.r || 9, c = o.color || '#fff7d6', pts = '', i;
    for (i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.42 : r;
      pts += (Math.cos(a) * rr).toFixed(1) + ',' + (Math.sin(a) * rr).toFixed(1) + ' ';
    }
    return '<polygon points="' + pts + '" fill="' + c + '"/>';
  };

  P.flocon = function (o) {
    var r = o.r || 14, c = o.color || '#eaf6ff', s = '', i;
    for (i = 0; i < 6; i++) {
      s += g('rotate(' + (i * 60) + ')', line('M 0,0 L 0,' + (-r) + ' M 0,' + (-r * 0.6) + ' l -5,-5 M 0,' + (-r * 0.6) + ' l 5,-5', c, 3));
    }
    return s;
  };

  /* un cube de bois, qui se pose seul ou s'empile en tour */
  P.cube = function (o) {
    var c = o.color || '#e8b44a';
    var s = U(['<rect x="-22" y="-44" width="44" height="44" rx="6" fill="%F%" %S%/>'], c, 6);
    if (o.lettre) {
      s += '<text x="0" y="-14" text-anchor="middle" font-family="' + FONT +
        '" font-size="26" font-weight="800" fill="' + INK + '">' + esc(o.lettre) + '</text>';
    }
    return s;
  };

  /* une tour de cubes : ce que construisent les enfants, et ce qui s'écroule */
  P.tourcubes = function (o) {
    var cs = o.colors || ['#e0453c', '#4a7fc1', '#7ab648', '#f7c518'];
    var n = o.n || 4, s = '', i;
    for (i = 0; i < n; i++) {
      s += g('translate(' + ((i % 2 ? 5 : -5)) + ',' + (-i * 42) + ') rotate(' + ((i % 2 ? 2 : -2)) + ')',
        P.cube({ color: cs[i % cs.length] }));
    }
    return s;
  };

  /* la cabane de branches : deux perches en A, des traverses, et parfois
     un toit posé dessus. « ecroulee » donne le tas d'avant (ou d'après). */
  P.cabane = function (o) {
    var c = o.color || '#a9773f';
    if (o.ecroulee) {
      return line('M -118,-8 L 58,-30', c, 13) + line('M -76,-32 L 108,-10', c, 11) +
        line('M -42,-6 L 116,-38', c, 10) + line('M -104,-36 L 24,-10', c, 9);
    }
    var perches = line('M -108,0 L 0,-168', c, 13) + line('M 108,0 L 0,-168', c, 13);
    var s = perches + line('M -60,-70 L 60,-70', c, 10) + line('M -33,-116 L 33,-116', c, 9);
    if (o.toit) {
      s += '<g opacity=".55">' +
        U(['<path d="M 0,-176 L 94,-14 L -94,-14 Z" fill="%F%" %S%/>'], o.toit, 6) + '</g>';
      s += perches;
    }
    return s;
  };

  /* une étagère de livres : de quoi poser une bibliothèque derrière les têtes */
  P.etagere = function (o) {
    var c = o.color || '#a9773f';
    var dos = ['#e0453c', '#4a7fc1', '#7ab648', '#f7c518', '#a98cf0', '#3fb3b0', '#f0862c'];
    var s = U(['<rect x="-96" y="-16" width="192" height="16" rx="4" fill="%F%" %S%/>'], c, 6);
    var i, x = -86;
    for (i = 0; i < 8; i++) {
      var h = 52 + (i * 37 % 5) * 6, w = 16 + (i * 23 % 3) * 4;
      s += '<rect x="' + x + '" y="' + (-16 - h) + '" width="' + w + '" height="' + h +
        '" rx="3" fill="' + dos[i % dos.length] + '" stroke="' + INK + '" stroke-width="3.5"/>';
      x += w + 3;
    }
    return s;
  };

  P.caillou = function (o) {
    return U(['<path d="M -34,0 C -40,-22 -20,-38 0,-36 C 22,-34 36,-20 32,0 Z" fill="%F%" %S%/>'], o.color || '#b9b3ae', 7);
  };

  P.poisson = function (o) {
    var c = o.color || '#ffb85c';
    return U(['<ellipse cx="0" cy="0" rx="26" ry="16" fill="%F%" %S%/>',
      '<path d="M 22,0 L 44,-16 L 44,16 Z" fill="%F%" %S%/>'], c, 6) +
      '<circle cx="-12" cy="-4" r="3.5" fill="' + INK + '"/>';
  };

  P.toboggan = function (o) {
    var c = o.color || '#f2803d';
    var s = line('M -78,0 L -78,-190 M -30,0 L -30,-190', '#8a97a8', 11);
    s += line('M -78,-40 L -30,-40 M -78,-78 L -30,-78 M -78,-116 L -30,-116 M -78,-154 L -30,-154', '#8a97a8', 8);
    s += U(['<path d="M -92,-196 C -30,-186 10,-120 92,-42 L 150,-16 L 150,18 L 74,-8 C -12,-92 -60,-154 -104,-166 Z" fill="%F%" %S%/>'], c, 9);
    s += line('M -86,-186 C -26,-172 16,-108 96,-30', shade(c, -0.3), 5);
    s += line('M -100,-196 L -100,-160 M -22,-196 L -22,-176', '#8a97a8', 9);
    return s;
  };

  P.piscine = function (o) {
    var c = o.color || '#5cc8e8';
    return U(['<ellipse cx="0" cy="0" rx="240" ry="66" fill="%F%" %S%/>'], '#f2e2c4', 9) +
      '<ellipse cx="0" cy="4" rx="208" ry="52" fill="' + c + '" stroke="' + INK + '" stroke-width="6"/>' +
      line('M -140,-10 q 20,-10 40,0 q 20,10 40,0', '#ffffff', 4, 'opacity=".65"') +
      line('M 30,20 q 20,-10 40,0 q 20,10 40,0', '#ffffff', 4, 'opacity=".65"') +
      line('M -60,34 q 20,-10 40,0 q 20,10 40,0', '#ffffff', 4, 'opacity=".55"');
  };

  P.luge = function (o) {
    var c = o.color || '#c9502f';
    return U(['<rect x="-56" y="-26" width="112" height="18" rx="8" fill="%F%" %S%/>'], c, 7) +
      line('M -50,-6 L 50,-6 M -50,-6 c -12,0 -14,-10 -6,-14 M 50,-6 c 12,0 14,-10 6,-14', '#8a97a8', 6);
  };

  /* le château : la couleur décide de tout — glace, pierre ou sable */
  P.chateau = function (o) {
    var c = (o && o.color) || '#cfeeff', d = shade(c, -0.22);
    var s = U([
      '<path d="M -130,0 L -130,-130 L -78,-130 L -78,0 Z" fill="%F%" %S%/>',
      '<path d="M 78,0 L 78,-130 L 130,-130 L 130,0 Z" fill="%F%" %S%/>',
      '<path d="M -84,0 L -84,-170 L 84,-170 L 84,0 Z" fill="%F%" %S%/>',
      '<path d="M -46,-170 L -46,-232 L 46,-232 L 46,-170 Z" fill="%F%" %S%/>',
      '<path d="M -104,-130 L -104,-190 L -52,-130 Z" fill="%F%" %S%/>',
      '<path d="M 104,-130 L 104,-190 L 52,-130 Z" fill="%F%" %S%/>',
      '<path d="M -60,-232 L 0,-330 L 60,-232 Z" fill="%F%" %S%/>',
      '<path d="M -100,-170 L -84,-214 L -68,-170 Z" fill="%F%" %S%/>',
      '<path d="M 100,-170 L 84,-214 L 68,-170 Z" fill="%F%" %S%/>'
    ], c, 9);
    s += line('M -46,-232 L -46,-170 M 46,-232 L 46,-170 M -84,-170 L -84,0 M 84,-170 L 84,0', d, 4);
    s += '<path d="M -22,0 L -22,-64 A 22,22 0 0 1 22,-64 L 22,0 Z" fill="' + d + '" stroke="' + INK + '" stroke-width="5"/>';
    s += '<rect x="-70" y="-142" width="26" height="40" rx="13" fill="' + d + '" stroke="' + INK + '" stroke-width="4"/>' +
      '<rect x="44" y="-142" width="26" height="40" rx="13" fill="' + d + '" stroke="' + INK + '" stroke-width="4"/>' +
      '<rect x="-13" y="-216" width="26" height="40" rx="13" fill="' + d + '" stroke="' + INK + '" stroke-width="4"/>';
    s += line('M 0,-330 L 0,-352', INK, 4) + '<path d="M 0,-352 L 34,-343 L 0,-334 Z" fill="' +
      ((o && o.fanion) || '#e8746b') + '" stroke="' + INK + '" stroke-width="4"/>';
    return s;
  };

  P.maison = function (o) {
    var c = o.color || '#fff1d6', roof = o.roof || '#e8746b';
    return U(['<rect x="-90" y="-120" width="180" height="120" fill="%F%" %S%/>'], c, 9) +
      U(['<path d="M -106,-118 L 0,-190 L 106,-118 Z" fill="%F%" %S%/>'], roof, 9) +
      '<path d="M -22,0 L -22,-62 A 22,22 0 0 1 22,-62 L 22,0 Z" fill="#c98a3f" stroke="' + INK + '" stroke-width="5"/>' +
      '<rect x="-74" y="-96" width="40" height="38" rx="6" fill="#bfe8f7" stroke="' + INK + '" stroke-width="5"/>' +
      '<rect x="36" y="-96" width="40" height="38" rx="6" fill="#bfe8f7" stroke="' + INK + '" stroke-width="5"/>';
  };

  P.aurore = function () {
    var id = 'au' + (++uid);
    return '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#7ef2c8" stop-opacity=".0"/>' +
      '<stop offset="45%" stop-color="#7ef2c8" stop-opacity=".55"/>' +
      '<stop offset="100%" stop-color="#a98cf0" stop-opacity=".0"/></linearGradient></defs>' +
      '<path d="M -400,-40 C -260,-150 -120,20 40,-110 C 180,-220 300,-30 420,-120 L 420,120 L -400,120 Z" fill="url(#' + id + ')"/>';
  };

  P.etincelle = function (o) {
    var c = o.color || '#eaf6ff', r = o.r || 16;
    return '<path d="M 0,' + (-r) + ' Q 3,-3 ' + r + ',0 Q 3,3 0,' + r + ' Q -3,3 ' + (-r) + ',0 Q -3,-3 0,' + (-r) + ' Z" fill="' + c + '"/>';
  };

  P.eclaboussure = function (o) {
    var c = o.color || '#cfeeff';
    var s = U(['<path d="M -64,8 C -58,-10 -44,-20 -38,-46 C -30,-20 -20,-16 -14,-42 ' +
      'C -6,-14 4,-14 10,-48 C 18,-16 30,-18 36,-44 C 44,-18 56,-10 64,8 Z" fill="%F%" %S%/>'], c, 6);
    s += '<circle cx="-56" cy="-58" r="7" fill="' + c + '" stroke="' + INK + '" stroke-width="3"/>' +
      '<circle cx="-6" cy="-66" r="6" fill="' + c + '" stroke="' + INK + '" stroke-width="3"/>' +
      '<circle cx="44" cy="-62" r="8" fill="' + c + '" stroke="' + INK + '" stroke-width="3"/>' +
      '<circle cx="22" cy="-84" r="5" fill="' + c + '" stroke="' + INK + '" stroke-width="3"/>';
    return s;
  };

  P.lampion = function (o) {
    var c = o.color || '#ffd07a';
    return '<circle cx="0" cy="0" r="20" fill="' + c + '" stroke="' + INK + '" stroke-width="4"/>' +
      '<circle cx="0" cy="0" r="20" fill="none" stroke="' + shade(c, -0.3) + '" stroke-width="2"/>' +
      line('M 0,-20 L 0,-34', INK, 3);
  };

  P.baudruche = function (o) {
    var c = o.color || '#ff5c8a';
    return U(['<ellipse cx="0" cy="-30" rx="24" ry="30" fill="%F%" %S%/>'], c, 6) +
      line('M 0,0 c 8,14 -8,22 0,36', INK, 3);
  };

  P.flaque = function () {
    return U(['<ellipse cx="0" cy="0" rx="90" ry="26" fill="%F%" %S%/>'], '#8a6a4a', 8) +
      '<ellipse cx="-24" cy="-4" rx="26" ry="7" fill="#a9805c" opacity=".7"/>';
  };

  P.vague = function (o) {
    var c = o.color || '#ffffff';
    return line('M -80,0 q 20,-16 40,0 q 20,16 40,0 q 20,-16 40,0', c, 5, 'opacity=".8"');
  };

  /* ============================================================
     DÉCORS
     ============================================================ */

  var CIEL = {
    jour: ['#9ecfe0', '#e6f0e4'],
    matin: ['#b3d8e8', '#f7e6c8'],
    couchant: ['#e8895c', '#f5cf9c'],
    nuit: ['#25304f', '#4a5a7a'],
    neige: ['#b6d4e0', '#eef4f2'],
    gris: ['#b4bfc4', '#dde2de'],
    nuitneige: ['#232f4c', '#465a80']
  };

  function skyRect(heure) {
    var c = CIEL[heure] || CIEL.jour, id = 'sky' + (++uid);
    return '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="' + c[0] + '"/><stop offset="100%" stop-color="' + c[1] + '"/>' +
      '</linearGradient></defs><rect x="0" y="0" width="' + VW + '" height="' + VH + '" fill="url(#' + id + ')"/>';
  }

  /* le soleil : il ne se montre ni la nuit, ni les jours gris */
  function soleil(heure, tx, ty, o) {
    if (heure === 'gris' || heure === 'nuit') return '';
    return g('translate(' + tx + ',' + ty + ')', P.soleil(o || {}));
  }

  function stars(n, maxY) {
    var s = '', i;
    for (i = 0; i < n; i++) {
      var x = ((i * 137) % 780) + 10;
      var y = ((i * 73) % (maxY || 260)) + 14;
      var r = (i % 3) ? 6 : 10;
      s += g('translate(' + x + ',' + y + ')', P.etoile({ r: r }));
    }
    return s;
  }

  /* la neige qui tombe : une couche de flocons semés toujours de la même
     façon, pour qu'une case ne change pas d'aspect d'un affichage à l'autre */
  function flocons(n) {
    var s = '', i;
    for (i = 0; i < n; i++) {
      var x = ((i * 149) % 792) + 6;
      var y = ((i * 97) % 540) + 8;
      var r = 7 + (i % 3) * 4;
      s += '<g transform="translate(' + x + ',' + y + ') rotate(' + ((i * 37) % 60 - 30) + ')">' +
        P.flocon({ r: r, color: '#ffffff' }) + '</g>';
    }
    return s;
  }

  var BG = {};

  BG.plage = function (s) {
    var heure = s.heure || 'jour';
    var sand = heure === 'couchant' ? '#e6c692' : '#eed9ab';
    var sea = heure === 'couchant' ? '#dd8460' : '#4f9cb5';
    var out = skyRect(heure);
    if (heure === 'nuit') out += stars(22, 220);
    /* une scène peut poser son propre soleil (utile quand le cadrage
       plein écran rogne le haut du ciel) : voir COUVERTURE */
    if (s.sansSoleil) { /* la scène s'en charge */ }
    else if (heure === 'couchant') out += soleil(heure, 640, 190, { color: '#ffdf6b' });
    else if (heure !== 'nuit') out += soleil(heure, 690, 96);
    else out += g('translate(690,96)', P.lune({}));
    if (heure !== 'nuit') {
      out += g('translate(150,110) scale(1.1)', P.nuage({})) + g('translate(430,70) scale(.8)', P.nuage({}));
    }
    out += g('translate(160,150) scale(1.2)', P.mouette({})) + g('translate(300,110)', P.mouette({}));
    // mer
    out += '<rect x="0" y="250" width="' + VW + '" height="120" fill="' + sea + '"/>';
    out += g('translate(120,286)', P.vague({})) + g('translate(420,306)', P.vague({})) + g('translate(690,282)', P.vague({}));
    // sable
    out += '<path d="M 0,352 C 180,336 300,372 460,356 C 600,342 700,368 800,352 L 800,560 L 0,560 Z" fill="' + sand + '"/>';
    out += line('M 0,352 C 180,336 300,372 460,356 C 600,342 700,368 800,352', shade(sand, -0.16), 5);
    return out;
  };

  BG.mer = function (s) {
    var heure = s.heure || 'jour';
    var out = skyRect(heure);
    if (heure !== 'nuit') out += soleil(heure, 700, 90) + g('translate(190,110) scale(.9)', P.nuage({}));
    out += '<rect x="0" y="300" width="' + VW + '" height="260" fill="#3fb0d8"/>';
    out += '<path d="M 0,300 q 40,-18 80,0 q 40,18 80,0 q 40,-18 80,0 q 40,18 80,0 q 40,-18 80,0 q 40,18 80,0 q 40,-18 80,0 q 40,18 80,0 q 40,-18 80,0 q 40,18 80,0 L 800,340 L 0,340 Z" fill="#5ec6e8"/>';
    out += g('translate(200,400)', P.vague({})) + g('translate(560,460)', P.vague({})) + g('translate(360,520)', P.vague({}));
    return out;
  };

  BG.jardin = function (s) {
    var heure = s.heure || 'jour';
    var out = skyRect(heure);
    if (heure === 'nuit') out += stars(20, 200) + g('translate(690,96)', P.lune({}));
    else out += soleil(heure, 700, 90) + g('translate(180,110) scale(1)', P.nuage({})) + g('translate(470,74) scale(.7)', P.nuage({}));
    out += '<path d="M 0,330 C 160,306 320,344 470,326 C 620,308 720,336 800,322 L 800,560 L 0,560 Z" fill="#7ecb6a"/>';
    out += line('M 0,330 C 160,306 320,344 470,326 C 620,308 720,336 800,322', '#6f9147', 5);
    out += '<rect x="0" y="392" width="800" height="168" fill="#8ed67a"/>';
    return out;
  };

  BG.colline = function (s) {
    var heure = s.heure || 'jour';
    var out = skyRect(heure);
    if (heure !== 'nuit') out += soleil(heure, 120, 90) + g('translate(560,110) scale(1)', P.nuage({})) + g('translate(340,64) scale(.7)', P.nuage({}));
    out += '<path d="M -20,420 C 120,300 320,300 440,368 C 560,436 700,404 820,352 L 820,560 L -20,560 Z" fill="#8ed67a"/>';
    out += '<path d="M -20,470 C 160,400 340,470 520,436 C 660,410 740,440 820,420 L 820,560 L -20,560 Z" fill="#6fbf5c"/>';
    return out;
  };

  BG.campement = function (s) {
    var heure = s.heure || 'jour';
    var out = skyRect(heure);
    if (heure === 'nuit') {
      out += stars(26, 250) + g('translate(120,96)', P.lune({}));
    } else {
      out += soleil(heure, 690, 96) + g('translate(200,110)', P.nuage({})) + g('translate(500,72) scale(.7)', P.nuage({}));
    }
    var far = heure === 'nuit' ? '#1f3f5c' : '#93b592';
    out += '<path d="M 0,330 L 120,230 L 220,330 L 340,240 L 460,330 L 600,236 L 740,330 L 800,300 L 800,400 L 0,400 Z" fill="' + far + '"/>';
    var grass = heure === 'nuit' ? '#2f4a3a' : '#8fb35c';
    out += '<path d="M 0,352 C 200,336 400,372 600,352 C 700,342 760,360 800,352 L 800,560 L 0,560 Z" fill="' + grass + '"/>';
    return out;
  };

  BG.foret = function (s) {
    var heure = s.heure || 'jour';
    var out = skyRect(heure);
    if (heure === 'nuit') out += stars(20, 220);
    var t = heure === 'nuit' ? '#2a4438' : '#3f8a5c';
    out += g('translate(80,380) scale(1.3)', P.sapin({ color: t })) + g('translate(240,368) scale(1.05)', P.sapin({ color: t })) +
      g('translate(620,384) scale(1.25)', P.sapin({ color: t })) + g('translate(760,366)', P.sapin({ color: t }));
    out += '<path d="M 0,372 C 200,356 400,392 600,372 C 700,362 760,380 800,372 L 800,560 L 0,560 Z" fill="' + (heure === 'nuit' ? '#2f4a3a' : '#8fb35c') + '"/>';
    return out;
  };

  /* le ruisseau au fond du jardin : cailloux, eau claire, eucalyptus */
  BG.ruisseau = function (s) {
    var heure = s.heure || 'jour';
    var out = skyRect(heure);
    if (heure !== 'nuit') out += soleil(heure, 700, 86) + g('translate(180,104)', P.nuage({}));
    out += g('translate(90,360) scale(1.25)', P.arbre({ color: '#7f9e63' })) +
      g('translate(690,352) scale(1.1)', P.arbre({ color: '#6f9147' }));
    out += '<path d="M 0,320 C 200,300 400,336 600,318 C 700,308 760,330 800,318 L 800,400 L 0,400 Z" fill="#8fb35c"/>';
    out += '<rect x="0" y="380" width="800" height="180" fill="#9cbd66"/>';
    /* l'eau */
    out += '<path d="M -20,470 C 140,430 300,500 460,462 C 600,428 720,476 820,452 L 820,560 L -20,560 Z" fill="#5fa8bd"/>';
    out += line('M -20,470 C 140,430 300,500 460,462 C 600,428 720,476 820,452', '#4a8ba0', 5);
    out += g('translate(180,510)', P.vague({})) + g('translate(560,528)', P.vague({}));
    /* les cailloux */
    out += g('translate(120,470) scale(.7)', P.caillou({})) + g('translate(300,452) scale(.55)', P.caillou({})) +
      g('translate(640,462) scale(.65)', P.caillou({})) + g('translate(470,440) scale(.45)', P.caillou({}));
    return out;
  };

  BG.neige = function (s) {
    var heure = s.heure === 'nuit' ? 'nuitneige' : 'snow';
    var out = skyRect(heure);
    if (s.heure === 'nuit') {
      out += stars(28, 260);
      if (s.aurore) out += g('translate(400,150)', P.aurore({}));
      out += g('translate(120,90)', P.lune({}));
    }
    else out += soleil(heure, 690, 90, { color: '#fff0a8' }) + g('translate(180,110) scale(.9)', P.nuage({ color: '#ffffff' }));
    out += '<path d="M 0,340 L 130,190 L 250,340 Z" fill="#7ba6c9"/><path d="M 130,190 L 178,250 L 96,250 Z" fill="#fdfcff"/>';
    out += '<path d="M 240,350 L 420,150 L 600,350 Z" fill="#8fb8d8"/><path d="M 420,150 L 484,232 L 356,232 Z" fill="#fdfcff"/>';
    out += '<path d="M 560,346 L 690,200 L 810,346 Z" fill="#7ba6c9"/><path d="M 690,200 L 736,258 L 646,258 Z" fill="#fdfcff"/>';
    out += '<path d="M 0,346 C 200,326 380,366 560,346 C 680,332 740,356 800,344 L 800,560 L 0,560 Z" fill="#f2fbff"/>';
    out += line('M 0,346 C 200,326 380,366 560,346 C 680,332 740,356 800,344', '#cfe6f2', 5);
    out += '<path d="M 0,430 C 180,410 340,446 520,428 C 660,414 740,436 800,424 L 800,560 L 0,560 Z" fill="#ffffff"/>';
    return out;
  };

  BG.village = function (s) {
    var heure = s.heure || 'jour';
    var out = skyRect(heure);
    if (heure === 'nuit') out += stars(18, 200) + g('translate(680,90)', P.lune({}));
    else out += soleil(heure, 700, 86) + g('translate(220,104)', P.nuage({}));
    out += g('translate(140,340) scale(.62)', P.maison({ roof: '#e8746b' })) +
      g('translate(660,342) scale(.58)', P.maison({ roof: '#7aa9e8', color: '#fdf3e2' }));
    out += g('translate(400,340) scale(.72)', P.arbre({}));
    out += '<path d="M 0,340 L 800,340 L 800,560 L 0,560 Z" fill="#8ed67a"/>';
    out += '<path d="M 0,430 C 200,410 600,470 800,440 L 800,560 L 0,560 Z" fill="#d9cdbd"/>';
    return out;
  };

  BG.route = function (s) {
    var heure = s.heure || 'jour';
    var out = skyRect(heure);
    if (heure !== 'nuit') out += soleil(heure, 700, 86) + g('translate(180,100)', P.nuage({})) + g('translate(450,66) scale(.7)', P.nuage({}));
    out += '<path d="M 0,320 C 140,250 300,270 420,320 C 540,368 680,300 800,318 L 800,420 L 0,420 Z" fill="#8fc6a0"/>';
    out += '<rect x="0" y="380" width="800" height="180" fill="#6fbf5c"/>';
    out += '<path d="M -40,560 L 260,392 L 560,392 L 860,560 Z" fill="#6b6470"/>';
    out += line('M 400,400 L 400,430 M 400,460 L 400,500 M 400,530 L 400,570', '#fff6d6', 8);
    return out;
  };

  /* l'intérieur de la maison ; la fenêtre suit l'heure de la scène */
  BG.chambre = function (s) {
    var nuit = s.heure === 'nuit';
    var out = '<rect x="0" y="0" width="800" height="560" fill="' + (nuit ? '#e6bccd' : '#f7d8e6') + '"/>';
    out += '<rect x="0" y="0" width="800" height="112" fill="' + (nuit ? '#dcaec2' : '#f2c9dc') + '"/>';
    out += line('M 0,112 L 800,112', shade('#f2c9dc', -0.18), 4);
    out += '<rect x="0" y="400" width="800" height="160" fill="' + (nuit ? '#b07a52' : '#c98a5f') + '"/>';
    out += line('M 0,400 L 800,400', INK, 5);
    out += line('M 120,400 L 60,560 M 400,400 L 400,560 M 680,400 L 740,560', shade('#c98a5f', -0.12), 4);

    /* la fenêtre */
    out += '<rect x="520" y="120" width="204" height="152" rx="10" fill="' +
      (nuit ? '#1b2f57' : '#a9d6e8') + '" stroke="' + INK + '" stroke-width="7"/>';
    if (nuit) {
      out += g('translate(622,196)', P.etoile({ r: 11 }) + g('translate(-52,-30)', P.etoile({ r: 8 })) +
        g('translate(48,28)', P.etoile({ r: 7 })) + g('translate(30,-40)', P.lune({})));
    } else {
      out += g('translate(566,168) scale(.42)', P.nuage({}));
      out += g('translate(682,158) scale(.34)', P.soleil({}));
      out += '<rect x="520" y="228" width="204" height="44" fill="' + (nuit ? '#1b2f57' : '#8fb35c') + '"/>';
    }
    out += line('M 622,120 L 622,272 M 520,196 L 724,196', INK, 5);

    /* un cadre au mur */
    out += U(['<rect x="128" y="146" width="128" height="96" rx="6" fill="%F%" %S%/>'], '#fdf7ea', 8);
    out += g('translate(192,206) scale(.3)', P.arbre({}));
    return out;
  };

  BG.uni = function (s) {
    return skyRect(s.heure || 'jour') + '<rect x="0" y="400" width="800" height="160" fill="#8ed67a"/>';
  };

  /* ============================================================
     BULLES DE BD
     ============================================================ */

  function wrapText(t, max) {
    var words = t.split(' '), lines = [], cur = '', i;
    for (i = 0; i < words.length; i++) {
      var cand = cur ? cur + ' ' + words[i] : words[i];
      if (cand.length > max && cur) { lines.push(cur); cur = words[i]; }
      else cur = cand;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  /* combien de place prend cette bulle ? Le calcul est le même que celui du
     tracé — c'est volontaire : deux formules qui divergent, et la bulle se
     pose à côté de là où elle est dessinée. */
  function mesurerBulle(b) {
    var fs = b.fs || 25;
    var w = b.w || 250;
    var max = Math.max(6, Math.floor((w - 34) / (fs * 0.52)));
    var lignes = wrapText(b.t, max);
    return { w: w, h: lignes.length * (fs + 7) + 26, lignes: lignes.length };
  }

  function bubble(b) {
    var fs = b.fs || 25;
    var w = b.w || 250;
    var max = Math.max(6, Math.floor((w - 34) / (fs * 0.52)));
    var lines = wrapText(b.t, max);
    var lh = fs + 7;
    var h = lines.length * lh + 26;
    var x = b.x, y = b.y;
    var cx = x + w / 2;
    var tail;
    var tx = (b.tx !== undefined) ? b.tx : cx;
    var ty = (b.ty !== undefined) ? b.ty : y + h + 54;
    var pense = b.pense;
    var parts = ['<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (pense ? 26 : 20) + '" fill="%F%" %S%/>'];
    if (!pense) {
      var bx = Math.max(x + 20, Math.min(x + w - 46, tx - 14));
      parts.push('<path d="M ' + bx + ',' + (y + h - 10) + ' L ' + (bx + 32) + ',' + (y + h - 10) + ' L ' + tx + ',' + ty + ' Z" fill="%F%" %S%/>');
    } else {
      parts.push('<circle cx="' + (cx - 10) + '" cy="' + (y + h + 16) + '" r="12" fill="%F%" %S%/>');
      parts.push('<circle cx="' + (cx - 22) + '" cy="' + (y + h + 40) + '" r="7" fill="%F%" %S%/>');
    }
    var s = U(parts, b.fill || '#fdf7ea', 9);
    var ty0 = y + 18 + fs * 0.82;
    s += '<text x="' + cx + '" y="' + ty0 + '" text-anchor="middle" font-family="' + FONT + '" font-size="' + fs +
      '" font-weight="700" fill="' + INK + '">';
    for (var i = 0; i < lines.length; i++) {
      s += '<tspan x="' + cx + '" dy="' + (i === 0 ? 0 : lh) + '">' + esc(lines[i]) + '</tspan>';
    }
    s += '</text>';
    return s;
  }

  var FONT = "'Fredoka','Baloo 2','Comic Sans MS','Trebuchet MS',sans-serif";

  function esc(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function sfx(o) {
    var fs = o.fs || 54, c = o.color || '#ffd93d';
    return '<text x="0" y="0" text-anchor="middle" font-family="' + FONT + '" font-size="' + fs +
      '" font-weight="800" fill="' + c + '" stroke="' + INK + '" stroke-width="7" stroke-linejoin="round" paint-order="stroke" transform="rotate(' + (o.rot || -8) + ')">' +
      esc(o.t) + '</text>';
  }

  /* ============================================================
     REGISTRE DES ÉLÉMENTS
     ============================================================ */

  /* ------------------------------------------------------------
     Il n'y a volontairement AUCUN personnage nommé dans ce fichier.
     Ce qui est publié, ce sont les fabriques ; c'est l'utilisateur qui
     les règle depuis le créateur de personnages. Un personnage de scène
     s'écrit donc en entier, et le placement automatique n'a qu'un seul
     type d'objet à mesurer :

       { t: 'enfant', teint: '#f2c49a', cheveux: '#4a2f22',
         coiffure: 'carre', vetement: '#e0453c', pose: 'salue' }
     ------------------------------------------------------------ */
  /* Le vocabulaire commun à toutes les silhouettes. Une histoire n'a le
     droit d'écrire que ça : le contrôle des planches signale le reste. */
  var POSES = ['debout', 'salue', 'brasenlair', 'saute', 'court', 'assis',
    'montre', 'tient', 'hausse'];
  var HUMEURS = ['content', 'surpris', 'triste', 'dort', 'fache'];

  var SILHOUETTES = {
    enfant: function (o) { return enfant(o); },
    adulte: function (o) {
      var c = {}, k;
      for (k in o) if (o.hasOwnProperty(k)) c[k] = o[k];
      c.adulte = true;
      return enfant(c);
    },
    bebe: function (o) { return bebe(o); },
    animal: function (o) { return animal(o); },
    rond: function (o) { return rond(o); }
  };

  /* le bonhomme de neige et la peluche ne sont pas des personnages : on ne
     les règle pas, on les pose comme des objets */
  P.bonhommeneige = function (o) { return bonhommeNeige(o); };
  P.peluche = function (o) { return peluche(o); };

  var ITEMS = {};
  (function () {
    var k;
    for (k in P) if (P.hasOwnProperty(k)) ITEMS[k] = P[k];
    for (k in SILHOUETTES) if (SILHOUETTES.hasOwnProperty(k)) ITEMS[k] = SILHOUETTES[k];
  })();

  /* ombre portée au sol : ce qui pose vraiment un personnage sur le décor */
  var OMBRE = { bebe: 34, adulte: 50, rond: 52 };
  function ombre(t, pose) {
    if (!SILHOUETTES.hasOwnProperty(t) || pose === 'nage' || pose === 'saute') return '';
    var r = OMBRE.hasOwnProperty(t) ? OMBRE[t] : 46;
    if (!r) return '';
    return '<ellipse cx="6" cy="-3" rx="' + r + '" ry="' + (r * 0.23).toFixed(1) +
      '" fill="' + INK + '" opacity=".13"/>';
  }

  /* ============================================================
     RENDU DE SCÈNE
     ============================================================ */

  function renderItems(list, rang) {
    var out = '', i;
    if (!list) return '';
    for (i = 0; i < list.length; i++) {
      var it = list[i];
      var fn = ITEMS[it.t];
      if (!fn) continue;
      var sc = it.s === undefined ? 1 : it.s;
      var sx = it.flip ? -sc : sc;
      var rot = it.rot ? ' rotate(' + it.rot + ')' : '';
      var op = it.op !== undefined ? ' opacity="' + it.op + '"' : '';
      out += '<g data-t="' + it.t + '" data-rang="' + (rang || 'items') + '"' +
        ' transform="translate(' + (it.x || 0) + ',' + (it.y || 0) + ') scale(' + sx + ',' + sc + ')' + rot + '"' + op + '>' +
        ombre(it.t, it.pose) + fn(it) + '</g>';
    }
    return out;
  }

  function sceneSVG(s, opts) {
    opts = opts || {};
    var id = ++uid;
    var bgFn = BG[s.decor] || BG.uni;

    /* le dessin : décor, personnages, objets */
    var art = bgFn(s);
    if (s.flocons) art += flocons(s.flocons === true ? 26 : s.flocons);
    art += renderItems(s.fond, 'fond');
    art += renderItems(s.items, 'items');
    art += renderItems(s.avant, 'avant');

    /* le lettrage : bruitages et bulles, laissés nets */
    var letters = '';
    if (s.bruits) {
      for (var i = 0; i < s.bruits.length; i++) {
        var f = s.bruits[i];
        letters += '<g data-lettrage="bruit" transform="translate(' + f.x + ',' + f.y + ')">' + sfx(f) + '</g>';
      }
    }
    if (s.bulles && !opts.sansBulles) {
      for (var j = 0; j < s.bulles.length; j++) {
        letters += '<g data-lettrage="bulle">' + bubble(s.bulles[j]) + '</g>';
      }
    }

    /* le trait tremble légèrement, comme une encre posée à la main */
    var defs = '<defs><filter id="pl' + id + '" x="-4%" y="-4%" width="108%" height="108%">' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.021" numOctaves="1" seed="' + (id * 13 % 97) + '" result="t"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="t" scale="3" xChannelSelector="R" yChannelSelector="G"/>' +
      '</filter></defs>';

    /* voile chaud : tout est imprimé sur le même papier crème */
    var wash = '<rect x="0" y="0" width="' + VW + '" height="' + VH +
      '" fill="#e0c9a0" opacity=".10" style="mix-blend-mode:multiply"/>';

    /* en recadrage, on garde le bas de l'image : c'est là que se tiennent
       les personnages. Le ciel, lui, peut être rogné sans dommage. */
    var par = opts.rogne ? 'xMidYMax slice' : 'xMidYMid meet';
    /* un cadre permet de ne montrer qu'une partie de la case : c'est ce qui
       agrandit le dessin dans le jeu des différences */
    var c = opts.cadre;
    var vb = c ? (c.x + ' ' + c.y + ' ' + c.w + ' ' + c.h) : ('0 0 ' + VW + ' ' + VH);
    /* Le tremblé grignote les bords de la case : le déplacement va chercher
       des pixels hors du cadre et laisse passer le papier, ce qui dessine une
       dentelure blanche sur le pourtour. On repose donc le décor une fois,
       net, SOUS le dessin tremblé. On ne le voit que sur ces deux pixels de
       bordure — ailleurs il est entièrement recouvert. */
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb +
      '" preserveAspectRatio="' + par + '" role="img">' + defs +
      bgFn(s) +
      '<g filter="url(#pl' + id + ')">' + art + '</g>' + wash + letters + '</svg>';
  }

  /* une vignette : un seul élément, sans décor, pour les jeux */
  function vignetteSVG(it) {
    var fn = ITEMS[it.t];
    if (!fn) return '';
    var sc = it.ds === undefined ? 1 : it.ds;
    var y = it.dy === undefined ? 180 : it.dy;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" ' +
      'preserveAspectRatio="xMidYMid meet" role="img" aria-label="' + (it.nom || '') + '">' +
      '<g transform="translate(100,' + y + ') scale(' + sc + ')">' + fn(it) + '</g></svg>';
  }

  global.Art = {
    scene: sceneSVG,
    vignette: vignetteSVG,
    mesurerBulle: mesurerBulle,
    /* le catalogue, pour les outils et le créateur de personnages */
    silhouettes: SILHOUETTES,
    objets: P,
    decors: BG,
    coiffures: COIFFURES,
    hauts: LISTE_HAUTS,
    bas: LISTE_BAS,
    poses: POSES,
    humeurs: HUMEURS,
    INK: INK,
    W: VW,
    H: VH,
    shade: shade
  };
})(window);
