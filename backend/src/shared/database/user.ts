import { createUserClient } from "./client.js";

export function getUserDatabase(token: string) {
  return createUserClient(token);
}
