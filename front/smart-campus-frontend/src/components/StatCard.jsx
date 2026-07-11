export default function StatCard({ title, value, color = "#2563eb" }) {
  return (
    <div className="card">
      <h3 style={{ marginBottom: 10, color: "#6b7280" }}>{title}</h3>
      <p style={{ fontSize: 28, fontWeight: "bold", color }}>{value}</p>
    </div>
  );
}