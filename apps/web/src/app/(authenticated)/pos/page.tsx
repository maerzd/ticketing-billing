import Link from "next/link";
import { Suspense } from "react";
import { TableSkeleton } from "@/components/my-ui/table-skeleton";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchAllPOS } from "@/lib/vivenu/client";

export default async function Page() {
	const pos = await fetchAllPOS();

	return (
		<div>
			<h1 className="mb-4 font-bold text-2xl">POS</h1>
			<Suspense fallback={<TableSkeleton rows={5} />}>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					{pos?.map((item) => {
						return (
							<Link
								key={item._id}
								href={`/pos/${item._id}`}
								className="cursor-pointer"
								prefetch={false}
							>
								<Card className="transition-colors hover:bg-muted/50">
									<CardHeader>
										<CardTitle>{item?.name ?? item.posNo}</CardTitle>
									</CardHeader>
								</Card>
							</Link>
						);
					})}
				</div>
			</Suspense>
		</div>
	);
}
