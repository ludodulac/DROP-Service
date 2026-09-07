# Architecture technique — V1

## Objectif

Construire une application web multi-clients simple, sécurisée et peu coûteuse à opérer, sans dépendance à une API d’IA.

## Stack de départ

- Frontend : Next.js + TypeScript
- Backend / base : Supabase PostgreSQL
- Authentification : Supabase Auth
- Stockage des photos : Supabase Storage
- Déploiement : à choisir au moment de la mise en ligne selon les offres gratuites disponibles

## Modèle multi-tenant

Une seule application sert plusieurs artisans. Toutes les données métier sont rattachées à un `artisan_id`.

La sécurité doit être appliquée côté base, pas seulement dans l’interface. Le principe recommandé est d’utiliser les politiques RLS (Row Level Security) pour garantir qu’un artisan authentifié ne peut lire ou modifier que ses propres données.

## Tables minimales

### `artisans`

- `id` UUID primary key
- `user_id` UUID unique, lié au compte d’authentification
- `business_name` text
- `trade` text
- `phone` text nullable
- `email` text nullable
- `service_area` text nullable
- `slug` text unique
- `logo_url` text nullable
- `created_at` timestamptz

### `requests`

- `id` UUID primary key
- `artisan_id` UUID foreign key → artisans.id
- `customer_name` text
- `customer_phone` text
- `customer_email` text nullable
- `city` text
- `category` text
- `description` text
- `urgency` enum/text: low | normal | urgent
- `availability` text nullable
- `status` enum/text: new | contacted | quote_sent | won | lost
- `created_at` timestamptz
- `updated_at` timestamptz

### `request_photos`

- `id` UUID primary key
- `request_id` UUID foreign key → requests.id
- `storage_path` text
- `created_at` timestamptz

## Accès public

La page publique utilise le `slug` de l’artisan. Le prospect n’a pas besoin de compte.

La création d’une demande publique doit rester strictement limitée à l’insertion des champs attendus. Elle ne doit jamais donner un accès public en lecture à l’ensemble de la table `requests`.

## Accès artisan

Après authentification :

1. retrouver l’enregistrement `artisans` lié à `auth.uid()` ;
2. lire uniquement les demandes ayant ce `artisan_id` ;
3. autoriser uniquement les mises à jour prévues sur ses demandes ;
4. limiter l’accès aux photos aux demandes appartenant à cet artisan.

## Photos

Les fichiers doivent être stockés avec un chemin évitant les collisions, par exemple :

`requests/{artisan_id}/{request_id}/{uuid}.jpg`

Valider la taille et les types de fichiers côté application et, si possible, côté stockage.

## Architecture applicative proposée

- `/` : landing ou page de démonstration
- `/a/[slug]` : page publique artisan
- `/a/[slug]/request` : formulaire prospect
- `/login` : connexion artisan
- `/dashboard` : liste des demandes
- `/dashboard/requests/[id]` : détail demande

## Variables d’environnement prévues

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Ne jamais versionner de clé serveur ou secret sensible.

## Sécurité minimale avant pilote réel

- RLS active sur toutes les tables contenant des données client ;
- contrôle d’accès aux photos ;
- validation serveur des entrées ;
- limitation raisonnable des uploads ;
- pas de secrets dans le navigateur ;
- pas d’accès croisé entre comptes ;
- tests manuels avec deux artisans distincts.

## Ce qu’on évite volontairement

Aucune dépendance obligatoire à Make, n8n, OpenAI, WhatsApp, Twilio ou CRM externe en V1. Des intégrations pourront être ajoutées plus tard si les utilisateurs les justifient.
