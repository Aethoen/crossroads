"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Group, Settings, LogOut } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/groups", label: "Groups", icon: Group },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function NavBar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <nav className="relative z-10 border-b-2 border-dashed border-border/65 bg-[rgb(253_251_247_/_0.88)] backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
          <Link href="/dashboard" className="group inline-flex w-fit items-center gap-3">
            <span className="paper-panel-soft flex h-12 w-12 -rotate-3 items-center justify-center p-2 transition-transform duration-100 group-hover:rotate-0">
              <Image
                src="/logo.svg"
                alt="Crossroads logo"
                width={32}
                height={32}
                className="h-full w-full object-contain"
                priority
              />
            </span>
            <span className="section-title text-3xl font-bold tracking-tight">
              Crossroads
            </span>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-2",
                    pathname === href && "bg-secondary font-medium text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={2.5} />
                  <span>{label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 self-end md:self-auto">
          <div className="paper-panel-soft hidden px-3 py-2 md:block">
            <p className="text-sm leading-none text-muted-foreground">Signed in as</p>
            <p className="section-title text-lg leading-none">
              {session?.user?.name?.split(" ")[0] ?? "Friend"}
            </p>
          </div>
          <Avatar className="h-10 w-10">
            <AvatarImage src={session?.user?.image ?? ""} />
            <AvatarFallback>
              {session?.user?.name?.slice(0, 2).toUpperCase() ?? "??"}
            </AvatarFallback>
          </Avatar>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="h-4 w-4" strokeWidth={2.5} />
          </Button>
        </div>
      </div>
    </nav>
  );
}
