// app/admin/restros/[code]/edit/settlement/page.tsx

import SettlementClient from "@/components/restro-route-tabs/SettlementClient";

type Props = {
  params: {
    code: string;
  };
};

export default function SettlementPage({
  params,
}: Props) {
  return (
    <SettlementClient
      restroCode={params.code}
    />
  );
}
