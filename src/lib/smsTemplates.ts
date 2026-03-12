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
1 / 3 / 44 rue de la Paix 75012 Paris / Jean Dupont / Plus d'électricité dans la cuisine

STOP au même numéro pour se désinscrire.`;

/** Relance 1 - 10-15 min après SMS principal, aucune réponse reçue */
export const RELANCE_1_SMS = `Pour être rappelé, merci de répondre à ce message
en indiquant au minimum :
Type / Délai / Adresse.

Exemple :
1 / 2 / 44 rue de la Paix 75012 Paris

STOP au même numéro pour se désinscrire.`;

/** Relance 2 - 3h après SMS principal, toujours aucune réponse */
export const RELANCE_2_SMS = `Sans réponse, votre demande ne pourra pas être priorisée.`;

/** Relance correction - réponse inexploitable (type=null ET delay=null ET pas de séparateur) */
export const RELANCE_CORRECTION_SMS = `Merci. Pour être rappelé, merci d'indiquer
au minimum :
Type (1 à 4) / Délai (1 à 4) / Adresse.

Exemple :
1 / 2 / 44 rue de la Paix 75012 Paris`;

/**
 * SMS de confirmation envoyé au prospect après qualification vocale complète.
 * Confirme la prise en charge et le délai de rappel de l'artisan.
 */
export const VOICE_CONFIRMATION_SMS = (artisanName: string, callbackDelay: string): string => {
  const delayMap: Record<string, string> = {
    asap: "dans les plus brefs délais",
    within_hour: "dans l'heure",
    today: "dans la journée",
    no_rush: "rapidement",
  };
  const delayText = delayMap[callbackDelay] ?? "rapidement";

  return `Votre demande a bien été prise en compte. ${artisanName} vous rappellera ${delayText}.\n\nAtysPro - L'assistant des artisans`;
};
