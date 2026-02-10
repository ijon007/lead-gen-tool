"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { SignUpButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <>
      <Authenticated>
        <RedirectToLeads />
      </Authenticated>
      <Unauthenticated>
        <div className="flex min-h-screen flex-col items-center justify-center px-4">
          <div className="mx-auto w-full max-w-2xl text-center">
            <h1 className="mb-6 font-bold text-5xl text-foreground">
              Lead Generator
            </h1>
            <p className="mb-8 text-lg text-muted-foreground">
              Search for business leads by category and location. Export results
              to CSV and manage your leads efficiently.
            </p>
            <SignUpButton mode="modal">
              <Button>
                Get started
              </Button>
            </SignUpButton>
          </div>
        </div>
      </Unauthenticated>
    </>
  );
}

function RedirectToLeads() {
  const router = useRouter();
  useEffect(() => {
    router.push("/leads");
  }, [router]);
  return null;
}
