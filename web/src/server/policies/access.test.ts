import { describe, expect, it } from "vitest";
import { can, canManage, canParticipate, owns, type Access } from "./access";

const member: Access = { userId: "u1", status: "active", roles: ["USER"], permissions: [] };
const moderator: Access = {
  userId: "m1",
  status: "active",
  roles: ["USER", "MODERATOR"],
  permissions: ["admin.access", "users.read", "listings.moderate"],
};

describe("role level", () => {
  it("grants only the permissions a member holds", () => {
    expect(can(moderator, "listings.moderate")).toBe(true);
    expect(can(moderator, "payments.manage")).toBe(false);
    expect(can(member, "admin.access")).toBe(false);
  });

  it("grants nothing to visitors", () => {
    expect(can(null, "admin.access")).toBe(false);
  });

  it("grants nothing to a suspended or banned account, whatever its roles", () => {
    expect(can({ ...moderator, status: "suspended" }, "listings.moderate")).toBe(false);
    expect(can({ ...moderator, status: "banned" }, "admin.access")).toBe(false);
  });
});

describe("ownership and resource level", () => {
  const listing = { ownerId: "u1", moderatePermission: "listings.moderate" as const };

  it("lets a seller manage their own listing", () => {
    expect(owns(member, "u1")).toBe(true);
    expect(canManage(member, listing)).toBe(true);
  });

  it("stops a seller managing someone else's listing", () => {
    expect(canManage({ ...member, userId: "u2" }, listing)).toBe(false);
  });

  it("lets a moderator manage any listing", () => {
    expect(canManage(moderator, listing)).toBe(true);
  });

  it("does not let a moderator's listing permission reach other resources", () => {
    expect(canManage(moderator, { ownerId: "u1", moderatePermission: "orders.manage" })).toBe(
      false,
    );
  });

  it("stops a suspended owner changing their own record", () => {
    expect(canManage({ ...member, status: "suspended" }, listing)).toBe(false);
    expect(canParticipate({ ...member, status: "suspended" })).toBe(false);
  });

  it("treats a missing owner as nobody's", () => {
    expect(owns(member, null)).toBe(false);
    expect(canManage(null, listing)).toBe(false);
  });
});
