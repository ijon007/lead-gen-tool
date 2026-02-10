import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.string(),
    email: v.string(),
  }).index("by_token", ["tokenIdentifier"]),

  sheets: defineTable({
    userId: v.id("users"),
    name: v.string(),
    searchParams: v.union(
      v.null(),
      v.object({
        category: v.string(),
        location: v.string(),
      })
    ),
    columns: v.array(
      v.object({
        id: v.string(),
        label: v.string(),
        visible: v.boolean(),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_created", ["userId", "createdAt"]),

  leads: defineTable({
    sheetId: v.id("sheets"),
    userId: v.id("users"),
    businessName: v.string(),
    category: v.string(),
    location: v.string(),
    email: v.string(),
    phone: v.string(),
    website: v.string(),
    address: v.string(),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    rating: v.optional(v.number()),
    googleMapsUri: v.optional(v.string()),
    instagram: v.optional(v.string()),
    facebook: v.optional(v.string()),
    linkedIn: v.optional(v.string()),
    x: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_sheet", ["sheetId"])
    .index("by_user", ["userId"])
    .index("by_sheet_and_created", ["sheetId", "createdAt"]),
});
