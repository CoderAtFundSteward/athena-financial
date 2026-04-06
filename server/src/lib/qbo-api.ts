/** Fetch display name for a QBO company (requires valid access token). */
export async function fetchQuickBooksCompanyName(
  realmId: string,
  accessToken: string,
  environment: string,
): Promise<string | null> {
  const base =
    environment === 'production'
      ? 'https://quickbooks.api.intuit.com'
      : 'https://sandbox-quickbooks.api.intuit.com';
  const url = `${base}/v3/company/${realmId}/companyinfo/${realmId}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    CompanyInfo?: { CompanyName?: string };
    QueryResponse?: { CompanyInfo?: Array<{ CompanyName?: string }> };
  };
  return (
    data.CompanyInfo?.CompanyName ??
    data.QueryResponse?.CompanyInfo?.[0]?.CompanyName ??
    null
  );
}
