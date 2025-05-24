import { Query } from "convex/server";
import { mutation, MutationCtx, query, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const createUser = mutation({
  args: {
    username: v.string(),
    fullname: v.string(),
    image: v.string(),
    bio: v.optional(v.string()),
    email: v.string(),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {

    //check if the user already exists 
    const existingUser =  await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
    .first();  
    
    //if the user already exists, return

    if(existingUser) return;

  //create a new user
    await ctx.db.insert("users", {
      username: args.username,
      fullname: args.fullname,
      image: args.image,
      bio: args.bio,
      email: args.email,
      clerkId: args.clerkId,
      followers: 0,
      following: 0,
      posts: 0,
    })
  }
});


export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("User not found");
    return user;
  }
});

export const updateProfile = mutation({
  args: {
    fullname: v.string(),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);

    await ctx.db.patch(currentUser._id, {
      fullname: args.fullname,
      bio: args.bio,
    });
  }
});

export async function getAuthenticatedUser( ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");

  const currentUser = await ctx.db
  .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .first();

  if (!currentUser) throw new Error("User not found");
  
  return currentUser;
}

export const getUserProfile = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) throw new Error("User not found");

    return user;
  }
});

export const isFollowing = query({
  args: { followingId: v.id("users") },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);

    const follow = await ctx.db
      .query("follow")
      .withIndex("by_both", (q) =>
        q.eq("followerId", currentUser._id).eq("followingId", args.followingId)
      )
      .first();

    return !!follow;
  }
});

export const toggleFollow = mutation({
  args: { followingId: v.id("users") },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);

    const existing = await ctx.db
      .query("follow")
      .withIndex("by_both", (q) =>
        q.eq("followerId", currentUser._id).eq("followingId", args.followingId)
      )
      .first();

    if (existing) {
      // Unfollow the user
      await ctx.db.delete(existing._id);
      await updateFollowCounts(ctx,currentUser._id, args.followingId, false);
    } else {
      // Follow the user
      await ctx.db.insert("follow", {
        followerId: currentUser._id,
        followingId: args.followingId,
      });
      await updateFollowCounts(ctx,currentUser._id, args.followingId, true);

      // Create a notification for the followed user
      await ctx.db.insert("notifications", {
        receiverId: args.followingId,
        senderId: currentUser._id,
        type: "follow",
      });
    }
  }
});

async function updateFollowCounts(
  ctx: MutationCtx, 
  followerId: Id<"users">, 
  followingId: Id<"users">, 
  isFollowing: boolean
) {
  const follower = await ctx.db.get(followerId);
  const following = await ctx.db.get(followingId);

  if (follower && following) {
    await ctx.db.patch(follower._id, {
    following: follower.following + (isFollowing ? 1 : -1),
  });

  await ctx.db.patch(following._id, {
    followers: following.followers + (isFollowing ? 1 : -1),
  });
  }
} 