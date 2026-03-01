import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-slate-50">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Abrechnungsportal</CardTitle>
					<CardDescription>für zünftick</CardDescription>
				</CardHeader>
				<CardContent>
					<Button asChild className="w-full" size="lg">
						<a href="/api/auth/login">Anmelden mit Qonto</a>
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
