import { cn } from "@/lib/utils";

import { Skeleton } from "../ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../ui/table";

type TableSkeletonProps = {
	rows?: number;
	columns?: number;
	showHeader?: boolean;
	className?: string;
	cellClassName?: string;
};

const DEFAULT_HEADER_WIDTHS = ["w-24", "w-32", "w-20", "w-28", "w-16", "w-36"];
const DEFAULT_CELL_WIDTHS = ["w-20", "w-28", "w-16", "w-24", "w-12", "w-32"];

function TableSkeleton({
	rows = 5,
	columns = 4,
	showHeader = true,
	className,
	cellClassName,
}: TableSkeletonProps) {
	return (
		<div className={cn("w-full", className)}>
			<Table>
				{showHeader && (
					<TableHeader>
						<TableRow>
							{Array.from({ length: columns }).map((_, columnIndex) => (
								<TableHead key={`header-${columnIndex}`}>
									<Skeleton
										className={cn(
											"h-4",
											DEFAULT_HEADER_WIDTHS[
												columnIndex % DEFAULT_HEADER_WIDTHS.length
											],
										)}
									/>
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
				)}
				<TableBody>
					{Array.from({ length: rows }).map((_, rowIndex) => (
						<TableRow key={`row-${rowIndex}`}>
							{Array.from({ length: columns }).map((_, columnIndex) => (
								<TableCell key={`cell-${rowIndex}-${columnIndex}`}>
									<Skeleton
										className={cn(
											"h-5",
											DEFAULT_CELL_WIDTHS[
												(columnIndex + rowIndex) % DEFAULT_CELL_WIDTHS.length
											],
											cellClassName,
										)}
									/>
								</TableCell>
							))}
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}

export { TableSkeleton };
