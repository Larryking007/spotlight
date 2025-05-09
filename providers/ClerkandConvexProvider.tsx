import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { Children } from "react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkLoaded } from "@clerk/clerk-expo";
import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!);

export default function ClerkandConvexProvider({ children: Children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider tokenCache={tokenCache}>
      <ConvexProviderWithClerk useAuth={useAuth} client={convex}>
        <ClerkLoaded>{Children}</ClerkLoaded>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}