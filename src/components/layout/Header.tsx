"use client";

import { FileText, Home, LogOut, Send, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export function AppHeader() {
	const pathname = usePathname();

	const isActive = (path: string) =>
		pathname === path || pathname.startsWith(`${path}/`);

	return (
		<header className="border-slate-200 border-b bg-white">
			<div className="flex h-16 items-center justify-between pr-8 pl-8">
				<div className="flex items-center gap-8">
					<Link href="/dashboard" className="font-semibold text-slate-900">
						Abrechnungsportal
					</Link>
					<nav className="flex gap-1">
						<Link href="/dashboard">
							<Button
								variant={isActive("/dashboard") ? "default" : "ghost"}
								size="sm"
								className="gap-2"
							>
								<Home className="h-4 w-4" />
								Dashboard
							</Button>
						</Link>
						<Link href="/invoices">
							<Button
								variant={isActive("/invoices") ? "default" : "ghost"}
								size="sm"
								className="gap-2"
							>
								<FileText className="h-4 w-4" />
								Rechnungen
							</Button>
						</Link>
						<Link href="/transfers">
							<Button
								variant={isActive("/transfers") ? "default" : "ghost"}
								size="sm"
								className="gap-2"
							>
								<Send className="h-4 w-4" />
								Überweisungen
							</Button>
						</Link>
						<Link href="/banking/beneficiaries">
							<Button
								variant={isActive("/banking") ? "default" : "ghost"}
								size="sm"
								className="gap-2"
							>
								<Users className="h-4 w-4" />
								Begünstigte
							</Button>
						</Link>
					</nav>
				</div>
				<Link href="/api/auth/logout">
					<Button variant="outline" size="sm" className="gap-2">
						<LogOut className="h-4 w-4" />
						Abmelden
					</Button>
				</Link>
			</div>
		</header>
	);
}
