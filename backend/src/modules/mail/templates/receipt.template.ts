import { Order } from '../../orders/order.entity';

export interface StoreInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  receiptFooter: string;
  currency: string;
}

const escape = (value: string | number | null | undefined): string =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]!,
  );

/** HTML e-mail receipt (Laravel view: orders/mailDetails.blade.php). */
export const renderReceiptEmail = (order: Order, store: StoreInfo): string => {
  const money = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: store.currency,
  });
  const date = new Date(order.createdAt).toLocaleString('en-GB', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
  const rows = order.items
    .map(
      (i) => `<tr>
        <td style="padding:6px 8px;border-bottom:1px solid #eee">${escape(i.productName)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${money.format(i.unitPrice)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${money.format(i.subtotal)}</td>
      </tr>`,
    )
    .join('');

  const discountRows =
    order.discount > 0
      ? `<tr><td colspan="3" style="padding:4px 8px;text-align:right">Discount</td><td style="padding:4px 8px;text-align:right">-${money.format(order.discount)}</td></tr>
         <tr><td colspan="3" style="padding:4px 8px;text-align:right"><strong>Amount paid</strong></td><td style="padding:4px 8px;text-align:right"><strong>${money.format(order.amountPaid)}</strong></td></tr>`
      : '';

  return `<!doctype html>
<html><body style="font-family:Arial,Helvetica,sans-serif;color:#222;max-width:560px;margin:0 auto">
  <h2 style="text-align:center;margin-bottom:4px">${escape(store.name)}</h2>
  <p style="text-align:center;margin:0;color:#555">${escape(store.address)}</p>
  <p style="text-align:center;margin:0 0 16px;color:#555">${escape(store.phone)}${store.email ? ` · ${escape(store.email)}` : ''}</p>
  <p><strong>Receipt #${escape(order.orderNumber)}</strong><br>${escape(date)}<br>Served by ${escape(order.salesperson)}</p>
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    <thead><tr style="background:#f4f4f4">
      <th style="padding:6px 8px;text-align:left">Item</th><th style="padding:6px 8px">Qty</th>
      <th style="padding:6px 8px;text-align:right">Price</th><th style="padding:6px 8px;text-align:right">Sub-total</th>
    </tr></thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr><td colspan="3" style="padding:8px;text-align:right"><strong>Total</strong></td><td style="padding:8px;text-align:right"><strong>${money.format(order.totalPrice)}</strong></td></tr>
      ${discountRows}
      <tr><td colspan="3" style="padding:4px 8px;text-align:right">Payment</td><td style="padding:4px 8px;text-align:right">${escape(order.paymentType)}</td></tr>
    </tfoot>
  </table>
  <p style="text-align:center;color:#555;margin-top:24px">${escape(store.receiptFooter)}</p>
</body></html>`;
};
