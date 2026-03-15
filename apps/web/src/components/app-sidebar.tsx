"use client";

import {
	BanknoteArrowUp,
	CalendarCheck,
	CalendarClock,
	FileText,
	LayoutDashboard,
	ShieldUser,
	Store,
	Users,
} from "lucide-react";
import type * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarRail,
} from "@/components/ui/sidebar";
import type { QontoOrganization } from "@/types/qonto/organization";

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
	// Navigation structure
	const navMain = [
		{
			title: "Dashboard",
			url: "/",
			icon: LayoutDashboard,
		},
		{
			title: "Upcoming Events",
			url: "/events?tab=upcoming",
			icon: CalendarClock,
		},
		{
			title: "Past Events",
			url: "/events?tab=past",
			icon: CalendarCheck,
		},
		{
			title: "POS",
			url: "/pos",
			icon: Store,
		},
		{
			title: "Invoices",
			url: "/banking/invoices",
			icon: FileText,
		},
		{
			title: "Transfers",
			url: "/banking/transfers",
			icon: BanknoteArrowUp,
		},
		{
			title: "Beneficiaries",
			url: "/banking/beneficiaries",
			icon: ShieldUser,
		},
		{
			title: "Clients",
			url: "/banking/clients",
			icon: Users,
		},
	];

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarContent>
				<NavMain items={navMain} />
			</SidebarContent>
			<SidebarFooter>
				<NavUser />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
