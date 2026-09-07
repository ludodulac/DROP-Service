# Cahier des charges produit — V1

## Cible

Plombiers, chauffagistes, électriciens et autres artisans de service qui reçoivent régulièrement des demandes entrantes pendant leurs interventions.

## Jobs-to-be-done

Le produit doit permettre à un artisan de :

1. recevoir une demande structurée sans décrocher immédiatement ;
2. récupérer les informations utiles dès le premier contact ;
3. visualiser rapidement l’urgence et le contexte ;
4. éviter de perdre une demande dans des SMS/appels/messages dispersés ;
5. suivre simplement l’avancement jusqu’au devis et à la décision.

## Parcours prospect

1. Le prospect ouvre la page publique de l’artisan.
2. Il clique sur « Faire une demande ».
3. Il renseigne : nom, téléphone, email facultatif, commune, catégorie, description, urgence, disponibilités.
4. Il peut joindre des photos.
5. Il envoie sa demande.
6. Il obtient une confirmation claire.

## Parcours artisan

1. L’artisan se connecte.
2. Il voit la liste de ses demandes.
3. Il peut filtrer ou repérer rapidement les demandes urgentes.
4. Il ouvre une fiche demande.
5. Il consulte les coordonnées, la description et les photos.
6. Il modifie le statut : Nouveau, Contacté, Devis envoyé, Gagné ou Perdu.

## Écrans V1

### 1. Page publique artisan
- nom de l’entreprise ;
- activité ;
- zone d’intervention ;
- logo facultatif ;
- bouton principal « Faire une demande ».

### 2. Formulaire
- nom ;
- téléphone ;
- email facultatif ;
- commune ;
- catégorie du problème ;
- description ;
- niveau d’urgence ;
- disponibilités ;
- photos facultatives.

### 3. Confirmation
Message simple après soumission, sans créer de faux engagement de délai.

### 4. Connexion artisan
Authentification sécurisée.

### 5. Dashboard
Colonnes minimales : date, client, catégorie, commune, urgence, statut.

### 6. Fiche demande
Toutes les données du prospect, les photos, les coordonnées cliquables et le sélecteur de statut.

## Statuts

- `new`
- `contacted`
- `quote_sent`
- `won`
- `lost`

## Urgence

- `low`
- `normal`
- `urgent`

## Critères d’acceptation V1

La V1 est considérée comme montrable lorsque :

- deux artisans de démonstration peuvent coexister ;
- chacun possède une page publique distincte ;
- une demande envoyée à l’artisan A n’apparaît jamais chez l’artisan B ;
- une demande peut contenir plusieurs photos ;
- le dashboard fonctionne sur mobile ;
- le statut peut être modifié ;
- le parcours complet peut être démontré en moins de 3 minutes ;
- aucun service d’IA payant n’est requis.

## Non-objectifs V1

- chatbot IA ;
- WhatsApp API ;
- SMS ;
- devis automatique ;
- paiement ;
- facturation ;
- calendrier avancé ;
- application mobile native ;
- CRM tiers ;
- nombreuses personnalisations par client.

## Offre pilote actuelle

- 3 artisans pilotes maximum ;
- 14 jours gratuits ;
- installation comprise ;
- sans carte bancaire et sans engagement ;
- offre Fondateur après le pilote : 99 €/mois si l'artisan souhaite continuer ;
- pas de frais d'installation pour les premiers pilotes.

Cette offre reste une hypothèse commerciale à valider sur le terrain. Les métriques du pilote et les retours réels des artisans restent l'autorité pour toute évolution de prix ou de périmètre.
