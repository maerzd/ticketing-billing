import { Suspense } from "react";
import { Toaster } from "sonner";
import { AppHeader } from "@/components/layout/Header";

export const dynamic = "force-dynamic";

export default function TransfersLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<>
			<AppHeader />
			<Suspense fallback={<div className="p-8">Loading...</div>}>
				{children}
			</Suspense>
			<Toaster />
		</>
	);
}
