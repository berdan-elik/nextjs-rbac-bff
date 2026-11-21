import { z } from "zod";
import { forward } from "@/lib/bff";
import { postSchema } from "@/lib/schemas";

export function GET() {
  return forward("/posts", z.array(postSchema));
}
