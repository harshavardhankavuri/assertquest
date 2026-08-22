import { useEffect, useState, type FormEvent } from "react";
import type { ApiErrorBody, BillingCurrency, Invoice, Payment, Shipment } from "@assertquest/shared";
import { BILLING_CURRENCIES } from "@assertquest/shared";
import { Alert, Badge, Button, SelectInput, TextInput } from "../ui/index.js";
import { api, ApiRequestError } from "../lib/api.js";

function formatAmount(amountCents: number, currency: BillingCurrency): string {
  const digits = currency === "JPY" ? 0 : 2;
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amountCents / 10 ** digits);
}

function invoiceTone(status: Invoice["status"]): "success" | "warning" {
  return status === "paid" ? "success" : "warning";
}

interface InvoiceRowProps {
  shipment: Shipment;
  invoice: Invoice | null;
  accessToken: string;
  onInvoiceChange: (invoice: Invoice) => void;
}

export function InvoiceRow({ shipment, invoice, accessToken, onInvoiceChange }: InvoiceRowProps) {
  const [currency, setCurrency] = useState<BillingCurrency>("USD");
  const [cardNumber, setCardNumber] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!invoice) return;
    api
      .listPayments(invoice.id, accessToken)
      .then((res) => setPayments(res.payments))
      .catch(() => {});
  }, [invoice, accessToken]);

  async function onGenerate() {
    setError(null);
    setBusy(true);
    try {
      const res = await api.createInvoice(shipment.id, currency, accessToken);
      onInvoiceChange(res.invoice);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not generate invoice.");
    } finally {
      setBusy(false);
    }
  }

  async function onDownloadPdf() {
    if (!invoice) return;
    setError(null);
    try {
      const res = await fetch(api.invoicePdfUrl(invoice.id), {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json()) as ApiErrorBody;
        throw new ApiRequestError(body, res.status);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${invoice.id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not download the invoice PDF.");
    }
  }

  async function onPay(e: FormEvent) {
    e.preventDefault();
    if (!invoice) return;
    setError(null);
    setBusy(true);
    try {
      const res = await api.payInvoice(invoice.id, cardNumber, accessToken);
      onInvoiceChange(res.invoice);
      setPayments((prev) => [...prev, res.payment]);
      setCardNumber("");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Payment failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <tr className="transition-colors hover:bg-surface-subtle">
      <td className="px-4 py-3 align-top text-sm text-ink-600">
        {shipment.origin.label} &rarr; {shipment.destination.label}
      </td>
      <td className="px-4 py-3 align-top font-mono text-sm text-ink-600">
        {(shipment.priceCents / 100).toFixed(2)} {shipment.currency}
      </td>
      <td className="px-4 py-3 align-top">
        {!invoice && (
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`currency-${shipment.id}`} className="text-xs font-medium text-muted">
                Currency
              </label>
              <SelectInput
                id={`currency-${shipment.id}`}
                value={currency}
                onChange={(e) => setCurrency(e.target.value as BillingCurrency)}
                className="w-28"
              >
                {BILLING_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </SelectInput>
            </div>
            <Button type="button" variant="secondary" disabled={busy} onClick={onGenerate}>
              Generate Invoice
            </Button>
          </div>
        )}
        {invoice && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-ink-600">
              {formatAmount(invoice.amountCents, invoice.currency)} —{" "}
              <Badge tone={invoiceTone(invoice.status)}>{invoice.status}</Badge>
            </p>
            <button
              type="button"
              onClick={onDownloadPdf}
              className="self-start text-sm font-medium text-brand-600 hover:underline"
            >
              Download PDF
            </button>
            {invoice.status === "open" && (
              <form onSubmit={onPay} className="flex flex-wrap items-end gap-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={`card-${shipment.id}`} className="text-xs font-medium text-muted">
                    Card number
                  </label>
                  <TextInput
                    id={`card-${shipment.id}`}
                    name="cardNumber"
                    inputMode="numeric"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-44"
                  />
                </div>
                <Button type="submit" disabled={busy}>
                  Pay
                </Button>
              </form>
            )}
            {payments.length > 0 && (
              <ul className="flex flex-col gap-1">
                {payments.map((p) => (
                  <li key={p.id} className="font-mono text-xs text-faint">
                    Attempt {p.attemptNumber}: {p.status}
                    {p.failureReason ? ` (${p.failureReason})` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {error && (
          <div className="mt-2">
            <Alert tone="error">{error}</Alert>
          </div>
        )}
      </td>
    </tr>
  );
}
