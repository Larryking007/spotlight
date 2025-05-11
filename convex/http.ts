import { httpRouter } from "convex/server"; 
import { httpAction } from "./_generated/server";
import { Webhook } from "svix";
import { api } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/clerkWebhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const WebhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!WebhookSecret) {
      throw new Error("Missing CLERK_WEBHOOK_SECRET");
    } 
    const svix = request.headers.get("svix-Id");
    const svix_signature = request.headers.get("svix-Signature");
    const svix_timestamp = request.headers.get("svix-Timestamp");

    if (!svix || !svix_signature || !svix_timestamp) {
      return new Response("Error occured -- no svix headers", {
        status: 400,
      });
    }

    const payload = await request.json();
    const body = JSON.stringify(payload);

    const webhook = new Webhook(WebhookSecret);
    let event: any;
    // Verify the webhook signature
    try {
      event = webhook.verify(body, {
        "svix-id": svix,
        "svix-signature": svix_signature,
        "svix-timestamp": svix_timestamp,
      }) as any;
    } catch (error) { 
      console.error("Error verifying webhook", error);
      return new Response("Error verifying webhook signature", {
        status: 400,
      });
    }

    const eventType = event.type;

    if (eventType === "user.created") {
      const user = event.data;
      const { id, email_addresses, first_name, last_name, image_url } = event.data;

      const email = email_addresses[0].email_address;
      const name = `${first_name || ""} ${last_name || ""}`.trim();

     try {
      await ctx.runMutation(api.users.createUser, {
        email,
        fullname: name,
        image: image_url,
        clerkId: id,
        username: email.split("@")[0],
      });
     } catch (error) {
      console.error("Error creating user", error);
      return new Response("Error creating user", { status: 500 });
     }
     }
     return new Response("Webhook processed successfully", {
      status: 200,
     });
  }),
  })

  export default http;
