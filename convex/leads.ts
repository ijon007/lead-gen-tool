import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./lib/auth";

export const listBySheet = query({
  args: { sheetId: v.id("sheets") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const sheet = await ctx.db.get(args.sheetId);
    if (!sheet) throw new Error("Sheet not found");
    if (sheet.userId !== user._id) throw new Error("Unauthorized");
    return await ctx.db
      .query("leads")
      .withIndex("by_sheet_and_created", (q) => q.eq("sheetId", args.sheetId))
      .order("asc")
      .collect();
  },
});

export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    return await ctx.db
      .query("leads")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const create = mutation({
  args: {
    sheetId: v.id("sheets"),
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
    qualification: v.optional(
      v.union(v.literal("High"), v.literal("Low"), v.literal("Skip"))
    ),
    qualificationScore: v.optional(v.number()),
    qualificationReasoning: v.optional(v.string()),
    qualificationCriteria: v.optional(
      v.array(
        v.object({
          criterion: v.string(),
          met: v.boolean(),
          evidence: v.string(),
          points: v.number(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    // Verify sheet belongs to user
    const sheet = await ctx.db.get(args.sheetId);
    if (!sheet) throw new Error("Sheet not found");
    if (sheet.userId !== user._id) throw new Error("Unauthorized");

    return await ctx.db.insert("leads", {
      sheetId: args.sheetId,
      userId: user._id,
      businessName: args.businessName,
      category: args.category,
      location: args.location,
      email: args.email,
      phone: args.phone,
      website: args.website,
      address: args.address,
      description: args.description,
      status: args.status,
      rating: args.rating,
      googleMapsUri: args.googleMapsUri,
      instagram: args.instagram,
      facebook: args.facebook,
      linkedIn: args.linkedIn,
      x: args.x,
      notes: args.notes,
      qualification: args.qualification,
      qualificationScore: args.qualificationScore,
      qualificationReasoning: args.qualificationReasoning,
      qualificationCriteria: args.qualificationCriteria,
      createdAt: Date.now(),
    });
  },
});

export const createBatch = mutation({
  args: {
    sheetId: v.id("sheets"),
    leads: v.array(
      v.object({
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
        qualification: v.optional(
          v.union(
            v.literal("High"),
            v.literal("Low"),
            v.literal("Skip")
          )
        ),
        qualificationScore: v.optional(v.number()),
        qualificationReasoning: v.optional(v.string()),
        qualificationCriteria: v.optional(
          v.array(
            v.object({
              criterion: v.string(),
              met: v.boolean(),
              evidence: v.string(),
              points: v.number(),
            })
          )
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    
    // Verify sheet belongs to user
    const sheet = await ctx.db.get(args.sheetId);
    if (!sheet) throw new Error("Sheet not found");
    if (sheet.userId !== user._id) throw new Error("Unauthorized");

    const now = Date.now();
    const leadIds = [];
    
    for (let i = 0; i < args.leads.length; i++) {
      const lead = args.leads[i];
      const id = await ctx.db.insert("leads", {
        sheetId: args.sheetId,
        userId: user._id,
        businessName: lead.businessName,
        category: lead.category,
        location: lead.location,
        email: lead.email,
        phone: lead.phone,
        website: lead.website,
        address: lead.address,
        description: lead.description,
        status: lead.status,
        rating: lead.rating,
        googleMapsUri: lead.googleMapsUri,
        instagram: lead.instagram,
        facebook: lead.facebook,
        linkedIn: lead.linkedIn,
        x: lead.x,
        notes: lead.notes,
        qualification: lead.qualification,
        qualificationScore: lead.qualificationScore,
        qualificationReasoning: lead.qualificationReasoning,
        qualificationCriteria: lead.qualificationCriteria,
        createdAt: now + i,
      });
      leadIds.push(id);
    }

    return leadIds;
  },
});

const qualificationValidator = v.union(
  v.literal("High"),
  v.literal("Low"),
  v.literal("Skip")
);

export const update = mutation({
  args: {
    leadId: v.id("leads"),
    businessName: v.optional(v.string()),
    category: v.optional(v.string()),
    location: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    address: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    rating: v.optional(v.number()),
    googleMapsUri: v.optional(v.string()),
    instagram: v.optional(v.string()),
    facebook: v.optional(v.string()),
    linkedIn: v.optional(v.string()),
    x: v.optional(v.string()),
    notes: v.optional(v.string()),
    qualification: v.optional(qualificationValidator),
    qualificationScore: v.optional(v.number()),
    qualificationReasoning: v.optional(v.string()),
    qualificationCriteria: v.optional(
      v.array(
        v.object({
          criterion: v.string(),
          met: v.boolean(),
          evidence: v.string(),
          points: v.number(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const lead = await ctx.db.get(args.leadId);

    if (!lead) throw new Error("Lead not found");
    if (lead.userId !== user._id) throw new Error("Unauthorized");

    const updates: Partial<typeof lead> = {};
    if (args.businessName !== undefined) updates.businessName = args.businessName;
    if (args.category !== undefined) updates.category = args.category;
    if (args.location !== undefined) updates.location = args.location;
    if (args.email !== undefined) updates.email = args.email;
    if (args.phone !== undefined) updates.phone = args.phone;
    if (args.website !== undefined) updates.website = args.website;
    if (args.address !== undefined) updates.address = args.address;
    if (args.description !== undefined) updates.description = args.description;
    if (args.status !== undefined) updates.status = args.status;
    if (args.rating !== undefined) updates.rating = args.rating;
    if (args.googleMapsUri !== undefined) updates.googleMapsUri = args.googleMapsUri;
    if (args.instagram !== undefined) updates.instagram = args.instagram;
    if (args.facebook !== undefined) updates.facebook = args.facebook;
    if (args.linkedIn !== undefined) updates.linkedIn = args.linkedIn;
    if (args.x !== undefined) updates.x = args.x;
    if (args.notes !== undefined) updates.notes = args.notes;
    if (args.qualification !== undefined) updates.qualification = args.qualification;
    if (args.qualificationScore !== undefined) updates.qualificationScore = args.qualificationScore;
    if (args.qualificationReasoning !== undefined) updates.qualificationReasoning = args.qualificationReasoning;
    if (args.qualificationCriteria !== undefined) updates.qualificationCriteria = args.qualificationCriteria;

    await ctx.db.patch(args.leadId, updates);
  },
});

const qualificationCriteriaValidator = v.array(
  v.object({
    criterion: v.string(),
    met: v.boolean(),
    evidence: v.string(),
    points: v.number(),
  })
);

export const updateBatch = mutation({
  args: {
    updates: v.array(
      v.object({
        leadId: v.id("leads"),
        qualification: qualificationValidator,
        qualificationScore: v.optional(v.number()),
        qualificationReasoning: v.optional(v.string()),
        qualificationCriteria: v.optional(qualificationCriteriaValidator),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    for (const u of args.updates) {
      const lead = await ctx.db.get(u.leadId);
      if (!lead) throw new Error("Lead not found");
      if (lead.userId !== user._id) throw new Error("Unauthorized");
      const patch: Record<string, unknown> = { qualification: u.qualification };
      if (u.qualificationScore !== undefined) patch.qualificationScore = u.qualificationScore;
      if (u.qualificationReasoning !== undefined) patch.qualificationReasoning = u.qualificationReasoning;
      if (u.qualificationCriteria !== undefined) patch.qualificationCriteria = u.qualificationCriteria;
      await ctx.db.patch(u.leadId, patch);
    }
  },
});

export const removeMany = mutation({
  args: { leadIds: v.array(v.id("leads")) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    for (const leadId of args.leadIds) {
      const lead = await ctx.db.get(leadId);
      if (!lead) throw new Error("Lead not found");
      if (lead.userId !== user._id) throw new Error("Unauthorized");
      await ctx.db.delete(leadId);
    }
  },
});

export const remove = mutation({
  args: { leadId: v.id("leads") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const lead = await ctx.db.get(args.leadId);

    if (!lead) throw new Error("Lead not found");
    if (lead.userId !== user._id) throw new Error("Unauthorized");

    await ctx.db.delete(args.leadId);
  },
});
