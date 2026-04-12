import { Resend } from "resend";
import env from "@/env";

let resendClient: Resend | null = null;

export const getResendClient = (): Resend => {
    if (resendClient) {
        return resendClient;
    }

    resendClient = new Resend(env.RESEND_API_KEY);
    return resendClient;
};
