/** One linked QuickBooks Online company per row; a user may have many. */
export type QBOConnectionRecord = {
  id: string;
  userId: string;
  realmId: string;
  companyName: string | null;
  accessTokenEnc: string;
  refreshTokenEnc: string;
  tokenExpiresAt: number;
  environment: string;
  createdAt: string;
};
