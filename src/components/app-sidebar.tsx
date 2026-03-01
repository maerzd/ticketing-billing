"use client";

import { Banknote, BookOpen, Command, FileText, Settings2 } from "lucide-react";
import type * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from "@/components/ui/sidebar";
import type { QontoOrganization } from "@/types/organization";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
	organization?: QontoOrganization;
	user?: {
		name: string;
		email: string;
		avatar?: string;
	};
}

export function AppSidebar({
	organization,
	user,
	...props
}: Readonly<AppSidebarProps>) {
	// Build teams data from organization
	const teams = organization
		? [
				{
					name: organization.name,
					logo: Command,
					plan: organization.legal_form || "Organization",
				},
			]
		: [];

	// Build user data
	const userData = user || {
		name: "User",
		email: "user@example.com",
		avatar: "/avatars/default.jpg",
	};

	// Navigation structure
	const navMain = [
		{
			title: "Banking",
			url: "#",
			icon: Banknote,
			items: [
				{
					title: "Transfers",
					url: "/transfers",
				},
				{
					title: "Beneficiaries",
					url: "/banking/beneficiaries",
				},
			],
		},
		{
			title: "Invoices",
			url: "/invoices",
			icon: FileText,
		},
	];

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<TeamSwitcher teams={teams} />
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={navMain} />
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={userData} />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
