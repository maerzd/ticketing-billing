"use client";

import {
	ArrowLeftRight,
	BanknoteArrowUp,
	Building2,
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

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
	user?: {
		name: string;
		email: string;
		avatar?: string;
	};
}

export function AppSidebar({ user, ...props }: Readonly<AppSidebarProps>) {
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
			title: "Transaktionen",
			url: "/banking/transactions",
			icon: ArrowLeftRight,
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
			title: "Veranstalter",
			url: "/organizers",
			icon: Building2,
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
