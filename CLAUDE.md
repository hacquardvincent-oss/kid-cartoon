# Le projet

Une application d'histoires du soir et de jeux pour les 3-6 ans, où **l'enfant
est le héros**. Le parent et l'enfant créent leurs personnages — la famille, les
copains, un super-héros, une princesse, un ami imaginaire — et l'application
fabrique à partir d'eux des bandes dessinées à lire le soir et des jeux.

Trois intentions, dans cet ordre : **amuser**, **rassurer**, **apprendre**.
Une histoire qui fait rire un enfant de quatre ans a fait son travail. Une
histoire qui lui donne les mots d'une émotion l'a mieux fait.

Le projet dérive d'une application familiale privée qui a servi de banc d'essai
pendant plusieurs mois : 63 histoires lues à une vraie enfant de quatre ans.
Ce qui suit encode ce qu'on y a appris.

---

## Règle absolue : aucune licence

Aucun personnage, nom, silhouette ou univers appartenant à quelqu'un d'autre.
Pas de Peppa, pas de Bluey, pas d'Elsa, pas de Monsieur Madame, pas de
« cochon rose avec le museau sur le côté ». Cette application a vocation à
être publiée : tout doit être original, dès le premier commit et dans tout
l'historique Git.

Si un personnage créé ressemble trop à une marque connue, c'est un défaut à
corriger, pas une fonctionnalité.

---

## Contraintes de conception

* **100 % hors ligne.** Aucune requête réseau, jamais. Pas de police distante,
  pas d'image distante, pas d'API, pas d'analytique. Tout le contenu est
  produit sur l'appareil.
* **Aucune donnée ne sort.** Les personnages, les prénoms, la progression
  vivent dans le `localStorage`. C'est une promesse produit autant qu'une
  simplification technique : une application pour enfants qui n'envoie rien
  n'a presque rien à déclarer.
* **Pas de build.** HTML, CSS et JavaScript à la main, sans dépendance et sans
  étape de compilation. On ouvre `index.html` et ça marche. Cette contrainte a
  tenu sur toute l'application précédente ; elle tient encore.
* **Mobile d'abord**, et testé sur des écrans réels de 360×640 à 430×932.
* **Rien à lire pour l'enfant.** Les boutons portent une image, le texte est
  pour l'adulte. Tout ce qui est important est aussi dit à voix haute
  (`speechSynthesis`, fr-FR).
* **PWA installable**, avec un service worker qui met tout en cache.

### Ce qu'on ne fait pas

Pas de compte, pas de publicité, pas d'achat intégré visible par l'enfant, pas
de génération par IA au moment du coucher (coût, latence, réseau, modération),
pas de photo importée, pas de classement ni de score comparatif entre enfants.

---

## Architecture

Quatre fichiers, un rôle chacun. C'est ce découpage qui a permis à
l'application précédente de grossir jusqu'à 419 planches sans devenir illisible.

```
index.html            la coquille : bandeau, menus, vues, lecteur
sw.js                 le service worker (cache et hors ligne)
manifest.webmanifest
assets/css/style.css  toute la mise en page, mobile d'abord
assets/js/art.js      le moteur de dessin SVG (silhouettes, décors, objets)
assets/js/scene.js    NOUVEAU : la mise en scène automatique
assets/js/perso.js    NOUVEAU : le créateur de personnages et leur stockage
assets/js/stories.js  les canevas d'histoires (avec des rôles, pas des noms)
assets/js/histoires.js  la distribution des rôles et la personnalisation
assets/js/games.js    les jeux et leur cadre commun
assets/js/app.js      navigation, couverture, lecteur, compteur du soir
outils/controle-planches.html   le contrôle qualité + le banc d'essai du placement
outils/silhouettes.html         chaque silhouette dans chaque pose et chaque humeur
outils/apercu-histoire.html     une histoire entière en planche-contact
outils/construire-page-unique.js  le site en un seul fichier
```

### Le vocabulaire est en français

Tout le vocabulaire du moteur — types d'éléments, décors, poses, humeurs,
propriétés de scène — est **en français**. Une planche s'écrit
`{ decor: 'jardin', heure: 'couchant', items: [{ t: 'enfant', pose: 'salue' }] }`.
Ce choix a été fait au premier commit, pendant que le fichier d'histoires
était vide : après trois cents planches, il aurait été trop tard.

---

## Le moteur de dessin — conventions à respecter

Tout est dessiné en SVG par du code. Il n'y a **aucun fichier image** en dehors
d'une texture de grain de 64 px.

* **Le repère.** Une scène fait `800 × 560`. Un personnage est dessiné depuis
  ses pieds à l'origine et s'élève vers les `y` négatifs. Le placer, c'est
  donner `{ t: 'type', x, y, s }` où `y` est le sol sous ses pieds.
* **Le contour d'union.** `U(parties, remplissage, épaisseur)` dessine les
  formes deux fois : une fois gonflées en trait d'encre, une fois remplies
  par-dessus. Le contour obtenu épouse **l'union** des formes, ce qui permet de
  coller une tête, un museau et deux oreilles sans voir les traits de
  construction. Les gabarits `%F%` et `%S%` y sont remplacés par le
  remplissage et le contour. **C'est l'astuce centrale du style : toute
  nouvelle forme doit passer par `U()`.**
* **L'encre** est toujours `#3a2a22`, jamais du noir pur.
* **Le tremblé.** Un `feTurbulence` + `feDisplacementMap` (scale 3) déplace
  légèrement chaque contour : c'est ce qui sort le dessin du rendu vectoriel
  trop lisse. Le lettrage, lui, reste net (hors du filtre).
* **Le grain.** Une texture de 64 px répétée en `multiply` par-dessus la page.
* **Le cadrage.** En plein écran, `preserveAspectRatio="xMidYMax slice"` :
  on rogne le ciel, jamais les jambes.
* **L'ombre au sol** sous chaque personnage : c'est elle qui le pose sur le
  décor. Sans elle il flotte.
* **Les poses** existantes : `debout`, `salue`, `brasenlair`, `saute`, `court`,
  `assis`, `montre`, `tient`, `hausse`. Les **humeurs** : `content`, `surpris`,
  `triste`, `dort`, `fache`. Toute silhouette doit honorer les cinq humeurs :
  une humeur ignorée retombe silencieusement sur le sourire, et c'est
  exactement le genre de défaut que l'œil ne voit pas.
* **Le décor est dessiné deux fois** : une fois net, sous le dessin tremblé.
  Sans ça, le `feDisplacementMap` va chercher des pixels hors du cadre et
  dessine une dentelure blanche tout autour de la case.

### Direction artistique

Celle des magazines de lecture jeunesse : papier crème, grain d'impression,
bandeau rouge, titres ronds, palette gouache, trait d'encre légèrement tremblé.
Le texte des histoires est composé dans un vrai caractère de lecture (Literata),
les titres dans un caractère rond (Fredoka). Les deux polices sont embarquées.

---

## Les règles de composition

Elles viennent d'un contrôle automatique qui a trouvé des dizaines de défauts
que l'œil laissait passer. **Portez cet outil dès le début du projet**, avant
d'écrire la dixième histoire.

L'outil charge chaque planche dans un navigateur, mesure la boîte réelle de
chaque élément (`getBBox` recalculé dans le repère de la scène) et signale :

1. **Hors cadre** — un personnage qui dépasse les 800 × 560.
2. **Lettrage sur un visage** — une bulle ou un bruitage qui couvre une tête.
3. **Corps qui se chevauchent** — deux personnages qui se marchent dessus.

Ce qu'on a appris et qui doit être encodé dans le placement automatique :

* un personnage fait **160 à 230 unités de large** bras compris ; il faut au
  moins **190 unités** entre deux centres ;
* un personnage **assis descend sous son point d'appui** : il faut remonter son
  `y` d'environ 14 unités, sinon les pieds sortent du cadre ;
* une **bulle doit être près de celui qui parle** — une queue de plus de 300
  unités traverse la case et devient illisible ;
* un bruitage au-dessus d'une tête, c'est la convention de la BD ; un bruitage
  **sur** un visage, c'est un défaut.

### Le placement automatique — `assets/js/scene.js`

C'est fait, et c'est la brique dont tout le reste dépend. Une histoire n'écrit
plus de coordonnées : elle donne un casting et dit qui parle.

```js
Scene.composer({
  decor: 'campement', heure: 'couchant',
  casting: [ perso, perso, perso ],        // réglages complets + pose
  bulles: [ { qui: 0, t: 'Regarde le feu !' } ],
  bruits: [ { qui: 2, t: 'CRAC !' } ]
})
```

**On mesure, on ne devine pas.** Chaque personnage est dessiné seul dans un SVG
hors écran et le navigateur donne sa boîte réelle, traits d'encre compris.
Chaque silhouette marque sa tête (`data-tete`), donc on a aussi la boîte du
visage : c'est ce qui permet de poser une bulle *à côté* d'un visage. Les
mesures sont mises en cache par signature de réglages.

Ce que le placement a appris, et qu'il ne faut pas défaire :

* **On place par les bords, jamais par les centres.** Une pose `salue` tend un
  bras de 40 unités d'un seul côté. Deux personnages « espacés de 200 » se
  touchent quand même. La règle des 190 unités entre centres reste, par-dessus.
* **On vise haut en hauteur, et c'est la largeur qui fait redescendre.**
  Choisir l'échelle d'après le nombre de personnages donne des planches à
  moitié vides. On fait remplir la hauteur au plus grand, puis on serre
  jusqu'à ce que la rangée tienne — d'abord l'air entre les corps, ensuite
  l'échelle de tout le monde, en reposant à chaque tour.
* **Les tailles relatives sont dans `TAILLES`.** Sans elles, l'adulte et
  l'enfant sortent de la même fabrique et font la même hauteur.
* **Un personnage assis se remonte de ce que la mesure dit**, pas d'une
  constante de 14 unités.
* **Chaque décor a sa ligne de sol** (`SOLS`). Dans le décor « ruisseau »,
  l'eau est au premier plan : un personnage posé à 526 a les pieds dedans.

### Le contrôle

`Scene.controler(scene)` mesure la planche **réellement dessinée** — pas le
modèle qui l'a produite — et signale : hors cadre, lettrage sur un visage,
corps qui se chevauchent, queue de bulle trop longue. Il attrape donc aussi
les planches écrites à la main.

`outils/controle-planches.html` porte une dernière planche **volontairement
fautive** : si l'outil n'y trouve pas ses cinq défauts, c'est l'outil qui est
cassé. `outils/silhouettes.html` compare les dessins deux à deux et signale
une pose ou une humeur qu'une fabrique ignore — c'est comme ça qu'on a
découvert que le bébé ne savait ni courir, ni sauter, ni montrer du doigt.

---

## Les personnages créés par l'utilisateur

**Le cadre est volontairement fermé** : un espace de création borné produit de
meilleurs résultats qu'un espace ouvert, et reste maîtrisable côté écriture.

* **Silhouettes** : cinq fabriques paramétrées — `enfant`, `adulte` (la même,
  avec la tête réduite de 14 % : c'est la proportion, pas la taille, qui fait
  l'adulte), `bebe`, `animal` (les oreilles font l'espèce : `pointues`,
  `rondes`, `tombantes`, `longues`), `rond` (les doudous et les amis
  imaginaires : un gros corps, une tête soudée dessus par `U()`, des
  oreilles). Toute silhouette ajoutée profite à tous.
* **Il n'y a aucun personnage nommé dans `art.js`.** Le registre publie les
  fabriques, pas des héros. Un personnage s'écrit en entier dans la scène,
  ce qui donne au placement automatique un seul type d'objet à mesurer.
* **Réglages** : teint, couleur et style de cheveux, couleur de vêtement,
  accessoires (lunettes, couronne, cape, chapeau, masque).
* **Identité** : un prénom, un lien (moi, maman, papa, frère, sœur, copain,
  doudou, imaginaire).
* **Un archétype**, et c'est le champ le plus important.

### Les six archétypes retenus

`Grognon`, `Timide`, `Rapide`, `Curieuse`, `Farceur`, `Range-tout`. Trois
moteurs (ça déclenche) et trois freins (ça soigne) : de quoi armer une
histoire des deux côtés. **L'article est genré mais le tempérament ne l'est
pas** — on donne « Range-tout » à un papa et « Grognon » à une mamie, et
c'est précisément ce qui permet d'écrire des phrases précises tout en les
appliquant à n'importe quelle famille.

### Les archétypes commandent tout

Les histoires ne sont pas écrites pour des rôles vides (« LE HÉROS ») — ça
produit une prose plate. Elles sont écrites pour des **tempéraments** : le
grognon, la timide, le rapide, la lente, la curieuse, le farceur, le costaud,
la range-tout. C'est ce qui permet de garder des phrases précises tout en les
appliquant à la mamie ou au doudou de l'enfant.

Conséquence de dimensionnement : **plafonner le nombre de personnages pour
l'ergonomie** (8 à 12, une grille qui tient sur un écran), mais **plafonner le
nombre d'archétypes pour maîtriser le volume d'écriture**. C'est le nombre
d'archétypes, pas le nombre de personnages, qui détermine combien d'histoires
il faut écrire.

---

## Écrire une histoire

Une histoire fait **6 ou 7 planches**. Chaque planche est une scène dessinée et
un paragraphe de 2 à 4 phrases.

La voix, telle qu'elle a fait ses preuves :

* des phrases **courtes et déclaratives**, au passé simple ;
* **une émotion nommée** — « ça s'appelle la jalousie », « c'est ça, la honte » ;
* **une réparation concrète**, pas une leçon : on replante six graines, on
  recolle la danseuse, on remet le chapeau sur la tête ;
* **pas de morale finale**. La dernière phrase constate, elle ne conclut pas :
  « Roxane trouva ça très laid. Elle en mit un quand même. C'est ça, réparer. »
* un peu d'**humour d'adulte** qui passe au-dessus de l'enfant sans le gêner :
  « Elle dit non, une seule fois, calmement, ce qui est très énervant. »
* l'adulte n'est pas tout-puissant : il se trompe, il attend, il dit pardon.

Structure qui marche : on installe une situation normale, un grain de sable, le
sentiment monte et est nommé, quelqu'un propose autre chose, on essaie, ça
tient — et la dernière planche montre le lendemain.

### Le format d'un canevas — `assets/js/stories.js`

Un canevas ne connaît **aucun prénom**. Il décrit des rôles tenus par des
archétypes ; `histoires.js` les distribue sur la famille à la lecture.
Aucune planche ne porte de coordonnée : elle dit qui est là et ce qu'ils
font, `Scene.composer` place.

```js
roles: [ { cle: 'rapide', archetype: 'rapide', enfant: true },
         { cle: 'grand', adulte: true } ],
planches: [ { decor: 'chambre', qui: ['rapide', 'grand'],
              poses: { rapide: 'assis' }, humeurs: { rapide: 'fache' },
              bulles: [ { qui: 'grand', t: 'On souffle comme un dragon ?' } ],
              texte: '{grand} arriva. {Il:grand} ne ramassa rien.' } ]
```

Le gabarit de texte est minuscule et le restera : `{role}` le prénom,
`{il:role}` / `{Il:role}`, `{lui:role}`, `{e:role}` pour l'accord
(« essoufflé{e:grand} »). **Le français impose le genre** — c'est pour ça
que chaque personnage en porte un, et c'est un réglage de phrase, pas de
dessin. Dès qu'un gabarit devient malin, l'écriture devient illisible.

### La distribution

* **Elle est figée à la première lecture.** Sans ça l'histoire changerait
  de héros d'un soir à l'autre, et à quatre ans ce n'est plus la même
  histoire.
* **Personne ne tient deux rôles** dans la même planche.
* **`moi` passe devant à qualité égale, jamais devant l'archétype.** Une
  curieuse qui jouerait la range-tout s'entendrait dire « les gens qui
  rangent voient tout » — et ce serait faux pour elle. Conséquence :
  **c'est le corpus qui doit couvrir les six tempéraments** pour que
  chaque enfant soit héros d'un bon tiers des histoires. C'est la vraie
  raison du chiffre six.
* **Une famille vide doit pouvoir lire.** Les rôles sans preneur sont
  tenus par une troupe de figurants (`TROUPE` dans `histoires.js`).

### Thèmes

Ils traversent les univers, c'est tout leur intérêt : **Amitié, Émotions,
Partager, Règles, Famille, Grandir, Dehors, Nuit, Bêtises**. Les deux plus
demandés par les parents sont **Partager** et **Règles**.

---

## Les jeux

Trois principes, non négociables : **on ne perd jamais**, **on n'a rien à
lire**, **une manche se joue en un seul geste**.

Un cadre commun gère les manches, les étoiles et les félicitations ; un jeu
n'a qu'à fournir sa fonction de manche et appeler `api.reussi()`. Un jeu peut
demander un **choix préalable** (quel prénom, quelle lettre) et se déclarer
**plein écran** quand il a besoin de toute la place.

Les jeux qui se transposent presque sans travail :

* **Les différences** — le jeu se fabrique tout seul à partir de n'importe
  quelle scène : il retouche la case (un objet retiré, un autre agrandi, un
  personnage retourné, une humeur changée, un élément ajouté). Deux leçons
  durement acquises : une seule retouche par élément, et **choisir d'abord la
  fenêtre** qu'on va montrer, puis ne retoucher que ce qui s'y trouve — c'est
  ce qui garantit un dessin assez grand sur un téléphone. Il doit tenir en
  entier à l'écran, sans défilement.
* **Écrire les prénoms** — chaque lettre est un tracé SVG échantillonné par le
  navigateur (`getPointAtLength`), donc de vraies courbes. Ce jeu prend une
  liste de prénoms : il utilisera **automatiquement ceux de la famille créée**.
* **L'alphabet** — reconnaître la lettre parmi trois, puis la tracer.
* **Relier** et **compter** — piochent dans les personnages créés.

---

## Ordre de construction

1. ~~Poser la base propre : coquille, moteur de dessin sans aucun réglage sous
   licence, jeux, PWA, outils de contrôle.~~ **Fait.**
2. ~~**Le placement automatique des personnages** — tout le reste en dépend.~~
   **Fait** (`assets/js/scene.js`).
3. ~~Le créateur de personnages, version minimale : trois silhouettes, les
   couleurs, six archétypes.~~ **Fait** (`assets/js/perso.js`) — cinq
   silhouettes plutôt que trois, puisqu'elles étaient toutes prêtes.
4. **Le gros du travail** : écrire une vingtaine de canevas d'histoires en
   casting par archétype, et vérifier qu'ils tiennent une fois personnalisés.
   **Commencé** : le format est posé et trois histoires sont écrites
   (`La tour`, `Le seau rouge`, `Derrière la haie`). Il en manque dix-sept,
   et il faut qu'elles couvrent les six tempéraments.
5. Élargir : silhouettes, garde-robe, décors, archétypes, histoires.

Le point 4 est le cœur du produit et le seul vrai risque. La technique suivra ;
c'est la qualité d'écriture qui fera qu'un parent rouvre l'application le soir
suivant.

---

## Décisions prises

* **La garde-robe : deux réglages, pas un.** `haut` (tee-shirt, pull, robe) et
  `bas` (pantalon, short, jupe), découplés. **Fait.** Un vêtement posé sur un
  membre, c'est le *même* tracé redessiné dont on ne montre que le début
  (`pathLength="100"` + `stroke-dasharray`) : une manche courte, c'est 34, un
  pantalon, c'est 86. L'astuce vaut pour toutes les poses d'un coup — la
  découper à la main aurait voulu dire un vêtement par pose, et neuf
  occasions de se tromper. Le bloc de hanche est dessiné **avec le buste**,
  pas avec les jambes : c'est le buste qui suit la pose quand on s'assoit.
  On habille le bas d'abord, le haut par-dessus : une robe sur un pantalon
  se dessine toute seule.
* **Six archétypes.** C'est ce chiffre, et pas le nombre de personnages, qui
  fixe le volume d'écriture : six tempéraments × une vingtaine de canevas.
* **Le parent peut relire et modifier une histoire avant le coucher.**
  Conséquence directe sur le stockage : on ne garde pas seulement le canevas,
  on **fige la version personnalisée** au moment où elle est lue. Le format de
  sauvegarde doit le prévoir dès le départ.

## Ce qui manque encore, et qu'on sait déjà

* **Le parent ne peut pas encore relire ni modifier une histoire.** La
  décision est prise et le stockage la prépare (la distribution est figée),
  mais l'écran d'édition n'existe pas.
* **Les accessoires `cape` et `masque` n'existent pas encore** dans le
  moteur — le créateur ne propose donc que lunettes, couronne, chapeau,
  nœuds et barrette.
* **Un personnage supprimé casse les histoires déjà lues.** On a choisi de ne
  PAS recopier le casting dans l'histoire. Il faut donc décider ce qui se
  passe quand l'enfant supprime le doudou dont une histoire d'hier se
  souvient : une silhouette de repli ? l'histoire qui disparaît des « déjà
  lues » ? un avertissement au parent au moment de la suppression ? À trancher
  avant d'écrire le stockage des personnages.
* ~~**Les jeux tiennent un casting d'attente.**~~ **Fait** : les jeux
  demandent `casting()` et `prenoms()`, qui répondent la famille dès
  qu'elle existe, et les figurants sinon. Aucun jeu n'a eu à changer.
  Les scènes du jeu des différences ne portent plus aucune coordonnée :
  elles passent par `Scene.composer`, donc elles marchent avec la famille
  de n'importe qui.

---

## Méthode de travail

* **Vérifier en regardant.** Chaque planche produite doit être rendue et
  observée, pas seulement écrite. L'outil d'aperçu affiche une histoire entière
  en planche-contact.
* **Faire tourner le contrôle automatique** après chaque lot d'histoires, et
  corriger avant d'en écrire d'autres.
* **Tester sur plusieurs tailles d'écran** avant de considérer une vue finie.
* **Commenter en français**, en expliquant *pourquoi* plutôt que *quoi*. Le
  code de ce projet se lit comme un carnet d'atelier.
* Après toute modification, penser à changer la version en tête de `sw.js`,
  sinon les appareils déjà installés continuent de servir l'ancienne version.
