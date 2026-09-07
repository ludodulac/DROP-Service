# Drop Service — Playbook commercial

> Document de référence pour prospecter, répondre aux objections et convertir les artisans pilotes. À mettre à jour au fur et à mesure des vrais retours terrain.

## 1. Offre actuelle

- Cible initiale : plombiers / chauffagistes.
- Programme pilote : 3 artisans maximum.
- Test : 14 jours gratuits, installation comprise, sans carte bancaire et sans engagement.
- Offre Fondateur après le pilote : 99 €/mois si l'artisan souhaite continuer.
- Pas de frais d'installation pour les premiers pilotes.
- Objectif : obtenir un premier client payant avant d'ajouter de la complexité produit.

Nous ne vendons pas « un formulaire » ou « un logiciel ». Nous installons un système qui aide l'artisan à recevoir des demandes plus complètes et mieux qualifiées pendant qu'il est sur chantier : type de problème, commune, urgence, description, disponibilités, photos et coordonnées.

## 2. Premier prospect pilote — Emmanuel Lambal

Démo personnalisée : `/demo/emmanuel-lambal`

Objectif du premier contact : obtenir un « oui, montrez-moi », pas vendre immédiatement.

### Premier message

Bonjour M. Lambal,

j'ai regardé comment vous recevez actuellement vos demandes de devis et je vous ai préparé gratuitement un exemple personnalisé pour votre activité.

L'idée est simple : avant de rappeler le client, vous recevez déjà le type de problème, la commune, le niveau d'urgence, ses disponibilités et éventuellement des photos. Ça évite une partie des allers-retours pendant que vous êtes sur chantier.

Je cherche actuellement 3 artisans pour tester le système gratuitement pendant 14 jours, sans engagement.

Si vous voulez, je peux vous montrer l'exemple que j'ai préparé pour vous en 5 minutes.

### S'il accepte de voir la démo

Envoyer le lien de démonstration personnalisé et proposer un échange très court. Ne pas lui demander de configurer techniquement le système : nous faisons l'installation.

## 3. Réponse si on demande le prix

« Le test est entièrement gratuit pendant 14 jours, installation comprise et sans engagement. Si à la fin vous trouvez que ça vous fait réellement gagner du temps et que vous souhaitez le garder, ce sera 99 € par mois. Si ça ne vous apporte rien, on arrête simplement là. »

Ne pas cacher le prix si l'artisan le demande.

## 4. Comment parler des économies / du retour sur investissement

Ne jamais inventer un montant d'économies ou promettre un nombre fixe de clients/chantiers avant d'avoir des données.

Avant le pilote :

« Le but est de réduire le temps passé à rappeler des demandes mal renseignées et de vous permettre de voir immédiatement lesquelles sont urgentes et suffisamment précises pour être traitées. Pendant les 14 jours, on mesure justement le temps et les échanges que ça peut vous faire économiser. »

Pendant le pilote, mesurer autant que possible :

- nombre de visites du parcours ;
- nombre de demandes commencées ;
- nombre de demandes terminées ;
- demandes avec commune renseignée ;
- demandes avec urgence renseignée ;
- demandes avec disponibilité ;
- demandes avec photos ;
- demandes qualifiées ;
- devis envoyés ;
- chantiers gagnés ;
- temps / échanges évités si l'artisan peut l'estimer.

Après le pilote, présenter des chiffres observés plutôt qu'une promesse marketing. Exemple de logique : si 20 demandes structurées évitent environ 5 minutes d'échanges chacune, cela représente environ 1 h 40 de temps économisé. L'estimation doit être fondée sur le retour réel de l'artisan.

## 5. Tunnel commercial

1. **Prospect** — obtenir 5 minutes d'attention.
2. **Démo personnalisée** — montrer le problème actuel et le parcours amélioré.
3. **Pilote** — proposer 14 jours gratuits, sans engagement.
4. **Installation** — nous faisons le travail technique et réduisons au maximum les tâches demandées à l'artisan.
5. **Mesure** — observer demandes, complétude, photos, urgence, disponibilité, devis et résultats quand ils sont connus.
6. **Bilan J+14** — échange de 15 minutes et présentation des résultats.
7. **Conversion** — demander simplement : « Vous souhaitez qu'on le laisse en place ? » Si oui, offre Fondateur à 99 €/mois.

## 6. Réponses aux objections à prévoir

### « Je reçois déjà mes demandes par téléphone. »

Le système ne cherche pas forcément à remplacer le téléphone. Il sert à obtenir les informations utiles avant le rappel lorsque le client passe par le parcours, afin de savoir plus vite ce qu'il veut et son niveau d'urgence.

### « Je n'ai pas le temps de m'occuper d'un logiciel. »

« Justement, l'idée est que vous n'ayez pas à l'installer ou le configurer. On s'en occupe pendant le pilote. Votre rôle est surtout de l'utiliser normalement et de nous dire à la fin si cela vous a réellement simplifié le travail. »

### « Et si ça ne marche pas ? »

« On arrête au bout des 14 jours. Il n'y a ni engagement ni carte bancaire pour le test. »

### « Combien de clients allez-vous m'apporter ? »

Ne pas promettre un volume. Réponse : « Le premier objectif du pilote est de mieux convertir et traiter les demandes qui arrivent déjà. On mesure ce qui se passe réellement avant de vous promettre quoi que ce soit sur l'acquisition. »

### « Pourquoi 99 € par mois ? »

« Parce que ce n'est pas seulement l'accès à un formulaire : le parcours est installé pour votre activité et sert à structurer les demandes avant votre rappel. Mais le pilote gratuit sert justement à vérifier que la valeur est supérieure au prix pour vous avant de vous demander de payer. »

## 7. Coûts et marge — repères internes

L'architecture doit rester multi-artisans : une plateforme partagée, pas une infrastructure séparée pour chaque client.

Repères à surveiller avant commercialisation réelle : hébergement Vercel, Supabase, domaine, email, éventuelles automatisations/SMS et coûts d'acquisition. Ne pas considérer durablement les offres gratuites comme garanties pour une activité commerciale ; vérifier les tarifs et conditions en vigueur avant toute décision de coût.

À 99 €/mois :

- 10 clients = 990 €/mois de CA récurrent ;
- 30 clients = 2 970 €/mois ;
- 50 clients = 4 950 €/mois.

Ces montants sont du chiffre d'affaires, pas du bénéfice : retrancher infrastructure, acquisition, support, sous-traitance, fiscalité et autres charges.

## 8. Mesure / Analytics à mettre en place

Avant le premier vrai pilote avec trafic, mettre en place un suivi minimal du tunnel :

`visite → début de demande → demande terminée → demande qualifiée → devis → chantier gagné`

Google Analytics/GA4 peut servir à mesurer l'acquisition et le comportement sur le parcours. Les données métier (demande, statut, devis, gagné/perdu) doivent rester suivies dans notre application/Supabase afin de relier le trafic à la valeur commerciale.

Le futur tableau de bord devrait mettre en avant la valeur générée, pas seulement une liste de demandes.

## 9. Règles commerciales

- Pas de promesse de nombre de leads/chantiers sans preuve.
- Pas de fausse estimation d'économies.
- Parler résultat et temps gagné, pas SaaS/IA/stack technique.
- Personnaliser la démonstration au prospect.
- Faire nous-mêmes l'installation au début pour apprendre le métier.
- Noter les objections et demandes réelles des pilotes avant de développer de nouvelles fonctionnalités.
- Priorité absolue : obtenir un premier client payant et apprendre de son utilisation réelle.

## 10. Workflow de l'administration privée

Adresse de travail : `/admin`.

Principe : l'administration doit être le poste de commande quotidien de Ludovic. Les recherches, textes et prochaines actions doivent y être préparés avant de lui demander d'intervenir.

Workflow de prospection :

1. **À valider** — le prospect et le message ont été préparés, mais rien ne part.
2. **Validé** — Ludovic a vérifié le prospect et donné son feu vert au message.
3. **Ouvrir dans Gmail** — pour un prospect avec email, l'administration ouvre une composition Gmail préremplie avec destinataire, objet et corps du message. L'envoi reste manuel et contrôlé.
4. **Marquer comme envoyé** — une fois le premier contact réellement envoyé, le prospect passe à `Contacté`.
5. **Relance automatique dans l'administration** — une tâche de relance à J+3 est créée si aucune réponse n'est enregistrée.
6. **A répondu → Démo → Pilote → Client** — le statut doit toujours refléter la prochaine décision commerciale utile.

Pour les prospects sans email public fiable, ne pas inventer une adresse : préparer le message, puis utiliser le formulaire officiel du site ou le téléphone.

Prospects pilotes actuellement préchargés dans l'administration :

- Emmanuel Lambal — priorité haute, email public disponible, démo personnalisée prête.
- Entreprise KERMAS / Raphaël Masson — priorité haute, contact via formulaire ou téléphone car aucun email public fiable n'a été retenu.
- EDPC / Etienne Drévillon — priorité normale, adresse email issue d'un annuaire partenaire à vérifier avant envoi.

Règle de sécurité commerciale : l'administration peut préparer, copier et préremplir un message, mais elle ne doit pas envoyer un email de prospection sans action explicite de Ludovic.
