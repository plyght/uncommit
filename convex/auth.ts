import GitHub from "@auth/core/providers/github";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    GitHub({
      authorization: {
        params: { scope: "read:user user:email repo" },
      },
      profile(githubProfile, tokens) {
        return {
          id: githubProfile.id.toString(),
          name: githubProfile.name ?? githubProfile.login,
          email: githubProfile.email ?? undefined,
          image: githubProfile.avatar_url,
          githubAccessToken: tokens.access_token,
        };
      },
    }),
  ],
});
