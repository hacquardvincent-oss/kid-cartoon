/* ============================================================
   stories.js — les canevas d'histoires

   Les histoires ne sont pas écrites pour des personnages nommés mais
   pour des ARCHÉTYPES (le grognon, la timide, le rapide…), distribués
   au moment de la lecture sur les personnages que la famille a créés.
   C'est `histoires.js` qui fait cette distribution ; ici, on écrit.

   Ce fichier contient :
     - THEMES      : les axes de rangement, qui traversent les recueils
     - UNIVERSES   : rempli par histoires.js au démarrage
     - COUVERTURE  : la une
     - CANEVAS     : les histoires elles-mêmes
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

/* Rempli au démarrage par `histoires.js`, qui personnalise chaque canevas
   avec la famille du moment. On ne l'écrit jamais à la main. */
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
    vetement: '#e8746b', haut: 'teeshirt', bas: 'short', couleurBas: '#4a6ea8'
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

/* ============================================================
   LES CANEVAS

   Un canevas ne connaît aucun prénom. Il décrit des RÔLES tenus par des
   ARCHÉTYPES, et `histoires.js` les distribue sur la famille au moment de
   la lecture. Aucune planche ne porte de coordonnée : elle dit qui est là
   et ce qu'ils font, la mise en scène place.

   La voix, telle qu'elle a fait ses preuves sur soixante-trois histoires :
   des phrases courtes au passé simple, une émotion NOMMÉE, une réparation
   concrète, pas de morale finale — la dernière phrase constate, elle ne
   conclut pas —, et un peu d'humour qui passe au-dessus de l'enfant sans
   le gêner. L'adulte n'est pas tout-puissant : il attend, il se trompe,
   il arrive essoufflé avec une chaussette à la main.
   ============================================================ */
var CANEVAS = [

  /* ---------------------------------------------------------- */
  {
    id: 'la-tour',
    titre: 'La tour',
    sous: 'la colère, et ce qu\'on en fait',
    themes: ['Émotions', 'Bêtises'],
    minutes: 4,
    roles: [
      { cle: 'rapide', archetype: 'rapide', enfant: true },
      { cle: 'temoin', archetype: 'rangetout', enfant: true },
      { cle: 'grand', adulte: true }
    ],
    planches: [
      {
        decor: 'chambre', heure: 'jour',
        qui: ['rapide', 'temoin'],
        poses: { rapide: 'assis', temoin: 'debout' },
        fond: [{ t: 'etagere', x: 160, y: 400, s: .85 }],
        avant: [{ t: 'tourcubes', x: 690, y: 552, s: .9, n: 5 }],
        texte: '{rapide} posa un cube, puis un autre, puis encore un autre. ' +
          'La tour montait bien. {temoin} regardait sans rien dire, ce qui est ' +
          'une façon de participer.'
      },
      {
        decor: 'chambre', heure: 'jour',
        qui: ['rapide', 'temoin'],
        poses: { rapide: 'brasenlair', temoin: 'hausse' },
        humeurs: { rapide: 'surpris', temoin: 'surpris' },
        bruits: [{ qui: 'rapide', t: 'BADABOUM !' }],
        avant: [{ t: 'cube', x: 660, y: 550, s: 1.3, color: '#e0453c' },
          { t: 'cube', x: 730, y: 556, s: 1.2, color: '#4a7fc1' },
          { t: 'cube', x: 116, y: 552, s: 1.2, color: '#7ab648' }],
        texte: 'Au huitième cube, la tour pencha. Puis elle tomba. Les cubes ' +
          'roulèrent sous le lit, là où on ne les retrouve jamais.'
      },
      {
        decor: 'chambre', heure: 'jour',
        qui: ['rapide'],
        poses: { rapide: 'brasenlair' }, humeurs: { rapide: 'fache' },
        bruits: [{ qui: 'rapide', t: 'AAAAH !' }],
        texte: '{rapide} tapa le sol avec sa main. {Il:rapide} cria très fort. ' +
          '{Il:rapide} n\'était pas triste : {il:rapide} était en colère. ' +
          'Ça s\'appelle la colère, et ça fait très chaud dans la poitrine.'
      },
      {
        decor: 'chambre', heure: 'jour',
        qui: ['rapide', 'grand'],
        poses: { rapide: 'assis', grand: 'assis' },
        humeurs: { rapide: 'fache', grand: 'content' },
        texte: '{grand} arriva. {Il:grand} ne ramassa rien du tout. ' +
          '{Il:grand} s\'assit par terre, à côté, et {il:grand} attendit. ' +
          'C\'est très long, quand on attend avec quelqu\'un qui crie.'
      },
      {
        decor: 'chambre', heure: 'jour',
        qui: ['grand', 'rapide'],
        poses: { grand: 'montre', rapide: 'debout' },
        humeurs: { rapide: 'triste' },
        bulles: [{ qui: 'grand', t: 'On souffle comme un dragon ?' }],
        texte: '{rapide} souffla une première fois pour rien, une deuxième fois ' +
          'pour de vrai, et une troisième fois parce que c\'était rigolo.'
      },
      {
        decor: 'chambre', heure: 'jour',
        qui: ['rapide', 'temoin', 'grand'],
        poses: { rapide: 'tient', temoin: 'montre', grand: 'tient' },
        avant: [{ t: 'tourcubes', x: 700, y: 552, s: .8, n: 3 }],
        texte: 'On refit la tour autrement : large en bas, petite en haut. ' +
          'Elle était beaucoup moins jolie. Elle ne tomba pas.'
      },
      {
        decor: 'chambre', heure: 'matin',
        qui: ['rapide'],
        poses: { rapide: 'montre' },
        avant: [{ t: 'tourcubes', x: 660, y: 552, s: .8, n: 3 }],
        texte: 'Le lendemain matin, la tour était encore debout. {rapide} la ' +
          'regarda un moment. Puis {il:rapide} la fit tomber exprès, pour voir.'
      }
    ]
  },

  /* ---------------------------------------------------------- */
  {
    id: 'le-seau-rouge',
    titre: 'Le seau rouge',
    sous: 'demander, c\'est difficile',
    themes: ['Partager', 'Amitié'],
    minutes: 4,
    roles: [
      { cle: 'proprio', archetype: 'rangetout', enfant: true },
      { cle: 'timide', archetype: 'timide', enfant: true },
      { cle: 'grand', adulte: true }
    ],
    planches: [
      {
        decor: 'plage', heure: 'jour',
        qui: ['proprio'],
        poses: { proprio: 'assis' },
        fond: [{ t: 'parasol', x: 120, y: 430, s: .9, color: '#ff5c8a' }],
        avant: [{ t: 'seau', x: 640, y: 532, s: 1.1, color: '#e0453c' },
          { t: 'coquillage', x: 730, y: 552, s: 1.6 },
          { t: 'coquillage', x: 100, y: 550, s: 1.4 }],
        texte: '{proprio} avait un seau rouge. {Il:proprio} y rangeait les ' +
          'coquillages par taille : les grands d\'un côté, les petits de l\'autre, ' +
          'et les cassés nulle part.'
      },
      {
        decor: 'plage', heure: 'jour',
        qui: ['timide', 'proprio'],
        poses: { timide: 'debout', proprio: 'assis' },
        humeurs: { timide: 'triste' },
        avant: [{ t: 'seau', x: 700, y: 532, s: 1.1, color: '#e0453c' }],
        texte: '{timide} regardait le seau. {Il:timide} le voulait très fort. ' +
          '{Il:timide} ouvrit la bouche pour demander, et il n\'en sortit rien du tout.'
      },
      {
        decor: 'plage', heure: 'jour',
        qui: ['timide', 'proprio'],
        poses: { timide: 'tient', proprio: 'montre' },
        humeurs: { timide: 'surpris', proprio: 'fache' },
        bulles: [{ qui: 'proprio', t: 'Rends-le !' }],
        texte: 'Quand {proprio} regarda ailleurs, {timide} prit le seau. ' +
          '{Il:proprio} le vit tout de suite. Les gens qui rangent voient tout.'
      },
      {
        decor: 'plage', heure: 'jour',
        qui: ['timide'],
        poses: { timide: 'debout' }, humeurs: { timide: 'triste' },
        texte: '{timide} rendit le seau. {Il:timide} avait très chaud aux oreilles. ' +
          'Ça s\'appelle la honte, et ça arrive toujours après l\'envie, ' +
          'jamais avant.'
      },
      {
        decor: 'plage', heure: 'jour',
        qui: ['grand', 'timide'],
        poses: { grand: 'assis', timide: 'debout' },
        bulles: [{ qui: 'grand', t: 'Tu peux demander, tu sais.' }],
        texte: '{grand} ne gronda personne. {Il:grand} dit seulement ça, et ' +
          'retourna lire. {timide} demanda. {Il:timide} demanda si bas que ' +
          'personne n\'entendit.'
      },
      {
        decor: 'plage', heure: 'jour',
        qui: ['timide', 'proprio'],
        poses: { timide: 'montre', proprio: 'tient' },
        humeurs: { proprio: 'content' },
        avant: [{ t: 'seau', x: 690, y: 532, s: 1.1, color: '#e0453c' }],
        texte: '{Il:timide} demanda une deuxième fois, un peu plus fort. ' +
          '{proprio} réfléchit très longtemps, pour le plaisir. Puis {il:proprio} ' +
          'dit oui — à condition de ranger les coquillages par taille.'
      },
      {
        decor: 'plage', heure: 'couchant',
        qui: ['timide', 'proprio'],
        poses: { timide: 'salue', proprio: 'tient' },
        avant: [{ t: 'seau', x: 700, y: 532, s: 1.1, color: '#e0453c' },
          { t: 'chateausable', x: 120, y: 552, s: .7 }],
        texte: 'Le lendemain, {timide} demanda tout de suite. {proprio} dit non. ' +
          '{Il:timide} demanda encore, et cette fois {il:proprio} dit oui. ' +
          'Ça marche une fois sur deux. C\'est déjà beaucoup.'
      }
    ]
  },

  /* ---------------------------------------------------------- */
  {
    id: 'derriere-la-haie',
    titre: 'Derrière la haie',
    sous: 'la règle, et pourquoi elle existe',
    themes: ['Règles', 'Dehors'],
    minutes: 4,
    roles: [
      { cle: 'curieuse', archetype: 'curieuse', enfant: true },
      { cle: 'grand', adulte: true }
    ],
    planches: [
      {
        decor: 'jardin', heure: 'jour',
        qui: ['curieuse'],
        poses: { curieuse: 'montre' },
        fond: [{ t: 'buisson', x: 120, y: 402, s: 1.3 }, { t: 'buisson', x: 300, y: 402, s: 1.3 },
          { t: 'buisson', x: 480, y: 402, s: 1.3 }, { t: 'buisson', x: 660, y: 402, s: 1.3 }],
        avant: [{ t: 'fleur', x: 90, y: 550, s: 1.6 }],
        texte: 'Au fond du jardin, il y avait une haie. Derrière la haie, on ne ' +
          'savait pas. C\'est exactement le genre de chose que {curieuse} ne ' +
          'supporte pas.'
      },
      {
        decor: 'jardin', heure: 'jour',
        qui: ['grand', 'curieuse'],
        poses: { grand: 'montre', curieuse: 'hausse' },
        bulles: [{ qui: 'grand', t: 'On ne passe pas derrière la haie.' }],
        fond: [{ t: 'buisson', x: 160, y: 402, s: 1.3 }, { t: 'buisson', x: 640, y: 402, s: 1.3 }],
        texte: '{grand} le dit une seule fois, calmement, ce qui est très ' +
          'énervant. Puis {il:grand} retourna étendre le linge.'
      },
      {
        decor: 'foret', heure: 'gris',
        qui: ['curieuse'],
        poses: { curieuse: 'debout' }, humeurs: { curieuse: 'surpris' },
        texte: '{curieuse} trouva un trou. {Il:curieuse} passa la tête, puis une ' +
          'épaule, puis tout le reste. De l\'autre côté, il y avait des arbres ' +
          'serrés, tout gris, et personne dedans.'
      },
      {
        decor: 'foret', heure: 'gris',
        qui: ['curieuse'],
        poses: { curieuse: 'hausse' }, humeurs: { curieuse: 'triste' },
        texte: '{Il:curieuse} se retourna. La haie était pareille partout. Le trou ' +
          'avait disparu. {Il:curieuse} eut froid dans le ventre : ça s\'appelle ' +
          'la peur.'
      },
      {
        decor: 'foret', heure: 'gris',
        qui: ['curieuse', 'grand'],
        poses: { curieuse: 'brasenlair', grand: 'court' },
        humeurs: { curieuse: 'triste', grand: 'surpris' },
        bruits: [{ qui: 'curieuse', t: 'OHÉ !' }],
        texte: '{Il:curieuse} appela. Pas très fort, parce qu\'appeler, c\'est déjà ' +
          'avouer. {grand} arriva en trois secondes, essoufflé{e:grand}, avec une ' +
          'chaussette à la main.'
      },
      {
        decor: 'jardin', heure: 'jour',
        qui: ['grand', 'curieuse'],
        poses: { grand: 'montre', curieuse: 'debout' },
        fond: [{ t: 'buisson', x: 200, y: 402, s: 1.3 }, { t: 'buisson', x: 620, y: 402, s: 1.3 }],
        avant: [{ t: 'fleur', x: 740, y: 550, s: 1.6, color: '#e0453c' }],
        texte: '{grand} ne gronda pas tout de suite. {Il:grand} montra la route, ' +
          'juste derrière les arbres, et les voitures dessus. C\'est pour ça, ' +
          'la règle. Puis {il:grand} attacha un ruban rouge à la branche du trou.'
      },
      {
        decor: 'jardin', heure: 'matin',
        qui: ['curieuse'],
        poses: { curieuse: 'montre' },
        fond: [{ t: 'buisson', x: 180, y: 402, s: 1.3 }, { t: 'buisson', x: 620, y: 402, s: 1.3 }],
        avant: [{ t: 'fleur', x: 700, y: 548, s: 1.7, color: '#e0453c' }],
        texte: 'Le lendemain, {curieuse} alla jusqu\'au ruban. {Il:curieuse} ' +
          's\'arrêta. {Il:curieuse} passa la tête, regarda bien, et revint. ' +
          'Le ruban est toujours là.'
      }
    ]
  }
];
