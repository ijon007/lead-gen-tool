"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { SignUpButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "@phosphor-icons/react";
import HeroContent from "@/components/hero-content";

export default function Home() {
  return (
    <>
      <Authenticated>
        <HeroContent>
          <Link href="/leads">
            <Button
              variant="secondary"
              className="group gap-1.5 dark:bg-white dark:text-black px-3 font-medium text-foreground transition-all hover:gap-2 hover:bg-white"
            >
              Go to Leads
              <ArrowRightIcon className="size-3 transition-transform group-hover:translate-x-0.5" weight="bold" />
            </Button>
          </Link>
        </HeroContent>
      </Authenticated>
      <Unauthenticated>
        <HeroContent>
          <SignUpButton mode="modal">
            <Button
              variant="secondary"
              className="group gap-1.5 border-white/20 px-3 font-medium text-foreground transition-all hover:gap-2 hover:bg-white"
            >
              Get Started
              <ArrowRightIcon
                className="size-3 shrink-0 transition-transform group-hover:translate-x-0.5"
                weight="bold"
              />
            </Button>
          </SignUpButton>
        </HeroContent>
      </Unauthenticated>
    </>
  );
}
