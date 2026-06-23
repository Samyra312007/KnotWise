import { serve } from "inngest/next";
import { inngest, inngestFunctions } from "@/lib/inngest/client";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: inngestFunctions,
});
