import test from "node:test";
import assert from "node:assert/strict";
import { isDepotVisible } from "./depotVisibility.js";

test("hides depots when subscription expiry is invalid", () => {
  const depot = {
    id: "abc",
    name: "Test depot",
    is_active: true,
    payment_pending: false,
    subscription_status: "active",
    subscription_expiry: "not-a-date",
    tier: "none",
  };

  assert.equal(isDepotVisible(depot), false);
});

test("keeps active depots visible when the standard subscription is still valid, even if premium tier expiry has elapsed", () => {
  const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const depot = {
    id: "def",
    name: "Visible depot",
    is_active: true,
    payment_pending: false,
    subscription_status: "active",
    subscription_expiry: future,
    tier_expiry: past,
    tier: "basic",
  };

  assert.equal(isDepotVisible(depot), true);
});

test("keeps active depots visible when expiry dates are valid and in the future", () => {
  const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const depot = {
    id: "ghi",
    name: "Visible premium depot",
    is_active: true,
    payment_pending: false,
    subscription_status: "active",
    subscription_expiry: future,
    tier_expiry: future,
    tier: "basic",
  };

  assert.equal(isDepotVisible(depot), true);
});
