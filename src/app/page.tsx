import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token");

  // Si l'utilisateur est déjà authentifié, on l'envoie vers le dashboard
  if (accessToken) {
    redirect("/dashboard");
  }

  // Sinon, on l'envoie vers la page d'authentification
  redirect("/auth");
}


