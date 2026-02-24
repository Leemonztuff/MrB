// types/next-fixes.ts
// Temporary fix for Next.js 15.x async params
export type PageProps = {
  params: Promise<any>;
  searchParams?: Promise<any>;
};