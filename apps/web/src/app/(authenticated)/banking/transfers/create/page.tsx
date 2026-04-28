import { sepaTransfers } from "@qonto/embed-sdk/server/sepa-transfers";
import { redirect } from "next/navigation";
import { QontoConnectCard } from "@/components/my-ui/qonto-connect-card";
import { getAccessToken, isAuthenticated } from "@/lib/auth";
import { getBaseUrl } from "@/lib/utils";

export default async function TransferCreatePage() {
	const authenticated = await isAuthenticated();

	if (!authenticated) {
		return (
			<div className="space-y-8">
				<div>
					<h1 className="font-bold text-3xl text-slate-900">
						Neue Überweisung
					</h1>
				</div>
				<QontoConnectCard />
			</div>
		);
	}

	const accessToken = await getAccessToken();
	const callbackUrl = `${getBaseUrl()}/banking/transfers`;

	const { url } = await sepaTransfers.getSepaTransferCreationFlowLink({
		sepaTransferSettings: { callbackUrl },
		operationSettings: { accessToken },
	});

	redirect(url);
}
