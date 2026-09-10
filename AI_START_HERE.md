# AI START HERE — DROP-Service

## Contexte transversal

DROP-Service appartient à l'écosystème **`ludodulac/Grand-pere`**. Grand Père est documenté dans le dépôt `ludodulac/Grand-pere`. En nouvelle conversation : lire Grand Père `AI_START_HERE.md`, la fiche DROP-Service via `projects/_INDEX.md` et `LOOP_ENGINEERING.md`, puis revenir ici. **Ce dépôt reste la source de vérité du produit, de Supabase/RLS, du code et des tests.**

Ce fichier est un routeur. Vérifier `main`, puis `docs/_INDEX.md` et uniquement ce qui sert à la tâche.

## Hiérarchie

code + schéma/RLS + tests + déployé → principes/produit → architecture → état courant à revérifier → roadmap/historique.

## Constitution minimale

Micro-SaaS simple pour artisans : demande → Nouveau → Contacté → Devis → Gagné/Perdu. V1 démontrable et exploitable sans CRM lourd, IA obligatoire, WhatsApp ou SMS payant. Isolation multi-client constitutive.

## Routage

- produit → `docs/PRODUCT.md` ;
- limites V1 → `docs/OPERATING_PRINCIPLES.md` ;
- Supabase/isolation → `docs/ARCHITECTURE.md` + schéma/policies réels ;
- état → `docs/CURRENT_STATE.md` puis vérification code/tests/CI ;
- UI → `docs/DESIGN_SYSTEM.md` ;
- commercial → `docs/PLAYBOOK_COMMERCIAL.md` ;
- futur → `docs/ROADMAP.md` comme hypothèse.

## Boucle

`besoin artisan → état réel → friction la plus importante → première couche responsable → changement minimal → preuve parcours/donnée → CONTINUE/PIVOT/STOP`.

Ne pas ajouter de complexité spéculative. Pour une modification multi-tenant, vérifier réellement `artisan_id`, RLS et parcours. Ne jamais utiliser le `drop-service/` d'un autre dépôt comme source de vérité.
