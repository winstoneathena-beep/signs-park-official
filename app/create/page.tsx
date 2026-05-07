import { Suspense } from "react";
import { SignEditor } from "@/components/sign/SignEditor";

export const metadata = { title: "Create a sign" };

export default function CreatePage() {
  return (
    <Suspense fallback={null}>
      <SignEditor />
    </Suspense>
  );
}
