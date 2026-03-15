import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  audioRecording: f({
    audio: { maxFileSize: "64MB", maxFileCount: 1 },
    blob: { maxFileSize: "64MB", maxFileCount: 1 },
  })
    .middleware(async () => ({}))
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl };
    }),

  songUpload: f({
    audio: { maxFileSize: "64MB", maxFileCount: 1 },
  })
    .middleware(async () => ({}))
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
