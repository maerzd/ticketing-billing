interface StatusLedProps {
	sellStart: string | Date | undefined;
	sellEnd: string | Date | undefined;
	showLabel?: boolean;
}

export function StatusLed({
	sellStart,
	sellEnd,
	showLabel = false,
}: Readonly<StatusLedProps>) {
	const now = new Date();
	if (!sellStart || !sellEnd) {
		return (
			<span className="flex items-center gap-2">
				<span
					className="inline-block h-3 w-3 rounded-full border border-gray-300 bg-white"
					title="Verkauf inaktiv"
				/>
				{showLabel && "Inaktiv"}
			</span>
		);
	}
	const start = new Date(sellStart);
	const end = new Date(sellEnd);

	const isOnSale = now >= start && now <= end;

	return (
		<span className="flex items-center gap-2">
			<span
				className={`inline-block h-3 w-3 rounded-full border border-gray-300 ${
					isOnSale
						? "bg-emerald-500 shadow-[0_0_4px_1px_rgba(16,185,129,0.8)]"
						: "bg-white"
				}`}
				title={isOnSale ? "Verkauf aktiv" : "Verkauf inaktiv"}
			/>
			{showLabel && (isOnSale ? "Aktiv" : "Inaktiv")}
		</span>
	);
}
