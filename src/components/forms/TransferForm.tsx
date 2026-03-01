"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createTransfer, verifyTransferPayee } from "@/actions/transfers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { QontoSepaBeneficiary } from "@/types/beneficiaries";
import type { QontoBankAccount } from "@/types/organization";

interface TransferFormProps {
	beneficiaries: QontoSepaBeneficiary[];
	bankAccounts?: QontoBankAccount[];
	onCancel?: () => void;
	onSuccess?: () => void;
}

interface VOPState {
	proofToken: string | null;
	matchResult: string | null;
	matchedName: string | null;
	isVerifying: boolean;
	error: string | null;
}

interface FormData {
	beneficiary_id: string;
	amount_in_cents: number;
	label: string;
	reference: string;
	bank_account_id?: string;
}

export function TransferForm({
	beneficiaries,
	bankAccounts,
	onCancel,
	onSuccess,
}: Readonly<TransferFormProps>) {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [vopState, setVopState] = useState<VOPState>({
		proofToken: null,
		matchResult: null,
		matchedName: null,
		isVerifying: false,
		error: null,
	});
	const [formData, setFormData] = useState<FormData>({
		beneficiary_id: "",
		amount_in_cents: 0,
		label: "",
		reference: "",
		bank_account_id: undefined,
	});

	const handleChange = async (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
		>,
	) => {
		const { name, value } = e.target;

		if (name === "amount_in_cents") {
			setFormData((prev) => ({
				...prev,
				[name]: Math.round(Number.parseFloat(value) * 100) || 0,
			}));
		} else if (name === "beneficiary_id") {
			setFormData((prev) => ({
				...prev,
				[name]: value,
			}));

			// Verify payee when beneficiary is selected
			if (value) {
				const beneficiary = beneficiaries.find((b) => b.id === value);
				if (beneficiary?.iban) {
					setVopState({
						proofToken: null,
						matchResult: null,
						matchedName: null,
						isVerifying: true,
						error: null,
					});

					const result = await verifyTransferPayee(
						beneficiary.iban,
						beneficiary.name,
					);

					if (result.success && result.data) {
						setVopState((prev) => ({
							...prev,
							proofToken: result.data.proof_token.token,
							matchResult: result.data.match_result,
							matchedName: result.data.matched_name || null,
							isVerifying: false,
						}));
					} else {
						setVopState({
							proofToken: null,
							matchResult: null,
							matchedName: null,
							isVerifying: false,
							error: result.error ?? null,
						});
						toast.error(`Verification failed: ${result.error}`);
					}
				}
			} else {
				setVopState({
					proofToken: null,
					matchResult: null,
					matchedName: null,
					isVerifying: false,
					error: null,
				});
			}
		} else {
			setFormData((prev) => ({
				...prev,
				[name]: value,
			}));
		}
	};

	const getVOPDisplayClassName = (type: string): string => {
		switch (type) {
			case "success":
				return "bg-green-50 text-green-800";
			case "warning":
				return "bg-amber-50 text-amber-800";
			case "error":
				return "bg-red-50 text-red-800";
			default:
				return "";
		}
	};

	const getVOPDisplayMessage = (): {
		message: string;
		type: "success" | "warning" | "error";
	} | null => {
		if (!vopState.matchResult) return null;

		switch (vopState.matchResult) {
			case "MATCH_RESULT_MATCH":
				return {
					message: "IBAN stimmt mit dem Namen des Zahlungsempfängers überein.",
					type: "success",
				};
			case "MATCH_RESULT_CLOSE_MATCH":
				return {
					message: `Der eingegebene Empfängername stimmt nur nahezu mit dem hinterlegten Namen überein. Vorschlag: ${vopState.matchedName}`,
					type: "warning",
				};
			case "MATCH_RESULT_NO_MATCH":
				return {
					message:
						"Der eingegebene Empfängername stimmt nicht mit dem hinterlegten Namen überein.",
					type: "error",
				};
			case "MATCH_RESULT_NOT_POSSIBLE":
				return {
					message:
						"Es ist nicht möglich zu überprüfen, ob die IBAN mit dem Namen des Zahlungsempfängers übereinstimmt",
					type: "warning",
				};
			default:
				return null;
		}
	};

	const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!formData.beneficiary_id) {
			toast.error("Bitte wählen Sie einen Zahlungsempfänger aus");
			return;
		}

		if (!formData.bank_account_id) {
			toast.error("Bitte wählen Sie ein Quellkonto aus");
			return;
		}

		if (!vopState.proofToken) {
			toast.error("Überprüfung des Zahlungsempfängers erforderlich");
			return;
		}

		setIsLoading(true);

		try {
			const result = await createTransfer({
				beneficiary_id: formData.beneficiary_id,
				amount_in_cents: formData.amount_in_cents,
				label: formData.label,
				reference: formData.reference || undefined,
				vop_proof_token: vopState.proofToken,
				bank_account_id: formData.bank_account_id,
			});

			if (result.success) {
				toast.success("Transfer created successfully!");
				onSuccess?.();
				router.push("/transfers");
			} else {
				toast.error(`Failed to create transfer: ${result.error}`);
			}
		} catch (error) {
			toast.error("Ein unerwarteter Fehler ist aufgetreten");
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	const vopDisplay = getVOPDisplayMessage();
	const isSubmitDisabled =
		isLoading ||
		beneficiaries.length === 0 ||
		!(bankAccounts && bankAccounts.length > 0) ||
		!formData.bank_account_id ||
		!vopState.proofToken ||
		vopState.isVerifying;

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div>
				<Label htmlFor="bank_account_id">Von Konto</Label>
				<select
					id="bank_account_id"
					name="bank_account_id"
					required
					value={formData.bank_account_id ?? ""}
					onChange={handleChange}
					disabled={isLoading || !(bankAccounts && bankAccounts.length > 0)}
					className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 focus:border-slate-950 focus:outline-none focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
				>
					<option value="">
						{bankAccounts && bankAccounts.length > 0
							? "Konto auswählen"
							: "Keine Konten verfügbar"}
					</option>
					{bankAccounts?.map((acct) => (
						<option key={acct.id} value={acct.id}>
							{acct.name || acct.iban || acct.id}
						</option>
					))}
				</select>

				<div className="mt-4">
					<Label htmlFor="beneficiary_id">Zahlungsempfänger</Label>
					<select
						id="beneficiary_id"
						name="beneficiary_id"
						required
						value={formData.beneficiary_id}
						onChange={handleChange}
						disabled={isLoading || beneficiaries.length === 0}
						className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 focus:border-slate-950 focus:outline-none focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
					>
						<option value="">
							{beneficiaries.length === 0
								? "Keine Empfänger verfügbar"
								: "Empfänger auswählen"}
						</option>
						{beneficiaries.map((beneficiary) => (
							<option key={beneficiary.id} value={beneficiary.id}>
								{beneficiary.name} ({beneficiary.iban})
							</option>
						))}
					</select>

					{vopState.isVerifying && (
						<p className="mt-2 text-slate-600 text-sm">
							Empfängerüberprüfung...
						</p>
					)}

					{vopDisplay && (
						<div
							className={`mt-2 rounded-md p-3 text-sm ${getVOPDisplayClassName(vopDisplay.type)}`}
						>
							{vopDisplay.message}
						</div>
					)}
				</div>
			</div>

			<div>
				<Label htmlFor="amount_in_cents">Betrag (EUR)</Label>
				<Input
					id="amount_in_cents"
					name="amount_in_cents"
					type="number"
					step="0.01"
					required
					value={formData.amount_in_cents / 100}
					onChange={handleChange}
					placeholder="0.00"
					disabled={isLoading}
				/>
			</div>

			<div>
				<Label htmlFor="label">Beschreibung</Label>
				<Input
					id="label"
					name="label"
					type="text"
					required
					value={formData.label}
					onChange={handleChange}
					placeholder="Beschreibung der Überweisung"
					disabled={isLoading}
				/>
			</div>

			<div>
				<Label htmlFor="reference">Verwendungszweck (optional)</Label>
				<Input
					id="reference"
					name="reference"
					type="text"
					value={formData.reference}
					onChange={handleChange}
					placeholder="z.B. Rechnung #12345"
					disabled={isLoading}
				/>
			</div>

			<div className="flex gap-4">
				<Button type="submit" disabled={isSubmitDisabled}>
					{isLoading ? "Wird erstellt..." : "Überweisung erstellen"}
				</Button>
				<Button
					type="button"
					variant="outline"
					onClick={() => (onCancel ? onCancel() : router.back())}
					disabled={isLoading}
				>
					Abbrechen
				</Button>
			</div>
		</form>
	);
}
