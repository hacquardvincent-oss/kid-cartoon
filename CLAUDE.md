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
assets/js/games.js    les jeux et leur cadre commun
assets/js/app.js      navigation, couverture, lecteur, compteur du soir
outils/               contrôle qualité des planches, aperçu, page unique
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

**Nouveauté de ce projet :** les personnages étant inventés par l'utilisateur,
leurs largeurs sont inconnues à l'écriture. Le placement ne peut plus être
écrit à la main dans les histoires — il doit devenir une **fonction de mise en
scène** qui mesure les personnages du casting, les espace sur la ligne de sol,
ajuste les échelles et place les bulles à l'écart des visages. L'outil de
contrôle existant devient donc le metteur en scène. C'est la première brique
technique à construire.

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

1. Poser la base propre : coquille, moteur de dessin sans aucun réglage sous
   licence, jeux, PWA, outils de contrôle.
2. **Le placement automatique des personnages** — tout le reste en dépend.
3. Le créateur de personnages, version minimale : trois silhouettes, les
   couleurs, six archétypes.
4. **Le gros du travail** : écrire une vingtaine de canevas d'histoires en
   casting par archétype, et vérifier qu'ils tiennent une fois personnalisés.
5. Élargir : silhouettes, garde-robe, décors, archétypes, histoires.

Le point 4 est le cœur du produit et le seul vrai risque. La technique suivra ;
c'est la qualité d'écriture qui fera qu'un parent rouvre l'application le soir
suivant.

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
