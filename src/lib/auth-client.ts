import { createAuthClient } from "better-auth/client";
import { emailOTPClient, passkeyClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    plugins: [
        emailOTPClient(),
        passkeyClient()
    ]
});