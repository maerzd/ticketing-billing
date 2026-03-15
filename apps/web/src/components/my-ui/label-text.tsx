import { cn } from "@/lib/utils";

export default function LabelText({
	label,
	value,
	className,
}: Readonly<{
	label: string;
	value: React.ReactNode;
	className?: string;
}>): React.ReactNode {
	return (
		<div className={cn(className, "flex flex-col")}>
			<span className="mb-1 text-muted-foreground text-sm">{label}</span>
			<span className="font-semibold">{value}</span>
		</div>
	);
}
