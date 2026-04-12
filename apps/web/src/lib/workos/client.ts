import { WorkOS } from "@workos-inc/node";
import env from "@/env";

export class WorkosClient {
    readonly workos: WorkOS;

    constructor() {
        this.workos = new WorkOS(env.WORKOS_API_KEY);
    }
}
