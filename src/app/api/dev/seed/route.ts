import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

/**
 * Route POST /dev/seed
 * Crée des données de développement dans Supabase
 * DEV ONLY - pas d'authentification
 */
export async function POST() {
  try {
    // 1. Créer ou récupérer un account
    let accountId: string;

    const { data: existingAccount } = await supabase
      .from("accounts")
      .select("id")
      .eq("name", "Électricité Dupont DEV")
      .single();

    if (existingAccount) {
      accountId = existingAccount.id;
      console.log("Account existant réutilisé:", accountId);
    } else {
      const { data: newAccount, error: accountError } = await supabase
        .from("accounts")
        .insert({ name: "Électricité Dupont DEV" })
        .select()
        .single();

      if (accountError) {
        throw new Error(`Erreur création account: ${accountError.message}`);
      }

      accountId = newAccount.id;
      console.log("Nouveau account créé:", accountId);
    }

    // 2. Créer un phone_number lié à l'account
    const { data: phoneNumber, error: phoneError } = await supabase
      .from("phone_numbers")
      .insert({
        account_id: accountId,
        e164: "+33612345678",
        active: true,
      })
      .select()
      .single();

    if (phoneError) {
      throw new Error(`Erreur création phone_number: ${phoneError.message}`);
    }

    // 3. Créer 3 leads liés à l'account
    const leadsData = [
      {
        account_id: accountId,
        status: "needs_review" as const,
        contact_name: "Marie Dubois",
        phone: "+33698765432",
        address: "15 rue de la République, 75011 Paris",
        request_text:
          "Panne électrique totale au sous-sol depuis hier soir. Urgent.",
        urgency: 9,
        job_type: "Dépannage urgent",
        score: 90,
      },
      {
        account_id: accountId,
        status: "incomplete" as const,
        contact_name: "Jean Martin",
        phone: "+33687654321",
        address: "42 avenue Victor Hugo, 69003 Lyon",
        request_text:
          "Installation de 5 prises électriques dans le salon rénové",
        urgency: 4,
        job_type: "Installation",
        score: 50,
      },
      {
        account_id: accountId,
        status: "needs_review" as const,
        contact_name: "Sophie Lefebvre",
        phone: "+33676543210",
        address: "8 impasse des Fleurs, 33000 Bordeaux",
        request_text:
          "Remplacement tableau électrique vétuste. Devis souhaité.",
        urgency: 6,
        job_type: "Rénovation",
        score: 70,
      },
    ];

    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .insert(leadsData)
      .select();

    if (leadsError) {
      throw new Error(`Erreur création leads: ${leadsError.message}`);
    }

    // Retourner les données créées
    return NextResponse.json(
      {
        success: true,
        message: "Seed DEV créé avec succès",
        data: {
          account: { id: accountId, name: "Électricité Dupont DEV" },
          phone_number: phoneNumber,
          leads: leads,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur seed DEV:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}