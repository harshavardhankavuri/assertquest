import { useEffect, useState } from "react";
import type { Invoice, Shipment } from "@assertquest/shared";
import { Alert, PageHeader } from "../ui/index.js";
import { useAuth } from "../auth/AuthContext.js";
import { api, ApiRequestError } from "../lib/api.js";
import { InvoiceRow } from "./InvoiceRow.js";

export function BillingPage() {
  const { accessToken } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [invoicesByShipment, setInvoicesByShipment] = useState<Record<string, Invoice>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    Promise.all([api.listTracking(accessToken, { pageSize: 100 }), api.listInvoices(accessToken)])
      .then(([tracking, billing]) => {
        setShipments(tracking.items);
        setInvoicesByShipment(Object.fromEntries(billing.invoices.map((inv) => [inv.shipmentId, inv])));
      })
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Could not load billing data."));
  }, [accessToken]);

  if (!accessToken) return null;

  return (
    <main>
      <PageHeader title="Billing & invoicing" />
      {error && (
        <div className="mb-6">
          <Alert tone="error">{error}</Alert>
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-hairline bg-white shadow-card">
        <table className="min-w-full divide-y divide-hairline">
          <thead className="bg-surface-subtle font-mono text-[9.5px] uppercase tracking-[0.12em] text-faint">
            <tr>
              <th className="px-4 py-2 text-left">Shipment</th>
              <th className="px-4 py-2 text-left">Shipment Price</th>
              <th className="px-4 py-2 text-left">Invoice</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {shipments.map((shipment) => (
              <InvoiceRow
                key={shipment.id}
                shipment={shipment}
                invoice={invoicesByShipment[shipment.id] ?? null}
                accessToken={accessToken}
                onInvoiceChange={(invoice) =>
                  setInvoicesByShipment((prev) => ({ ...prev, [shipment.id]: invoice }))
                }
              />
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
