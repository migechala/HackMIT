export function GrafanaPanel({ grafanaUrl = "http://localhost:3000" }) {
  const dashboardUid = "threshold"; // from threshold.json
  return (
    <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #333" }}>
      <iframe
        src={`${grafanaUrl}/d-solo/${dashboardUid}/threshold-db-minimized-nature-freed?orgId=1&panelId=1&kiosk`}
        width="100%"
        height="300"
        frameBorder={0}
      />
      <iframe
        src={`${grafanaUrl}/d-solo/${dashboardUid}/threshold-db-minimized-nature-freed?orgId=1&panelId=2&kiosk`}
        width="100%"
        height="180"
        frameBorder={0}
      />
      <div style={{ fontSize: 12, opacity: 0.6, padding: 8 }}>
        Live: <code>/metrics</code> attenuation dB → nature freed m² = π·(2.5·dB)²
      </div>
    </div>
  );
}
