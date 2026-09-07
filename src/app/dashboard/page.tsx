const demoRequests = [
  {
    id: "1",
    customer: "Camille Martin",
    category: "Fuite",
    city: "Brest",
    urgency: "Urgent",
    status: "Nouveau",
  },
  {
    id: "2",
    customer: "Thomas Le Goff",
    category: "Chauffage",
    city: "Guipavas",
    urgency: "Normal",
    status: "Contacté",
  },
];

export default function DashboardPage() {
  return (
    <main style={{ padding: "40px 0 64px" }}>
      <section style={{ display: "grid", gap: 20 }}>
        <header>
          <p className="muted" style={{ marginBottom: 6 }}>Plomberie Démo</p>
          <h1 style={{ marginTop: 0 }}>Demandes clients</h1>
        </header>

        <div className="card" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
            <thead>
              <tr>
                {['Client', 'Catégorie', 'Commune', 'Urgence', 'Statut'].map((label) => (
                  <th key={label} style={thStyle}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {demoRequests.map((request) => (
                <tr key={request.id}>
                  <td style={tdStyle}>{request.customer}</td>
                  <td style={tdStyle}>{request.category}</td>
                  <td style={tdStyle}>{request.city}</td>
                  <td style={tdStyle}>{request.urgency}</td>
                  <td style={tdStyle}>{request.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

const thStyle = {
  textAlign: "left" as const,
  padding: "12px 10px",
  borderBottom: "1px solid #e5e7eb",
  color: "#667085",
};

const tdStyle = {
  padding: "14px 10px",
  borderBottom: "1px solid #f0f1f2",
};
