import { ArrowRightCircle } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
	return (
		<div className="flex flex-col items-center space-y-4">
			<h1 className="text-2xl">Zefix!</h1>
			<p>Wir haben überall gesucht aber konnten die Seite nicht finden.</p>
			<Link className="flex items-center hover:underline" href="/">
				<p>Hier gehts zurück zur Startseite</p>
				<ArrowRightCircle className="ml-2 h-6 w-6" />
			</Link>
		</div>
	);
}
