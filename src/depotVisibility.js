const parseExpiryDate = (value) => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
};

const getDaysRemaining = (value) => {
  const parsedDate = parseExpiryDate(value);
  if (!parsedDate) return Number.NEGATIVE_INFINITY;

  return Math.ceil((parsedDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
};

export const isDepotVisible = (depot) => {
  if (!depot) return false;
  if (depot.is_active === false) return false;
  if (depot.subscription_status === "inactive") return false;
  if (depot.payment_pending === true) return false;

  const subscriptionStatus = depot.subscription_status;
  if (
    subscriptionStatus &&
    subscriptionStatus !== "active" &&
    subscriptionStatus !== "free"
  ) {
    return false;
  }

  const subscriptionDaysRemaining = getDaysRemaining(depot.subscription_expiry);
  if (subscriptionDaysRemaining <= 0) return false;

  return true;
};
