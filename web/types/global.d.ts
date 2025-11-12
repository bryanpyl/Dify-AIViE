// types/global.d.ts
import { errorType } from "@/types/app";

declare global {
  interface Error {
    errorCode?: errorType;
  }
}

export {};