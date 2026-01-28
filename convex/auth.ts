import GitHub from "@auth/core/providers/github";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { convexAuth } from "@convex-dev/auth/server";

const isDevMode = process.env.DEV_AUTH === "true";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    GitHub({
      authorization: {
        params: { scope: "read:user repo" },
      },
      profile(githubProfile, tokens) {
        return {
          id: githubProfile.id.toString(),
          name: githubProfile.name ?? githubProfile.login,
          email: githubProfile.email,
          image: githubProfile.avatar_url,
          githubAccessToken: tokens.access_token,
        };
      },
    }),
    ...(isDevMode ? [Anonymous] : []),
  ],
});
