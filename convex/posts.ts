import { v } from "convex/values";
import { mutation, MutationCtx, query } from "./_generated/server";
import { getAuthenticatedUser, updateProfile } from "./users";
import { Id } from "./_generated/dataModel";

export const generateUploadUrl = mutation(async (ctx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");

    return await ctx.storage.generateUploadUrl();
  });

export const createPost = mutation({
  args: {
    caption: v.optional(v.string()),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const currentUser = await getAuthenticatedUser(ctx);

    const imageUrl = await ctx.storage.getUrl(args.storageId)
    if (!imageUrl) throw new Error("Image not found");

    // create a new post
   const postId =  await ctx.db.insert("posts", {
      userId: currentUser._id,
      imageUrl: imageUrl,
      storageId: args.storageId,
      caption: args.caption,
      likes: 0,
      comments: 0,
    });

    // increment the user's posts count by 1
    await ctx.db.patch(currentUser._id, {
      posts: currentUser.posts + 1,
    });

    return postId;
  }
    });

    export const getFeedPosts = query({
      handler: async (ctx) => {
        const currentUser = await getAuthenticatedUser(ctx);

      // get all posts
      const posts = await ctx.db
        .query("posts")
        .order("desc")
        .collect();

        if(posts.length === 0) return [];
        
        // enhance posts with userdata amd interactions
        const postswithInfo = await Promise.all(
          posts.map(async (post) => {
            const postAuthor = (await ctx.db.get(post.userId))!;
            
            const like = await ctx.db
              .query("likes")
              .withIndex("by_user_and_post", (q) => 
                q.eq("userId", currentUser._id).eq("postId", post._id))
              .first();

            const bookmark = await ctx.db
              .query("bookmarks")
              .withIndex("by_user_and_post", (q) =>
                q.eq("userId",currentUser._id).eq("postId", post._id)
            )
              .first();

            return {
              ...post,
              author: {
                _id: postAuthor?._id,
                username: postAuthor?.username,
                image: postAuthor?.image,
              },
                isLiked: !!like,
                isBookmarked: !!bookmark,
            };
          })
        );

        return postswithInfo;
      }
    });

    export const toggleLike = mutation({
      args: {
        postId: v.id("posts")},
      handler: async (ctx, args) => {
        const currentUser = await getAuthenticatedUser(ctx);

        const existing = await ctx.db
          .query("likes")
          .withIndex("by_user_and_post", (q) =>
            q.eq("userId", currentUser._id).eq("postId", args.postId)
          )
          .first();

          const post = await ctx.db.get(args.postId);
          if (!post) throw new Error("Post not found");

          if (existing) {
            //remove the like
            await ctx.db.delete(existing._id);
            await ctx.db.patch(post._id, {
              likes: post.likes - 1,
            });
            return false;
          } else {
            //add a new like
            await ctx.db.insert("likes", {
              userId: currentUser._id,
              postId: args.postId,
            });
            await ctx.db.patch(post._id, {
              likes: post.likes + 1,
            });

            //if it's not my post, create a notification
            if (currentUser._id !== post.userId ) {
              await ctx.db.insert("notifications", {
                receiverId: post.userId,
                senderId: currentUser._id,
                type: "like",
                postId: args.postId,
              });
            }
          }
          return true;
          }
    })

    export const deletePost = mutation({
      args: { postId: v.id("posts") },
      handler: async (ctx, args) => {
        const currentUser = await getAuthenticatedUser(ctx);

        const post = await ctx.db.get(args.postId);
        if (!post) throw new Error("Post not found");

        // verify if the post belongs to the current user
        if (post.userId !== currentUser._id) throw new Error("Unauthorized");

        // delete associated likes
        const likes = await ctx.db
          .query("likes")
          .withIndex("by_post", (q) =>
            q.eq("postId", args.postId)
          )
          .collect();
        
        for (const like of likes) {
          await ctx.db.delete(like._id);
        }
        // delete associated comments
        const comments = await ctx.db
          .query("comment")
          .withIndex("by_post", (q) =>
            q.eq("postId", args.postId)
          )
          .collect();
        
        for (const comment of comments) {
          await ctx.db.delete(comment._id);
        }
        // delete associated bookmarks
        const bookmarks = await ctx.db
          .query("bookmarks")
          .withIndex("by_post", (q) =>
            q.eq("postId", args.postId)
          )
          .collect();
                  
        for (const bookmark of bookmarks) {
          await ctx.db.delete(bookmark._id);
        }

         // delete associated notifications
         const notifications = await ctx.db
          .query("notifications")
          .withIndex("by_post", (q) =>
            q.eq("postId", args.postId)
          )
          .collect();
                  
        for (const notification of notifications) {
          await ctx.db.delete(notification._id);
        }


        // delete the image from storage
        await ctx.storage.delete(post.storageId);

        // delete the post
        await ctx.db.delete(post._id);

        // decrement the user's posts count by 1
        await ctx.db.patch(currentUser._id, {
           posts: Math.max(currentUser.posts || 1) - 1 });
      }
    });

    export const getPostByUser = query({
      args: { 
        userId: v.optional(v.id("users"))
      },
      handler: async (ctx, args) => {
        const user = args.userId ? await ctx.db.get(args.userId) : await getAuthenticatedUser(ctx);

        if (!user) throw new Error("User not found");

        const posts = await ctx.db
          .query("posts")
          .withIndex("by_user", (q) =>
            q.eq("userId", args.userId || user._id)
          )
          .collect();

        return posts;
      }
    });

    export const getUserProfile = query({
      args: { id: v.id("users") },
      handler: async (ctx, args) => {
        const user = await ctx.db.get(args.id);
        if (!user) throw new Error("User not found");

        return user;
      }
    });

    export const isFollowing = query({
      args: { userId: v.id("users") },
      handler: async (ctx, args) => {
        const currentUser = await getAuthenticatedUser(ctx);

        const follow = await ctx.db
          .query("follow")
          .withIndex("by_both", (q) =>
            q.eq("followerId", currentUser._id).eq("followingId", args.userId)
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
