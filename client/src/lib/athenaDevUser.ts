const STORAGE_KEY = 'athena_dev_user_id';

/** Until app login exists, each browser gets a stable id for QuickBooks connection profiles. */
export function getOrCreateDevUserId(): string {
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return 'anonymous-dev-user';
  }
}
