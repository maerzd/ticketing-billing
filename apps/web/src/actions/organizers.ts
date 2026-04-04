"use server";
import {
	type CreateOrganizerInput,
	CreateOrganizerInputSchema,
	OrganizerIdSchema,
	type OrganizerRecord,
	type UpdateOrganizerInput,
} from "@ticketing-billing/types/ddb";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAccessToken } from "@/lib/auth";
import { OrganizersService } from "@/lib/dynamodb/services/organizers";
import { AppError } from "@/lib/errors";
import { QontoClient } from "@/lib/qonto/client";
import { BeneficiariesService } from "@/lib/qonto/services/beneficiaries";
import { SevdeskClient } from "@/lib/sevdesk/client";
import { SevdeskContactsService } from "@/lib/sevdesk/services/contacts";

const revalidateOrganizers = () => {
	revalidatePath("/organizers");
};

const getErrorMessage = (error: unknown, fallback: string) => {
	if (error instanceof AppError) {
		return error.message;
	}

	return error instanceof Error ? error.message : fallback;
};

const organizersService = new OrganizersService();

const toQontoBeneficiaryInput = (input: {
	sepaBeneficiaryName: string;
	iban: string;
	bic: string;
	email: string;
}) => ({
	name: input.sepaBeneficiaryName,
	iban: input.iban,
	bic: input.bic,
	email: input.email,
});

const QontoBeneficiaryCreateInputSchema = z.object({
	sepaBeneficiaryName: z.string().min(1),
	iban: z.string().min(1),
	bic: z.string().min(1),
	email: z.email(),
});

const enrichCreatePersistenceError = (
	error: unknown,
	ids: {
		beneficiaryId?: string;
		sevdeskContactId?: string;
	},
): never => {
	const message = getErrorMessage(error, "Failed to create organizer");
	const sideEffects: string[] = [];

	if (ids.sevdeskContactId) {
		sideEffects.push(`Sevdesk contact was created (${ids.sevdeskContactId})`);
	}

	if (ids.beneficiaryId) {
		sideEffects.push(`Qonto beneficiary was created (${ids.beneficiaryId})`);
	}

	const prefix =
		sideEffects.length > 0
			? `${sideEffects.join(" and ")} but organizer persistence failed`
			: "Organizer persistence failed";

	if (error instanceof AppError) {
		throw new AppError(`${prefix}: ${message}`, error.statusCode);
	}

	throw new AppError(`${prefix}: ${message}`, 500);
};

const enrichExternalCreationError = (
	error: unknown,
	context: {
		failedStep: "Qonto beneficiary" | "Sevdesk contact";
		beneficiaryId?: string;
		sevdeskContactId?: string;
	},
): never => {
	const message = getErrorMessage(
		error,
		`${context.failedStep} creation failed`,
	);
	const sideEffects: string[] = [];

	if (context.sevdeskContactId) {
		sideEffects.push(
			`Sevdesk contact was created (${context.sevdeskContactId})`,
		);
	}

	if (context.beneficiaryId) {
		sideEffects.push(
			`Qonto beneficiary was created (${context.beneficiaryId})`,
		);
	}

	const prefix =
		sideEffects.length > 0
			? `${context.failedStep} creation failed after side effects: ${sideEffects.join(" and ")}`
			: `${context.failedStep} creation failed`;

	if (error instanceof AppError) {
		throw new AppError(`${prefix}: ${message}`, error.statusCode);
	}

	throw new AppError(`${prefix}: ${message}`, 500);
};

export async function createOrganizer(input: CreateOrganizerInput) {
	try {
		const parsed = CreateOrganizerInputSchema.parse(input);
		OrganizerIdSchema.parse(parsed.organizerId);

		const existing = await organizersService.getOrganizer(parsed.organizerId);
		if (existing) {
			throw new AppError(
				"An organizer with this organizer ID already exists",
				409,
			);
		}

		const accessToken = await getAccessToken();
		const qontoClient = new QontoClient({ accessToken });
		const beneficiariesService = new BeneficiariesService(qontoClient);
		const sevdeskClient = new SevdeskClient();
		const sevdeskContactsService = new SevdeskContactsService(sevdeskClient);

		const hasAnySepaField =
			parsed.sepaBeneficiaryName || parsed.iban || parsed.bic;

		const beneficiary = parsed.qontoBeneficiaryId
			? { id: parsed.qontoBeneficiaryId }
			: hasAnySepaField
				? await (async () => {
					const qontoInput = QontoBeneficiaryCreateInputSchema.safeParse({
						sepaBeneficiaryName: parsed.sepaBeneficiaryName,
						iban: parsed.iban,
						bic: parsed.bic,
						email: parsed.email,
					});
					if (!qontoInput.success) {
						throw new AppError(
							qontoInput.error.issues[0]?.message ??
							"To create a Qonto beneficiary, provide SEPA Begünstigter, IBAN and BIC.",
							400,
						);
					}
					return beneficiariesService
						.createBeneficiary(toQontoBeneficiaryInput(qontoInput.data))
						.catch((error) =>
							enrichExternalCreationError(error, {
								failedStep: "Qonto beneficiary",
							}),
						);
				})()
				: undefined;

		const sevdeskContact = parsed.sevdeskContactId
			? {
				contactId: parsed.sevdeskContactId,
			}
			: await sevdeskContactsService
				.createOrganizerWithContacts({
					name: parsed.name,
					firstName: parsed.firstName,
					lastName: parsed.lastName,
					vatNumber: parsed.vatNumber,
					taxIdentificationNumber: parsed.taxIdentificationNumber,
					iban: parsed.iban,
					bic: parsed.bic,
					billingAddress: parsed.billingAddress,
					contactPersons: parsed.contactPersons,
				})
				.catch((error) =>
					enrichExternalCreationError(error, {
						failedStep: "Sevdesk contact",
						beneficiaryId: beneficiary?.id,
					}),
				);

		const created: OrganizerRecord = await organizersService
			.createOrganizer({
				...parsed,
				sevdeskContactId: sevdeskContact?.contactId,
				qontoBeneficiaryId: beneficiary?.id,
			})
			.catch((error) =>
				enrichCreatePersistenceError(error, {
					sevdeskContactId: sevdeskContact?.contactId,
					beneficiaryId: beneficiary?.id,
				}),
			);

		revalidateOrganizers();

		return {
			success: true,
			data: created,
		} as const;
	} catch (error) {
		const message = getErrorMessage(error, "Failed to create organizer");
		console.error("Create organizer error:", message);

		return {
			success: false,
			error: message,
		} as const;
	}
}

export async function updateOrganizer(input: UpdateOrganizerInput) {
	try {
		OrganizerIdSchema.parse(input.organizerId);

		const existing = await organizersService.getOrganizer(input.organizerId);
		if (!existing) {
			throw new AppError("Veranstalter not found", 404);
		}

		const accessToken = await getAccessToken();
		const qontoClient = new QontoClient({ accessToken });
		const beneficiariesService = new BeneficiariesService(qontoClient);
		const sevdeskClient = new SevdeskClient();
		const sevdeskContactsService = new SevdeskContactsService(sevdeskClient);

		// Qonto: IBAN/BIC are immutable. Update name/email if beneficiary exists, else create.
		let qontoBeneficiaryId =
			existing.qontoBeneficiaryId ?? input.qontoBeneficiaryId;
		if (qontoBeneficiaryId) {
			// Update mutable fields (name, email) on the existing beneficiary
			await beneficiariesService
				.updateBeneficiary(qontoBeneficiaryId, {
					name: input.sepaBeneficiaryName ?? existing.sepaBeneficiaryName,
					email: input.email ?? existing.email,
				})
				.catch((error) =>
					enrichExternalCreationError(error, {
						failedStep: "Qonto beneficiary",
					}),
				);
		} else {
			const sepaBeneficiaryName =
				input.sepaBeneficiaryName ?? existing.sepaBeneficiaryName;
			const iban = input.iban ?? existing.iban;
			const bic = input.bic ?? existing.bic;
			const email = input.email ?? existing.email;
			const hasAnySepaField = sepaBeneficiaryName || iban || bic;

			if (hasAnySepaField) {
				const qontoInput = QontoBeneficiaryCreateInputSchema.safeParse({
					sepaBeneficiaryName,
					iban,
					bic,
					email,
				});
				if (!qontoInput.success) {
					throw new AppError(
						qontoInput.error.issues[0]?.message ??
						"To create a Qonto beneficiary, provide SEPA Begünstigter, IBAN and BIC.",
						400,
					);
				}
				const beneficiary = await beneficiariesService
					.createBeneficiary(toQontoBeneficiaryInput(qontoInput.data))
					.catch((error) =>
						enrichExternalCreationError(error, {
							failedStep: "Qonto beneficiary",
						}),
					);
				qontoBeneficiaryId = beneficiary.id;
			}
		}

		// Sevdesk: update existing contact or create a new one
		const sevdeskInput = {
			name: input.name ?? existing.name,
			firstName: input.firstName ?? existing.firstName,
			lastName: input.lastName ?? existing.lastName,
			vatNumber: input.vatNumber ?? existing.vatNumber,
			taxIdentificationNumber:
				input.taxIdentificationNumber ?? existing.taxIdentificationNumber,
			iban: input.iban ?? existing.iban,
			bic: input.bic ?? existing.bic,
			billingAddress: input.billingAddress ?? existing.billingAddress,
			contactPersons: input.contactPersons ?? existing.contactPersons,
		};

		const existingSevdeskId =
			existing.sevdeskContactId ?? input.sevdeskContactId;
		const sevdeskContact = existingSevdeskId
			? await sevdeskContactsService
				.updateOrganizerContact(existingSevdeskId, sevdeskInput)
				.catch((error) =>
					enrichExternalCreationError(error, {
						failedStep: "Sevdesk contact",
					}),
				)
			: await sevdeskContactsService
				.createOrganizerWithContacts(sevdeskInput)
				.catch((error) =>
					enrichExternalCreationError(error, {
						failedStep: "Sevdesk contact",
					}),
				);

		const sanitizedInput = Object.fromEntries(
			Object.entries(input).filter(([, value]) => value !== undefined),
		);

		const updated = await organizersService
			.updateOrganizer({
				...sanitizedInput,
				organizerId: input.organizerId,
				qontoBeneficiaryId,
				sevdeskContactId: sevdeskContact.contactId,
			})
			.catch((error) =>
				enrichCreatePersistenceError(error, {
					beneficiaryId:
						!existing.qontoBeneficiaryId && qontoBeneficiaryId
							? qontoBeneficiaryId
							: undefined,
					sevdeskContactId: !existing.sevdeskContactId
						? sevdeskContact.contactId
						: undefined,
				}),
			);

		revalidateOrganizers();

		return {
			success: true,
			data: updated,
		} as const;
	} catch (error) {
		const message = getErrorMessage(error, "Failed to update organizer");
		console.error("Update organizer error:", message);

		return {
			success: false,
			error: message,
		} as const;
	}
}

export async function queryOrganizers() {
	try {
		const organizers = await organizersService.listOrganizers();
		return {
			success: true,
			data: organizers,
		} as const;
	} catch (error) {
		const message = getErrorMessage(error, "Failed to fetch organizers");
		console.error("List organizers error:", message);

		return {
			success: false,
			error: message,
		} as const;
	}
}

export async function getOrganizer(organizerId: string) {
	try {
		const organizer = await organizersService.getOrganizer(organizerId);
		if (!organizer) {
			return { success: false, error: "Veranstalter nicht gefunden" } as const;
		}
		return { success: true, data: organizer } as const;
	} catch (error) {
		const message = getErrorMessage(error, "Failed to fetch organizer");
		console.error("Get organizer error:", message);
		return { success: false, error: message } as const;
	}
}
