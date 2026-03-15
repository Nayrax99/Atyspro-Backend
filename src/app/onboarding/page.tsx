"use client";

import { useState, type FormEvent } from "react";

type OnboardingStep = 1 | 2 | 3;

type SpecialtyOption = "electricien" | "plombier" | "serrurier" | "autre";

export default function OnboardingPage() {
  const [step, setStep] = useState<OnboardingStep>(1);
  const [ownerPhone, setOwnerPhone] = useState("");
  const [city, setCity] = useState("");
  const [specialty, setSpecialty] = useState<SpecialtyOption>("electricien");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goToNextStep = () => {
    setStep((current) => (current < 3 ? ((current + 1) as OnboardingStep) : current));
  };

  const handleSubmitStep1 = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!ownerPhone.trim()) {
      setError("Merci d’indiquer votre numéro mobile.");
      return;
    }

    if (!city.trim()) {
      setError("Merci d’indiquer votre ville.");
      return;
    }

    goToNextStep();
  };

  const handleFinishOnboarding = async () => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/onboarding", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          owner_phone: ownerPhone,
          city,
          specialty,
        }),
      });

      if (!response.ok) {
        let message = "Impossible de terminer l’onboarding. Veuillez réessayer.";
        try {
          const data = (await response.json()) as { error?: string; message?: string };
          if (typeof data.message === "string" && data.message.trim().length > 0) {
            message = data.message;
          } else if (typeof data.error === "string" && data.error.trim().length > 0) {
            message = data.error;
          }
        } catch {
          // On garde le message générique
        }
        setError(message);
        return;
      }

      // Redirection plein navigateur vers le dashboard
      window.location.href = "/dashboard";
    } catch {
      setError("Une erreur est survenue. Vérifiez votre connexion et réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const isActiveStep = (value: OnboardingStep): boolean => step === value;

  return (
    <main className="w-full max-w-xl">
      <section className="bg-white shadow-lg rounded-2xl px-6 py-8 sm:px-10 sm:py-10">
        {/* Stepper visuel */}
        <div className="flex items-center justify-between mb-8" aria-label="Progression de l’onboarding">
          {[1, 2, 3].map((value) => {
            const stepValue = value as OnboardingStep;
            const active = isActiveStep(stepValue);
            const completed = step > stepValue;

            const circleColor = active
              ? "bg-blue-600 text-white"
              : completed
              ? "bg-blue-100 text-blue-600"
              : "bg-slate-100 text-slate-500";

            const borderColor = active
              ? "border-blue-600"
              : completed
              ? "border-blue-200"
              : "border-slate-200";

            return (
              <div key={stepValue} className="flex-1 flex items-center">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold ${circleColor} ${borderColor}`}
                  aria-current={active ? "step" : undefined}
                  aria-label={`Étape ${stepValue}`}
                >
                  {stepValue}
                </div>
                {stepValue < 3 && (
                  <div
                    className={`h-px flex-1 mx-2 sm:mx-4 ${
                      completed ? "bg-blue-500" : "bg-slate-200"
                    }`}
                    aria-hidden="true"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Contenu des étapes */}
        {step === 1 && (
          <div>
            <header className="mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Vos informations
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Quelques détails pour personnaliser AtysPro à votre activité.
              </p>
            </header>

            <form onSubmit={handleSubmitStep1} className="space-y-5" noValidate>
              <div className="space-y-1.5">
                <label
                  htmlFor="owner-phone"
                  className="block text-sm font-medium text-slate-700"
                >
                  Votre numéro mobile
                </label>
                <input
                  id="owner-phone"
                  name="owner_phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={ownerPhone}
                  onChange={(event) => setOwnerPhone(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="06 12 34 56 78"
                  aria-describedby="owner-phone-help"
                />
                <p id="owner-phone-help" className="text-xs text-slate-500">
                  Numéro utilisé pour vous notifier des nouveaux leads.
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="city" className="block text-sm font-medium text-slate-700">
                  Votre ville
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  autoComplete="address-level2"
                  required
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Paris, Lyon, Marseille..."
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="specialty"
                  className="block text-sm font-medium text-slate-700"
                >
                  Spécialité
                </label>
                <select
                  id="specialty"
                  name="specialty"
                  value={specialty}
                  onChange={(event) =>
                    setSpecialty(event.target.value as SpecialtyOption)
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm bg-white focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  aria-label="Sélectionnez votre spécialité"
                >
                  <option value="electricien">Électricien</option>
                  <option value="plombier">Plombier</option>
                  <option value="serrurier">Serrurier</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              {error && (
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Continuer
              </button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div>
            <header className="mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Votre numéro professionnel
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                AtysPro vous attribue un numéro dédié pour centraliser vos appels
                clients.
              </p>
            </header>

            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Un numéro professionnel dédié vous sera attribué. Ce numéro recevra vos
                appels clients et notre assistant vocal qualifiera automatiquement vos appels manqués.
              </p>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 flex gap-3">
                <div className="text-lg" aria-hidden="true">
                  🔜
                </div>
                <div>
                  <p className="font-semibold">
                    Attribution automatique du numéro à l&apos;activation de votre
                    compte
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Dès que votre compte est activé, votre numéro AtysPro est
                    provisionné et relié à votre dashboard.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={goToNextStep}
              className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              Continuer
            </button>
          </div>
        )}

        {step === 3 && (
          <div>
            <header className="mb-6">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Comment ça marche ?
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                En trois étapes simples, vos appels deviennent des leads qualifiés.
              </p>
            </header>

            <div className="grid gap-4">
              <article className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <span aria-hidden="true">📞</span>
                  <span>Un client vous appelle</span>
                </h2>
                <p className="mt-1.5 text-xs text-slate-600">
                  Quand un client appelle votre numéro pro, vous êtes notifié. Si vous ne
                  répondez pas, notre assistant vocal prend l&apos;appel et qualifie le besoin du client.
                </p>
              </article>

              <article className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <span aria-hidden="true">📱</span>
                  <span>Le client échange avec l&apos;assistant</span>
                </h2>
                <p className="mt-1.5 text-xs text-slate-600">
                  Le client explique son besoin à notre assistant vocal. La demande est
                  analysée et qualifiée automatiquement.
                </p>
              </article>

              <article className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <span aria-hidden="true">⚡</span>
                  <span>Vous recevez un lead qualifié</span>
                </h2>
                <p className="mt-1.5 text-xs text-slate-600">
                  Le lead apparaît dans votre dashboard avec un score de priorité. Vous
                  rappelez le client quand vous êtes disponible.
                </p>
              </article>
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleFinishOnboarding}
              disabled={loading}
              className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              aria-label="Commencer à utiliser AtysPro"
            >
              {loading ? "Finalisation en cours..." : "Commencer à utiliser AtysPro"}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

