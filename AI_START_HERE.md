# AI START HERE — DROP-Service

Ce fichier est un routeur. Vérifier le `main` réel, puis lire uniquement ce qui sert à la tâche.

## Hiérarchie de vérité

1. code, schéma Supabase/RLS, tests et comportement réellement déployé ;
2. `docs/OPERATING_PRINCIPLES.md` et `docs/PRODUCT.md` pour les règles produit durables ;
3. `docs/ARCHITECTURE.md` pour les contrats techniques ;
4. `docs/CURRENT_STATE.md` pour l'état de travail, à revérifier contre le dépôt ;
5. `docs/ROADMAP.md` et historiques comme intentions, jamais comme état implémenté.

## Constitution minimale

DROP-Service est un micro-SaaS simple pour artisans : demande entrante → Nouveau → Contacté → Devis → Gagné/Perdu. La V1 doit rester démontrable et exploitable sans CRM lourd, IA obligatoire, WhatsApp ou SMS payant. L'isolation multi-client est constitutive : les données métier doivent rester rattachées à l'artisan et protégées par les politiques d'accès appropriées.

## Routage

- Besoin/fonction produit → `docs/PRODUCT.md` puis code concerné.
- Règles de fonctionnement et limites V1 → `docs/OPERATING_PRINCIPLES.md`.
- Supabase, isolation, flux techniques → `docs/ARCHITECTURE.md`, migrations/policies réelles puis code.
- État actuel / reprise de travail → `docs/CURRENT_STATE.md`, puis vérification par code/tests/CI.
- UI/identité → `docs/DESIGN_SYSTEM.md` puis composants réels.
- Commercialisation → `docs/PLAYBOOK_COMMERCIAL.md`.
- Futur → `docs/ROADMAP.md`, sans transformer une idée en exigence actuelle.

## Garde-fous

- Ne jamais utiliser le sous-dossier `drop-service` éventuellement présent dans un autre dépôt comme source de vérité de DROP-Service.
- Ne pas ajouter de complexité spéculative à la V1.
- Pour une modification multi-tenant, vérifier réellement schéma, `artisan_id`, RLS et parcours concerné.
- Préserver les capacités existantes avant suppression ou migration.
- Ne pas charger tout `docs/` par défaut.
