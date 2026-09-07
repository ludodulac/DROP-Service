# DROP-Service — Micro-SaaS pour artisans

Ce dépôt contient la V1 d’un micro-SaaS destiné aux artisans (plombiers, chauffagistes, électriciens, puis autres métiers de service) pour mieux recevoir, qualifier et suivre les demandes clients.

## Problème

Quand un artisan est sur chantier, les demandes arrivent souvent par appels, SMS ou formulaires incomplets. Il faut rappeler, redemander les informations utiles et certaines demandes peuvent être oubliées ou perdues.

## Promesse produit

Le prospect ouvre une page publique de l’artisan, décrit son besoin, ajoute ses coordonnées, sa commune, son degré d’urgence, ses disponibilités et éventuellement des photos. L’artisan retrouve ensuite chaque demande dans un tableau de bord simple et peut la faire avancer dans un pipeline :

`Nouveau → Contacté → Devis envoyé → Gagné / Perdu`

La V1 ne dépend pas de l’IA, de WhatsApp, de SMS payants ni d’un CRM externe.

## V1

- page publique personnalisée par artisan ;
- formulaire de demande ;
- ajout de photos ;
- confirmation après envoi ;
- authentification artisan ;
- tableau de bord des demandes ;
- fiche détaillée d’une demande ;
- changement de statut ;
- isolation stricte des données entre artisans ;
- interface responsive/mobile-first.

## Hors V1

Pas d’application mobile native, WhatsApp API, SMS payants, génération automatique de devis, facturation, paiement client final, calendrier avancé, chatbot IA complexe ou CRM externe.

## Principes

1. Une seule base de code multi-clients.
2. Construire une V1 montrable rapidement.
3. Ne payer aucun outil simplement « au cas où ».
4. Pas d’API IA obligatoire dans le cœur du produit.
5. Chaque coût spécifique à un client doit être couvert par l’encaissement client.
6. Sécurité et isolation des données dès le départ.
7. Arrêter d’ajouter des fonctionnalités dès que la V1 est présentable et aller parler à des artisans.

## Stack envisagée

- Next.js + TypeScript pour l’application web ;
- Supabase pour PostgreSQL, authentification et stockage des photos ;
- déploiement web simple ;
- IA optionnelle plus tard, uniquement si l’usage la justifie.

## Structure du dépôt

- `docs/PRODUCT.md` — cahier des charges produit ;
- `docs/ARCHITECTURE.md` — architecture technique et modèle de données ;
- `docs/ROADMAP.md` — plan de construction et validation ;
- `src/` — application web.

## Objectif de validation

Une V1 utile vaut plus qu’un SaaS « complet ». Premier objectif : obtenir 20 conversations réelles avec des artisans, faire au moins 5 démonstrations, puis chercher un premier pilote payant.

## Démarrage local

Le squelette technique va être implémenté progressivement dans ce dépôt. Les variables d’environnement nécessaires seront documentées dans `.env.example`.
