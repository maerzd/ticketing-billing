"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useBreadcrumb } from "@/context/breadcrumb-context";

type Crumb = {
	label: string;
	href: string;
};

const SEGMENT_LABELS: Record<string, string> = {
	dashboard: "Dashboard",
	banking: "Banking",
	beneficiaries: "Begünstigte",
	invoices: "Rechnungen",
	transfers: "Überweisungen",
	pos: "POS",
};

function isLikelyIdentifier(segment: string) {
	return /^[a-f0-9-]{8,}$/i.test(segment);
}

function toTitleCase(value: string) {
	return value
		.split("-")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

function resolveLabel(segment: string, index: number, segments: string[]) {
	if (SEGMENT_LABELS[segment]) {
		return SEGMENT_LABELS[segment];
	}

	if (segments[index - 1] === "pos" && isLikelyIdentifier(segment)) {
		return "Details";
	}

	if (isLikelyIdentifier(segment)) {
		return "Eintrag";
	}

	return toTitleCase(decodeURIComponent(segment));
}

function buildCrumbs(pathname: string, eventName?: string): Crumb[] {
	const segments = pathname.split("/").filter(Boolean);
	const lastIndex = segments.length - 1;
	const customLabel = eventName?.trim();
	let href = "";

	return segments.map((segment, index) => {
		href += `/${segment}`;
		const isLastSegment = index === lastIndex;
		const isDynamicSegment = isLikelyIdentifier(segment);
		const label =
			customLabel && isLastSegment && isDynamicSegment
				? customLabel
				: resolveLabel(segment, index, segments);

		return {
			label,
			href,
		};
	});
}

export function AuthenticatedPageHeader() {
	const pathname = usePathname();
	const { eventName } = useBreadcrumb();
	const crumbs = buildCrumbs(pathname, eventName);

	if (crumbs.length === 0) {
		return null;
	}

	return (
		<header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
			<div className="flex items-center gap-2 px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator
					orientation="vertical"
					className="mr-2 data-[orientation=vertical]:h-4"
				/>
				<Breadcrumb>
					<BreadcrumbList>
						{crumbs.map((crumb, index) => {
							const isLast = index === crumbs.length - 1;

							return (
								<Fragment key={crumb.href}>
									<BreadcrumbItem>
										{isLast ? (
											<BreadcrumbPage>{crumb.label}</BreadcrumbPage>
										) : (
											<BreadcrumbLink render={<Link href={crumb.href} />}>
												{crumb.label}
											</BreadcrumbLink>
										)}
									</BreadcrumbItem>
									{!isLast && <BreadcrumbSeparator />}
								</Fragment>
							);
						})}
					</BreadcrumbList>
				</Breadcrumb>
			</div>
		</header>
	);
}
