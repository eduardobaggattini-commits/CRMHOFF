import { TreinamentosTabs } from "@/components/treinamentos-tabs";

export default function MeusTreinamentosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <TreinamentosTabs />
      {children}
    </div>
  );
}
