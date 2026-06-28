"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

// Os ícones padrão do Leaflet apontam pra caminhos relativos que o Next não
// resolve sozinho; usando uma URL fixa evita o pin quebrado/invisível.
const icone = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export type PontoMapaVisita = {
  id: string;
  latitude: number;
  longitude: number;
  cliente: string;
  vendedor: string;
  dataHora: string;
};

export function MapaVisitas({ pontos }: { pontos: PontoMapaVisita[] }) {
  const bounds = useMemo(() => {
    if (pontos.length === 0) return null;
    return L.latLngBounds(pontos.map((p) => [p.latitude, p.longitude] as [number, number]));
  }, [pontos]);

  if (!bounds) {
    return (
      <div className="flex h-80 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">
        Nenhuma visita com localização capturada no período.
      </div>
    );
  }

  return (
    <MapContainer
      bounds={bounds}
      boundsOptions={{ padding: [30, 30] }}
      style={{ height: "320px", width: "100%", borderRadius: "0.75rem" }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MarkerClusterGroup chunkedLoading>
        {pontos.map((p) => (
          <Marker key={p.id} position={[p.latitude, p.longitude]} icon={icone}>
            <Popup>
              <p className="font-semibold text-slate-800">{p.cliente}</p>
              <p className="text-slate-600">Vendedor: {p.vendedor}</p>
              <p className="text-slate-500">{new Date(p.dataHora).toLocaleString("pt-BR")}</p>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
