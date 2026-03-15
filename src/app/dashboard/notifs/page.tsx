"use client";

export default function NotifsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="dashboard-page-title">Notifications</h1>

      <div className="dashboard-card">
        <div className="page-empty-state">
          <h2>Aucune notification</h2>
          <p>
            Les alertes et événements importants apparaîtront ici — nouveaux
            leads haute priorité, relances envoyées, erreurs de qualification.
          </p>
          <p style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "#9ca3af" }}>
            Fonctionnalité à venir
          </p>
        </div>
      </div>
    </div>
  );
}
