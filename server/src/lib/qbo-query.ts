import type { QBOConnectionRecord } from './qbo-store-types';
import { getValidAccessToken } from './qbo-token';

const MINOR_VERSION = '73';

export async function queryAccountsSample(
  conn: QBOConnectionRecord,
  maxResults = 50,
): Promise<{ accounts: Array<{ id: string; name: string; type?: string }> }> {
  const accessToken = await getValidAccessToken(conn);
  const base =
    conn.environment === 'production'
      ? 'https://quickbooks.api.intuit.com'
      : 'https://sandbox-quickbooks.api.intuit.com';
  const q = encodeURIComponent(`select * from Account maxresults ${maxResults}`);
  const url = `${base}/v3/company/${conn.realmId}/query?query=${q}&minorversion=${MINOR_VERSION}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`QBO query failed: ${res.status} ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    QueryResponse?: {
      Account?: Array<{ Id?: string; Name?: string; AccountType?: string }>;
    };
  };

  const raw = data.QueryResponse?.Account ?? [];
  const accounts = raw.map((a) => ({
    id: a.Id ?? '',
    name: a.Name ?? '',
    type: a.AccountType,
  }));

  return { accounts };
}
