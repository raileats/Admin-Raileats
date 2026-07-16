// app/admin/restros/[code]/edit/settlement/receipt/[settlementId]/page.tsx

import SettlementReceipt from "@/components/restro-route-tabs/SettlementReceipt";

type Props = {
  params: {
    code: string;
    settlementId: string;
  };
};

export default function SettlementReceiptPage({
  params,
}: Props) {
  return (
    <SettlementReceipt
      restroCode={
        params.code
      }
      settlementId={
        params.settlementId
      }
    />
  );
}
