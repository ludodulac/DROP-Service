# DROP-Service — Principes de pilotage produit et entreprise

Ce document fixe la manière de travailler sur DROP-Service. Il complète `PRODUCT.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `CURRENT_STATE.md`, `DESIGN_SYSTEM.md` et `PLAYBOOK_COMMERCIAL.md`.

## Finalité

DROP-Service doit devenir une entreprise et un produit sérieux, simple, fiable, vendable et capable d'apprendre rapidement de vrais utilisateurs. Le succès n'est ni le nombre de fonctionnalités ni la sophistication technique.

Chaîne de valeur à protéger :

`artisan comprend → essaie → reçoit une vraie demande → la traite plus facilement → constate une valeur → réutilise → accepte de payer → reste client`

Toute décision importante doit servir cette chaîne ou protéger l'entreprise de manière proportionnée.

## Avant toute modification importante

1. Vérifier `main`, les derniers commits/PR, les documents de référence et l'état réel du produit.
2. Distinguer ce qui existe réellement, ce qui est prévu, expérimental ou seulement envisagé.
3. Identifier le problème, l'utilisateur concerné, le moment du parcours et le signal qui permettra de juger la valeur.
4. Chercher la modification minimale et réversible qui apporte un gain vérifiable.
5. Ne pas supprimer, renommer ou réorganiser pour « nettoyer » sans bénéfice réel.
6. Ne jamais considérer `implemented` comme `verified`.

## Critère de décision

Pour une nouvelle idée importante, classer mentalement :

- **FAIRE MAINTENANT** : nécessaire pour sécurité, vente, usage ou apprentissage immédiat ;
- **TESTER D'ABORD** : hypothèse importante mais non validée ;
- **PLUS TARD** : utile après les premières preuves terrain ;
- **NE PAS FAIRE** : complexité dont la valeur probable ne justifie pas le coût.

Évaluer les risques selon `probabilité × impact × difficulté de récupération`, sans catastrophisme ni complaisance.

## Produit artisan

L'artisan est souvent mobile, interrompu et pressé. L'espace artisan doit répondre en quelques secondes à :

- qu'est-ce qui vient d'arriver ?
- qu'est-ce qui demande mon attention ?
- qui dois-je contacter ?
- qu'est-ce que j'ai déjà fait ?
- quelle est la prochaine action ?
- quelle demande risque d'être oubliée ?

Workflow V1 :

`Nouveau → Contacté → Devis envoyé → Gagné / Perdu`

Ne pas multiplier les statuts sans preuve terrain.

## Parcours prospect

Le prospect ne doit pas avoir besoin de connaître DROP-Service. Le parcours vise :

`confiance → compréhension → demande → informations suffisantes → photos éventuelles → confirmation`

La page doit avant tout ressembler à l'espace professionnel de l'artisan. Chaque donnée demandée doit avoir une justification.

## Administration opérateur

`/admin` doit rester un cockpit commercial simple : prospects, réponses, démos, pilotes, clients, objections et prochaines actions. Ne pas le transformer prématurément en CRM généraliste.

La prospection reste d'abord semi-manuelle afin d'apprendre des vraies conversations. L'automatisation vient après répétition d'un besoin réel.

## Données et sécurité

- La base/RLS est l'autorité de séparation multi-tenant.
- Un artisan ne doit jamais voir les données d'un autre artisan.
- La soumission originale du prospect doit rester distincte de futurs enrichissements internes.
- Les artisans ne doivent pas réécrire silencieusement les champs originaux d'une demande.
- Les photos et mutations sensibles doivent être récupérables et éviter les faux succès.
- Les données personnelles sont minimisées et utilisées pour une finalité compréhensible.

## Mesure

Mesurer seulement ce qui peut modifier une décision.

Commercial :

`contacté → réponse → démo → pilote → première demande → demande traitée → usage répété → conversion payante → rétention`

Prospect :

`visite → début de demande → demande terminée → demande exploitable`

Éviter la pseudo-précision avec trop peu d'utilisateurs.

## Moment de valeur — hypothèse actuelle

Hypothèse à valider : le premier moment de valeur survient lorsqu'une vraie demande arrive suffisamment structurée pour que l'artisan comprenne le besoin et puisse agir sans devoir rappeler uniquement pour récupérer les informations de base.

Cette hypothèse doit être confirmée par les pilotes, pas considérée comme acquise.

## Arbitrages humains

Demander explicitement à Ludovic avant toute décision qui modifie réellement : cible, positionnement, promesse, prix, conditions commerciales, collecte importante de données, risque juridique significatif, dépense récurrente significative ou changement profond du produit.

Les corrections techniques manifestement nécessaires, sûres et cohérentes avec la V1 peuvent être appliquées de manière autonome, puis vérifiées et documentées.
