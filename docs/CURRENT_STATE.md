# État actuel audité — DROP-Service

Date de référence : 2026-09-11
Branche de référence : `main`

Ce document sert de passation courte avant toute évolution transversale. Il complète `PRODUCT.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `DESIGN_SYSTEM.md` et `PLAYBOOK_COMMERCIAL.md` sans les remplacer.

## 1. Référence et historique

- Dépôt de production : `ludodulac/DROP-Service`.
- Branche présente : `main` uniquement.
- Les routes `src/app/demo/**` sont des démonstrations commerciales et ne doivent pas être confondues avec le parcours réel `/a/[slug]/**`.
- L'administration `/admin` est un outil interne commercial ; elle n'est pas l'espace artisan.
- Ne pas supprimer les démonstrations, fichiers SQL historiques ou styles séparés uniquement pour « nettoyer » le dépôt.

## 2. Source de vérité produit V1

Le parcours réel à préserver est :

`prospect → page publique artisan → demande structurée → dashboard artisan → détail → action artisan → résultat`

Statuts métier existants :

`new → contacted → quote_sent → won | lost`

La base PostgreSQL/Supabase avec RLS reste l'autorité pour l'isolation multi-tenant. L'interface ne doit jamais être considérée comme une barrière de sécurité suffisante.

## 3. État réel Supabase observé

DROP-Service utilise actuellement le projet Supabase historiquement associé à IN-SECT, référence `nczdadkyysrxxcsnsrrn`. Les tables DROP-Service y sont séparées par le préfixe `drop_service_*`.

Tables métier présentes :

- `drop_service_artisans`
- `drop_service_requests`
- `drop_service_request_photos`
- `drop_service_admin_prospects`
- `drop_service_admin_tasks`

RLS est activée sur ces tables.

Les contraintes de `drop_service_requests` autorisent uniquement les statuts `new`, `contacted`, `quote_sent`, `won`, `lost` et les urgences `low`, `normal`, `urgent`.

La lecture publique de `drop_service_artisans` est limitée par des grants de colonnes aux informations nécessaires à la page publique. Les demandes et photos ne sont pas publiquement lisibles.

Lors de l'audit initial du 2026-09-07, les données DROP-Service de ce projet contenaient 0 artisan, 0 demande et 0 photo. Cet état de données est transitoire et doit être revérifié avant tout nouveau jugement de supervision.

### Projet « La forêt enchantée » — ne pas utiliser pour DROP-Service

Le projet Supabase `jwyayfkssyagvnablttg`, nommé « La forêt enchantée », a été vérifié le 2026-09-07 avant toute migration. Il n'est pas vide : il contient notamment des tables et fonctions actives liées à Célébrations, ainsi qu'une fonction Wikignose, et au moins un utilisateur Auth.

Décision : ne pas déplacer DROP-Service dans ce projet. Ne rien supprimer ni réaffecter dans « La forêt enchantée » pour faire de la place à DROP-Service.

À court terme, conserver DROP-Service dans le projet actuel avec ses tables préfixées est moins risqué qu'une migration vers un projet déjà utilisé. Un projet Supabase réellement dédié à DROP-Service pourra être créé plus tard si le coût et le besoin opérationnel le justifient.

## 4. Auth e-mail / Resend — état du 2026-09-11

BRIF est utilisé comme **nom commercial de travail pour le pilote**, sans être considéré à ce stade comme une marque juridique définitivement validée. Ne pas renommer les tables Supabase ou entreprendre une migration technique uniquement pour ce changement de nom.

Le sous-domaine d'envoi configuré côté Resend est `mail.ludovicdulac.com`. Les enregistrements DNS Resend ajoutés chez OVH concernent l'envoi d'e-mails et ne doivent pas entraîner de modification des autres entrées DNS existantes :

- DKIM TXT sur `resend._domainkey.mail` ;
- CNAME `rsend.mail` vers l'infrastructure Resend ;
- CNAME `send.mail` vers l'infrastructure Resend.

Le SMTP personnalisé Supabase/Resend a déjà été renseigné dans le Dashboard Supabase. **Ne pas demander de le reconfigurer ou d'écraser ses valeurs sans avoir d'abord constaté un échec réel ou vérifié qu'une valeur est incorrecte.** Les secrets SMTP / clés API ne doivent jamais être consignés dans ce dépôt ni demandés dans une conversation.

Les templates Supabase Auth utiles ont été francisés avec une identité BRIF sobre, en conservant exactement les variables techniques Supabase nécessaires :

- confirmation d'inscription ;
- réinitialisation du mot de passe ;
- Magic Link ;
- invitation utilisateur ;
- changement d'adresse e-mail ;
- code de vérification / OTP.

Objets retenus :

- `Confirmez votre adresse e-mail – BRIF`
- `Réinitialisez votre mot de passe – BRIF`
- `Votre lien de connexion BRIF`
- `Votre espace BRIF est prêt`
- `Confirmez votre nouvelle adresse e-mail – BRIF`
- `Votre code de vérification BRIF`

Les liens des templates concernés continuent d'utiliser `{{ .ConfirmationURL }}` et le template OTP conserve `{{ .Token }}`. Ne pas remplacer ces variables sans vérifier le flux Auth réellement utilisé par l'application.

### Prochaine preuve attendue pour l'e-mail Auth

Ne plus modifier la configuration SMTP ni les templates par défaut. La prochaine étape est un **test réel d'un flux Auth BRIF** : déclencher un e-mail depuis le parcours réellement utilisé, vérifier sa réception, son expéditeur, son contenu, puis vérifier que le lien/code mène au bon résultat dans l'application. Si le test échoue, diagnostiquer d'abord la première couche responsable (Resend/DNS, SMTP Supabase, URL de redirection, ou code Auth) avant toute modification.

## 5. Sécurité de l'administration

Constat initial : les tables du back-office étaient correctement isolées par `owner_id`, mais tout utilisateur authentifié pouvait techniquement disposer de son propre espace admin.

Correction appliquée le 2026-09-07 : les politiques RLS du back-office exigent désormais à la fois :

- `owner_id = auth.uid()` ;
- le claim Supabase Auth `email` égal à `ludodulac@gmail.com`.

Migration documentée dans `supabase/restrict_admin_to_ludovic.sql`.

Cette restriction par email est une solution de démarrage. Quand le compte réel existe, une future évolution vers un rôle d'administration dans `app_metadata` pourra être évaluée, sans utiliser `user_metadata` pour l'autorisation.

## 6. Tests réellement présents

Le dépôt possède actuellement un contrôle CI de build Next.js sur `main` via `.github/workflows/build.yml`.

Il n'existe pas encore de suite automatisée de tests métier, de tests E2E ni de test automatisé d'isolation tenant.

Règle : `implemented ≠ verified`.

Avant le premier pilote réel, il faut valider sur l'environnement déployé :

1. page publique d'un artisan ;
2. création d'une demande ;
3. ajout de photos ;
4. apparition dans le dashboard du bon artisan ;
5. ouverture de la fiche ;
6. changement de statut ;
7. impossibilité pour un deuxième artisan de lire ou modifier la demande du premier.

## 7. Évaluation des pistes transversales

### Machine d'état

Pertinent, mais ne pas imposer encore en base des transitions irréversibles sans décider comment gérer une correction humaine de statut. Le vocabulaire et les états sont déjà stabilisés. Prochaine amélioration sûre : centraliser les transitions autorisées dans le code et ajouter un historique minimal, après définition de la règle de correction.

### CustomerSubmission → QualifiedRequest → CommercialCase

Bonne séparation conceptuelle, mais pas nécessaire à implémenter avant les pilotes tant que l'artisan ne modifie pas les champs originaux du prospect. La priorité est de garantir qu'aucun futur enrichissement ne réécrive silencieusement les champs soumis. Introduire de nouvelles tables uniquement lorsqu'un enrichissement opérationnel réel est ajouté.

### Validité / suffisance vs priorité

À séparer conceptuellement. Une demande peut être suffisamment exploitable sans être urgente, et inversement. Ne pas créer de scoring complexe avant d'avoir des données pilotes. Une future mesure simple de complétude peut être dérivée des champs existants.

### Isolation tenant

Priorité sécurité élevée. La RLS actuelle doit rester l'autorité. Le test réel à deux artisans est bloqué tant que deux comptes Auth distincts n'existent pas.

### Photos et suppressions sûres

Le parcours actuel crée d'abord la demande, puis charge les photos. Un échec d'upload n'annule pas la demande, ce qui préserve le prospect mais peut laisser une demande partiellement photographiée. Avant d'ajouter des fonctions de suppression/remplacement, adopter des mutations idempotentes et vérifier l'ordre DB/Storage pour éviter fichiers orphelins ou suppression partielle.

### Cockpit « prochaine action utile »

À conserver léger. Le dashboard artisan doit montrer ce qui mérite une action maintenant ; l'administration commerciale peut guider la prospection. Ne pas transformer l'un ou l'autre en CRM généraliste.

### Vues prospect / artisan / admin / commercial

Séparer les vues et permissions, pas les données sans raison. Réutiliser la même source métier quand les besoins sont les mêmes.

## 8. Écarts documentaires connus

L'ancienne hypothèse tarifaire 199–299 € de mise en place puis 29–49 €/mois a été retirée de la référence produit. L'offre commerciale actuelle de référence reste : pilote 14 jours gratuit, puis 99 €/mois si l'artisan souhaite conserver le service.

## 9. Priorités avant sophistication

1. Vérifier le premier e-mail Auth BRIF réel sans reconfigurer ce qui est déjà enregistré.
2. Créer le premier compte réel de Ludovic et vérifier l'accès `/admin`.
3. Créer au moins un artisan réel de test et exécuter le parcours public → dashboard → détail → statut.
4. Créer un deuxième compte artisan de test et vérifier l'isolation RLS croisée.
5. Corriger uniquement les échecs observés.
6. Lancer le premier pilote terrain et conserver les métriques commerciales comme autorité de décision produit.

Toute idée supplémentaire doit répondre à la question : « Est-ce que cela rapproche d'une boucle réelle prospect → demande exploitable → action artisan → résultat ? »
