# Roadmap — construction et validation

## Semaine 1 — V1 montrable

### Jour 1 — fondations
- initialiser l’application ;
- définir le schéma de données ;
- préparer Supabase ;
- créer les types métier ;
- poser la navigation et les écrans vides.

### Jour 2 — parcours prospect
- page publique artisan ;
- formulaire ;
- validation des champs ;
- création d’une demande ;
- confirmation.

### Jour 3 — espace artisan
- authentification ;
- dashboard ;
- liste des demandes ;
- fiche demande ;
- changement de statut.

### Jour 4 — photos et multi-client
- uploads ;
- affichage des photos ;
- RLS ;
- tests avec deux artisans ;
- tests d’accès croisé.

### Jour 5 — démo
- responsive mobile ;
- données de démonstration ;
- correction des bugs bloquants ;
- scénario de démo de 3 minutes.

## Semaine 2 — validation terrain

- 20 conversations avec des artisans ;
- au moins 5 démonstrations ;
- noter les objections ;
- ne développer que les points réellement bloquants.

Questions terrain :
- Comment recevez-vous vos demandes aujourd’hui ?
- Que se passe-t-il quand vous ne pouvez pas répondre ?
- Quelles informations manque-t-il souvent ?
- Combien de demandes recevez-vous par semaine ?
- Utiliseriez-vous un lien de ce type ?
- Qu’est-ce qui empêcherait son usage ?
- Quel résultat rendrait l’outil payant pour vous ?

## Semaine 3 — premier pilote

Objectif : obtenir au moins un artisan qui accepte une utilisation réelle, idéalement payante.

Mesurer :
- nombre de demandes reçues ;
- taux de demandes complètes ;
- délai avant prise de contact ;
- utilisation réelle du dashboard ;
- statuts réellement utilisés ;
- retours qualitatifs.

## Semaine 4 — clients 2 et 3

- corriger les blocages du pilote ;
- documenter l’onboarding ;
- préparer une preuve/cas client ;
- reprendre la prospection avec la démo réelle.

## Seuils de décision

- après 5 démos : lister les objections récurrentes ;
- après 20 conversations : décider si le problème est suffisamment fort ;
- après 3 clients payants : standardiser onboarding, personnalisation et support ;
- après 5 à 10 clients : envisager seulement alors les intégrations avancées.

## Roadmap après validation

Ordre potentiel, uniquement selon la demande utilisateur :

1. notifications email/web ;
2. relance des demandes non traitées ;
3. statistiques simples ;
4. résumé/classification IA ;
5. calendrier ;
6. SMS ou WhatsApp si le ROI justifie leurs coûts et contraintes.

## Règle de développement

Si une fonctionnalité n’est pas indispensable à la promesse de la V1 ou n’est pas réclamée par les utilisateurs, elle reste hors scope.
