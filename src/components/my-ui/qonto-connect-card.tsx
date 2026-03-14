import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function QontoConnectCard() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Qonto Verbindung erforderlich</CardTitle>
			</CardHeader>
			<CardContent>
				<Button render={<Link href="/api/qonto/auth/login" />}>
					Mit Qonto anmelden
				</Button>
			</CardContent>
		</Card>
	);
}
