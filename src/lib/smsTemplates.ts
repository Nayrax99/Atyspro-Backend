/**
 * Templates SMS AtysPro - Textes exacts (specs produit figées)
 */

/** SMS principal envoyé immédiatement après un appel manqué */
export const QUALIFICATION_SMS = `Bonjour, je suis en intervention et ne peux pas répondre.

Pour être rappelé en priorité, merci de répondre à ce message
dans cet ordre, en séparant par / :

Type :
1- Dépannage
2- Installation
3- Devis
4- Autre

Délai :
1- Aujourd'hui
2- 48h
3- Cette semaine
4- Pas pressé

Adresse complète
Nom et prénom
Problème (1 phrase)

Exemple :
1 / 3 / 44 rue de la Paix 75012 Paris / Jean Dupont / Plus d'électricité dans la cuisine`;

/** Relance 1 - 10-15 min après SMS principal, aucune réponse reçue */
export const RELANCE_1_SMS = `Pour être rappelé, merci de répondre à ce message
en indiquant au minimum :
Type / Délai / Adresse.

Exemple :
1 / 2 / 44 rue de la Paix 75012 Paris`;

/** Relance 2 - 3h après SMS principal, toujours aucune réponse */
export const RELANCE_2_SMS = `Sans réponse, votre demande ne pourra pas être priorisée.`;

/** Relance correction - réponse inexploitable (type=null ET delay=null ET pas de séparateur) */
export const RELANCE_CORRECTION_SMS = `Merci. Pour être rappelé, merci d'indiquer
au minimum :
Type (1 à 4) / Délai (1 à 4) / Adresse.

Exemple :
1 / 2 / 44 rue de la Paix 75012 Paris`;
