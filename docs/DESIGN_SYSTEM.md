# Design system — Drop Service

Ce document fixe les règles d'interface du produit. Le but n'est pas de « faire SaaS », mais de donner à un artisan une interface immédiatement compréhensible, cohérente et crédible.

## Principe directeur

Chaque écran doit répondre rapidement à trois questions :

1. Où suis-je ?
2. Qu'est-ce qui mérite mon attention ?
3. Quelle est la prochaine action utile ?

Le design est un outil de travail. Aucun composant n'est ajouté uniquement pour décorer ou donner une apparence technologique.

## Hiérarchie d'action

- Une action primaire dominante maximum par état d'écran.
- Une action primaire utilise la couleur de marque.
- Les actions secondaires utilisent un bouton neutre, un lien ou un menu.
- Les actions destructrices n'utilisent jamais la couleur de marque : rouge uniquement.
- Les libellés doivent décrire le résultat : « Envoyer ma demande », « Ouvrir ma page client », « Voir la demande », « Marquer comme contacté ».
- Éviter les libellés vagues quand un résultat précis est possible : « Continuer », « Valider », « Action », « Gérer ».

## Palette

- Fond application : `#F7F8FA`
- Surface : `#FFFFFF`
- Texte principal : `#17212B`
- Texte secondaire : `#667085`
- Bordures : `#E4E7EC`
- Action / marque : `#1769E0`
- Action hover : `#1257BC`
- Succès : `#16835B`
- Attention : `#B7791F`
- Erreur / danger : `#C9362B`

La couleur doit toujours avoir une signification stable. Le vert signifie réussite, le rouge danger/erreur/perdu, l'ambre attention. Ne pas créer une couleur différente pour chaque carte.

## Typographie

Pile système privilégiée pour vitesse et fiabilité : `Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif`.

- Titres courts, orientés tâche.
- Texte métier simple et français.
- Hiérarchie par taille, graisse, espace et position — pas par effets visuels.
- Pas de slogans génériques dans l'application.

## Composants

### Boutons

- Hauteur minimum desktop : 44 px.
- Mobile : 48 px lorsque le bouton est une action principale.
- Rayon modéré : environ 10 px.
- Un vrai état hover, focus, disabled et active.
- Focus clavier toujours visible.

### Champs

- Label au-dessus du champ.
- Texte d'aide uniquement s'il réduit une hésitation réelle.
- Placeholder comme exemple, jamais comme remplacement du label.
- Erreur = expliquer ce qui s'est passé et quoi faire.

### Cartes

Ne pas mettre tout dans une carte. Utiliser une carte uniquement quand elle représente une vraie unité d'information. Pour les données répétitives, préférer tableau, liste, bandeau de métriques ou section simple.

### Tableaux

- La donnée la plus utile doit être à gauche.
- Le nom du client est un lien direct vers la demande.
- Statut modifiable sans ouvrir une autre page quand cela fait gagner du temps.
- Les actions de ligne restent visuellement secondaires.
- Sur mobile, le tableau peut défiler horizontalement tant qu'une future vue mobile dédiée n'est pas nécessaire.

### États vides

Un état vide ne doit jamais se limiter à « Aucune donnée ».

Il doit :

1. expliquer pourquoi l'écran est vide ;
2. rassurer sur l'état du système ;
3. proposer une prochaine action unique et utile.

Exemple : « Votre espace est prêt. Partagez votre page client pour commencer à recevoir des demandes structurées. »

## Vocabulaire produit

Utiliser :

- Demandes clients
- Nouvelle demande
- Voir la demande
- Ouvrir ma page client
- Contacter le client
- Devis envoyé
- Chantier gagné
- Demande perdue
- Envoyer ma demande
- Ajouter des photos

Éviter dans l'interface artisan :

- Dashboard
- Lead
- CRM
- Pipeline
- Workflow
- AI-powered
- Conversion engine
- Révolutionnez votre activité
- Boostez votre business

## Structure du tableau de bord

Ordre recommandé :

1. identité de l'espace artisan ;
2. titre et action principale ;
3. ce qui doit être traité maintenant ;
4. quelques résultats utiles ;
5. liste/tableau de travail ;
6. signature discrète du service.

Le tableau de bord est une surface de travail, pas un catalogue de métriques.

## Mobile

Le produit est utilisé par des artisans qui peuvent être en déplacement ou sur chantier.

- Pas d'action importante nécessitant un survol.
- Grandes cibles tactiles.
- Texte lisible sans zoom.
- Action principale accessible rapidement.
- Pas de barre de navigation chargée.
- Formulaires en une colonne.

## Checklist anti-interface générique

Avant chaque mise en production :

- Une tâche principale est-elle évidente ?
- Une seule action domine-t-elle visuellement ?
- Chaque bouton dit-il ce qu'il va faire ?
- Une carte a-t-elle été ajoutée uniquement pour remplir l'écran ?
- Y a-t-il un effet glow, gradient, verre ou animation sans fonction ?
- Le texte utilise-t-il le langage d'un artisan plutôt que du jargon SaaS ?
- Les couleurs ont-elles la même signification partout ?
- L'état vide aide-t-il réellement à démarrer ?
- Le focus clavier est-il visible ?
- L'écran reste-t-il utilisable sur téléphone ?
- L'utilisateur peut-il comprendre l'écran sans explication orale ?

## Références

Les principes retenus s'appuient principalement sur des conventions observées dans des systèmes de design et produits B2B reconnus : Stripe, Shopify Polaris, IBM Carbon et les pratiques actuelles de dashboards SaaS orientés décision. L'objectif n'est pas de copier leur identité visuelle, mais de reprendre leurs disciplines : cohérence, composants limités, hiérarchie d'action, états explicites et accessibilité.
