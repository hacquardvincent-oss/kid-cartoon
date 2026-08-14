/* ============================================================
   stories.js — les canevas d'histoires

   VOLONTAIREMENT VIDE. Le contenu de ce fichier repart de zéro :
   les histoires ne seront pas écrites pour des personnages nommés
   mais pour des ARCHÉTYPES (le grognon, la timide, le rapide…),
   distribués au moment de la lecture sur les personnages que la
   famille a créés. Tant que le créateur de personnages et le format
   des canevas ne sont pas posés, on n'écrit rien : une histoire
   écrite pour un héros nommé serait à réécrire entièrement.

   Ce fichier ne garde donc que trois choses :
     - THEMES      : les axes de rangement, qui traversent les univers
     - UNIVERSES   : la liste des recueils, vide pour l'instant
     - COUVERTURE  : la une, dessinée avec les silhouettes génériques
   ============================================================ */

/* Les thèmes traversent les univers, c'est tout leur intérêt : un parent
   cherche « une histoire sur le partage », pas « une histoire de pirates ».
   Les deux plus demandés sont Partager et Règles. */
var THEMES = [
  { id: 'amitie', nom: 'Amitié', emoji: '🤝' },
  { id: 'emotions', nom: 'Émotions', emoji: '💛' },
  { id: 'partager', nom: 'Partager', emoji: '🤲' },
  { id: 'regles', nom: 'Règles', emoji: '🚦' },
  { id: 'famille', nom: 'Famille', emoji: '🏠' },
  { id: 'grandir', nom: 'Grandir', emoji: '🌱' },
  { id: 'dehors', nom: 'Dehors', emoji: '🌳' },
  { id: 'nuit', nom: 'Nuit', emoji: '🌙' },
  { id: 'betises', nom: 'Bêtises', emoji: '🙃' }
];

/* Aucun recueil pour l'instant. Le format d'une entrée, pour mémoire :

   { id, name, emoji, tagline, c1, c2, cover: <scène>,
     stories: [ { id, title, subtitle, tag, minutes, themes: [],
                  cover: <scène>, pages: [ { scene, text } ] } ] }

   Il manque encore la brique qui décidera de `scene` : le placement
   automatique. Tant qu'il n'est pas là, une planche écrite à la main
   serait à replacer une fois les personnages devenus variables. */
var UNIVERSES = [];

/* ------------------------------------------------------------
   LA UNE

   Elle existe en deux compositions : un cadrage unique couperait les
   personnages sur un téléphone. L'affichage rogne le ciel (jamais les
   jambes), donc tout ce qui compte se tient dans le bas de la case.

   Les trois personnages sont des silhouettes génériques réglées ici :
   ce sont des figurants, pas des héros. Ils seront remplacés par la
   famille de l'enfant dès que le créateur de personnages existera.
   ------------------------------------------------------------ */
var FIGURANTS = {
  grande: {
    t: 'enfant', teint: '#f2c49a', cheveux: '#4a2f22', coiffure: 'boucles',
    vetement: '#3ec9c9', bord: '#fff1a8', barrette: '#ff5c8a'
  },
  petit: {
    t: 'enfant', teint: '#f7dcc4', cheveux: '#3c2a20', coiffure: 'carre',
    vetement: '#e8746b', bord: '#ffd9c9'
  },
  doudou: {
    t: 'rond', couleur: '#f0a24a', forme: 'poire', oreilles: 'rondes', museau: true
  },
  chien: {
    t: 'animal', poil: '#c9a06a', clair: '#f7e7cf', oreilles: 'tombantes'
  }
};

function figurant(cle, extra) {
  var base = FIGURANTS[cle], o = {}, k;
  for (k in base) if (base.hasOwnProperty(k)) o[k] = base[k];
  for (k in extra) if (extra.hasOwnProperty(k)) o[k] = extra[k];
  return o;
}

/* Mesuré sur écran réel : en plein écran, le cadrage ne montre qu'une bande
   verticale de la case. Sur un 430 × 932, il ne reste que 327 unités de
   large, centrées sur x = 400. C'est la contrainte qui commande les deux
   compositions — et la raison pour laquelle il y en a deux.
     · haut  : tout doit tenir entre x = 240 et x = 560
     · large : toute la largeur, mais seuls les 380 derniers y sont vus */
var COUVERTURE = {
  large: {
    decor: 'colline', heure: 'couchant',
    fond: [
      { t: 'arbre', x: 96, y: 448, s: 1, color: '#5f8f4e' },
      { t: 'maison', x: 752, y: 432, s: .44, roof: '#d8342b' }
    ],
    /* un personnage assis descend sous son point d'appui : on remonte son y */
    items: [
      figurant('grande', { x: 268, y: 530, s: 1, pose: 'salue' }),
      figurant('doudou', { x: 462, y: 528, s: .72, pose: 'debout' }),
      figurant('chien', { x: 628, y: 506, s: .76, pose: 'assis' })
    ],
    avant: [
      { t: 'fleur', x: 62, y: 552, s: 1.7, color: '#ff7ab8' },
      { t: 'fleur', x: 138, y: 546, s: 1.4, color: '#fff1a8' },
      { t: 'fleur', x: 740, y: 552, s: 1.6, color: '#a98cf0' },
      { t: 'papillon', x: 128, y: 252, s: 1.5, color: '#ffd93d' }
    ]
  },
  /* Deux personnages côte à côte ne tiennent pas dans 327 unités. On en met
     donc un seul — et il tient son doudou dans les bras, ce qui raconte
     l'application mieux qu'un alignement. */
  haut: {
    decor: 'colline', heure: 'couchant',
    fond: [
      { t: 'arbre', x: 246, y: 476, s: .62, color: '#5f8f4e' },
      { t: 'buisson', x: 552, y: 486, s: .66 }
    ],
    items: [
      figurant('grande', { x: 400, y: 532, s: 1.14, pose: 'tient' })
    ],
    avant: [
      figurant('doudou', { x: 400, y: 500, s: .4 }),
      { t: 'fleur', x: 282, y: 552, s: 1.4, color: '#fff1a8' },
      { t: 'fleur', x: 524, y: 548, s: 1.3, color: '#ff7ab8' },
      { t: 'papillon', x: 266, y: 232, s: 1.25, color: '#ffd93d' }
    ]
  }
};
