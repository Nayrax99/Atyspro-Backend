/**
 * Dev domain service - business logic for dev tools (seed, simulate)
 */

import { supabaseAdmin } from "@/lib/supabase";
import type { SimulateSmsParams } from "./dev.types";

const LEADS_DATA = [
  {
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
    status: "incomplete" as const,
    contact_name: "Jean Martin",
    phone: "+33687654321",
    address: "42 avenue Victor Hugo, 69003 Lyon",
    request_text: "Installation de 5 prises électriques dans le salon rénové",
    urgency: 4,
    job_type: "Installation",
    score: 50,
  },
  {
    status: "needs_review" as const,
    contact_name: "Sophie Lefebvre",
    phone: "+33676543210",
    address: "8 impasse des Fleurs, 33000 Bordeaux",
    request_text: "Remplacement tableau électrique vétuste. Devis souhaité.",
    urgency: 6,
    job_type: "Rénovation",
    score: 70,
  },
];

/** Seed DEV - uses .single() for account lookup (dev/seed behavior) */
export async function seedDev() {
  let accountId: string;

  const { data: existingAccount } = await supabaseAdmin!
    .from("accounts")
    .select("id")
    .eq("name", "Électricité Dupont DEV")
    .single();

  if (existingAccount) {
    accountId = existingAccount.id;
    console.log("Account existant réutilisé:", accountId);
  } else {
    const { data: newAccount, error: accountError } = await supabaseAdmin!
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

  const { data: phoneNumber, error: phoneError } = await supabaseAdmin!
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

  const leadsData = LEADS_DATA.map((row) => ({
    ...row,
    account_id: accountId,
  }));

  const { data: leads, error: leadsError } = await supabaseAdmin!
    .from("leads")
    .insert(leadsData)
    .select();

  if (leadsError) {
    throw new Error(`Erreur création leads: ${leadsError.message}`);
  }

  return {
    account: { id: accountId, name: "Électricité Dupont DEV" },
    phone_number: phoneNumber,
    leads,
  };
}

/** Seed for health/db - uses .maybeSingle() for account lookup (health/db behavior) */
export async function seedHealthDb() {
  let accountId: string;

  const { data: existingAccount } = await supabaseAdmin!
    .from("accounts")
    .select("id")
    .eq("name", "Électricité Dupont DEV")
    .maybeSingle();

  if (existingAccount) {
    accountId = existingAccount.id;
  } else {
    const { data: newAccount, error: accountError } = await supabaseAdmin!
      .from("accounts")
      .insert({ name: "Électricité Dupont DEV" })
      .select()
      .single();

    if (accountError) {
      throw new Error(`Erreur création account: ${accountError.message}`);
    }

    accountId = newAccount.id;
  }

  const { data: phoneNumber, error: phoneError } = await supabaseAdmin!
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

  const leadsData = LEADS_DATA.map((row) => ({
    ...row,
    account_id: accountId,
  }));

  const { data: leads, error: leadsError } = await supabaseAdmin!
    .from("leads")
    .insert(leadsData)
    .select();

  if (leadsError) {
    throw new Error(`Erreur création leads: ${leadsError.message}`);
  }

  return {
    account: { id: accountId, name: "Électricité Dupont DEV" },
    phone_number: phoneNumber,
    leads,
  };
}

/** Simulate SMS - creates lead from dev simulate endpoint */
export async function simulateSms(params: SimulateSmsParams) {
  const { to, from, body: smsBody } = params;

  const { data: phoneNumber, error: phoneError } = await supabaseAdmin!
    .from("phone_numbers")
    .select("id, account_id")
    .eq("e164", to)
    .single();

  if (phoneError || !phoneNumber) {
    throw new Error(`Numéro professionnel non trouvé pour e164=${to}`);
  }

  const { account_id } = phoneNumber;

  const parts = smsBody.split(/ \/ /).map((p: string) => p.trim());
  const type_code = parts[0] ? parseInt(parts[0], 10) || 1 : 1;
  const delay_code = parts[1] ? parseInt(parts[1], 10) || 1 : 1;
  const address = parts[2] || null;
  const full_name = parts[3] || null;
  const description = parts[4] || smsBody;

  const leadData = {
    account_id,
    status: "needs_review" as const,
    client_phone: from,
    type_code,
    delay_code,
    address,
    full_name,
    description,
    raw_message: smsBody,
    priority_score: 90,
    relance_count: 0,
  };

  const { data: lead, error: leadError } = await supabaseAdmin!
    .from("leads")
    .insert(leadData)
    .select()
    .single();

  if (leadError) {
    throw new Error(`Erreur création lead: ${leadError.message}`);
  }

  return lead;
}
