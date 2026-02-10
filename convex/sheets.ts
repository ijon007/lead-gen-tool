import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./lib/auth";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    return await ctx.db
      .query("sheets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { sheetId: v.id("sheets") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const sheet = await ctx.db.get(args.sheetId);

    if (!sheet) throw new Error("Sheet not found");
    if (sheet.userId !== user._id) throw new Error("Unauthorized");

    return sheet;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    searchParams: v.union(
      v.null(),
      v.object({
        category: v.string(),
        location: v.string(),
        limit: v.optional(v.number()),
      })
    ),
    columns: v.array(
      v.object({
        id: v.string(),
        label: v.string(),
        visible: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const now = Date.now();
    return await ctx.db.insert("sheets", {
      userId: user._id,
      name: args.name,
      searchParams: args.searchParams,
      columns: args.columns,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    sheetId: v.id("sheets"),
    name: v.optional(v.string()),
    searchParams: v.optional(
      v.union(
        v.null(),
        v.object({
          category: v.string(),
          location: v.string(),
          limit: v.optional(v.number()),
        })
      )
    ),
    columns: v.optional(
      v.array(
        v.object({
          id: v.string(),
          label: v.string(),
          visible: v.boolean(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const sheet = await ctx.db.get(args.sheetId);

    if (!sheet) throw new Error("Sheet not found");
    if (sheet.userId !== user._id) throw new Error("Unauthorized");

    const updates: {
      name?: string;
      searchParams?: typeof args.searchParams;
      columns?: typeof args.columns;
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.searchParams !== undefined) updates.searchParams = args.searchParams;
    if (args.columns !== undefined) updates.columns = args.columns;

    await ctx.db.patch(args.sheetId, updates);
  },
});

export const remove = mutation({
  args: { sheetId: v.id("sheets") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const sheet = await ctx.db.get(args.sheetId);

    if (!sheet) throw new Error("Sheet not found");
    if (sheet.userId !== user._id) throw new Error("Unauthorized");

    // Delete all leads associated with this sheet
    const leads = await ctx.db
      .query("leads")
      .withIndex("by_sheet", (q) => q.eq("sheetId", args.sheetId))
      .collect();

    for (const lead of leads) {
      await ctx.db.delete(lead._id);
    }

    await ctx.db.delete(args.sheetId);
  },
});
