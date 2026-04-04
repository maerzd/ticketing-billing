import {
	type OrganizerBillingAddress,
	OrganizerBillingAddressSchema,
	type OrganizerContactPerson,
	OrganizerContactPersonSchema,
} from "@ticketing-billing/types/ddb";
import {
	SevdeskContactCreateSchema,
	SevdeskCreateContactAddressResponseSchema,
	SevdeskCreateContactResponseSchema,
	SevdeskInputRefSchema,
} from "@ticketing-billing/types/sevdesk";
import { z } from "zod";
import env from "@/env";
import { AppError } from "@/lib/errors";
import type { SevdeskClient } from "@/lib/sevdesk/client";

export const CreateOrganizerContactInputSchema = z
	.object({
		name: z.string().min(1).optional(),
		firstName: z.string().min(1).optional(),
		lastName: z.string().min(1).optional(),
		vatNumber: z.string().min(1).optional(),
		taxIdentificationNumber: z.string().min(1).optional(),
		iban: z.string().min(1).optional(),
		bic: z.string().min(1).optional(),
		billingAddress: OrganizerBillingAddressSchema,
		contactPersons: z.array(OrganizerContactPersonSchema).optional(),
	})
	.refine(
		(value) =>
			Boolean(value.name?.trim()) ||
			(Boolean(value.firstName?.trim()) && Boolean(value.lastName?.trim())) ||
			(Boolean(value.billingAddress.firstName?.trim()) &&
				Boolean(value.billingAddress.lastName?.trim())),
		{
			message:
				"Sevdesk contact requires either a company name or first/last name",
		},
	);

interface CreateOrganizerContactInput {
	name?: string;
	firstName?: string;
	lastName?: string;
	vatNumber?: string;
	taxIdentificationNumber?: string;
	iban?: string;
	bic?: string;
	billingAddress: OrganizerBillingAddress;
	contactPersons?: OrganizerContactPerson[];
}

interface UpsertOrganizerContactResult {
	contactId: string;
	contactAddressId: string;
}

const SevdeskEmbeddedContactAddressSchema = z.object({
	id: z.string(),
	contact: SevdeskInputRefSchema.or(SevdeskInputRefSchema.partial()).optional(),
});

const SevdeskContactWithAddressesResponseSchema = z.object({
	objects: z.object({
		id: z.string(),
		addresses: z
			.union([
				z.array(SevdeskEmbeddedContactAddressSchema),
				SevdeskEmbeddedContactAddressSchema,
				z.null(),
			])
			.optional()
			.transform((value) => {
				if (!value) {
					return [];
				}

				return Array.isArray(value) ? value : [value];
			}),
	}),
});

export class SevdeskContactsService {
	constructor(private readonly client: SevdeskClient) { }

	private toNumericId(id: string, label: string) {
		const numeric = Number.parseInt(id, 10);
		if (!Number.isFinite(numeric)) {
			throw new AppError(`Invalid sevdesk ${label} id returned: ${id}`, 500);
		}

		return numeric;
	}

	private categoryRef() {
		return SevdeskInputRefSchema.parse({
			id: env.SEVDESK_CONTACT_CATEGORY_ID,
			objectName: "Category",
		});
	}

	private addressCategoryRef() {
		return SevdeskInputRefSchema.parse({
			id: env.SEVDESK_CONTACT_ADDRESS_CATEGORY_ID,
			objectName: "Category",
		});
	}

	private countryRef() {
		return SevdeskInputRefSchema.parse({
			id: env.SEVDESK_COUNTRY_ID,
			objectName: "StaticCountry",
		});
	}

	private async findAddressByContactId(sevdeskContactId: string) {
		const contactWithAddresses = await this.client
			.get(
				`/Contact/${sevdeskContactId}`,
				SevdeskContactWithAddressesResponseSchema,
				{ embed: "addresses" },
			)
			.then((response) => response.objects)
			.catch(() => null);

		if (contactWithAddresses) {
			const embeddedMatch = contactWithAddresses.addresses.find((address) => {
				const embeddedContactId =
					typeof address.contact?.id === "number"
						? String(address.contact.id)
						: address.contact?.id;

				return !embeddedContactId || embeddedContactId === sevdeskContactId;
			});

			if (embeddedMatch) {
				return embeddedMatch;
			}
		}

		return null;
	}

	async createOrganizerWithContacts(
		input: CreateOrganizerContactInput,
	): Promise<UpsertOrganizerContactResult> {
		const parsedInput = CreateOrganizerContactInputSchema.parse(input);

		const companyName =
			parsedInput.name?.trim() ||
			`${parsedInput.firstName ?? parsedInput.billingAddress.firstName} ${parsedInput.lastName ?? parsedInput.billingAddress.lastName}`.trim();

		const companyPayload = SevdeskContactCreateSchema.parse({
			name: companyName,
			category: this.categoryRef(),
			status: 1000,
			vatNumber: parsedInput.vatNumber,
			taxNumber: parsedInput.taxIdentificationNumber,
			bankAccount: parsedInput.iban,
			bankNumber: parsedInput.bic,
		});

		const company = await this.client
			.post("/Contact", SevdeskCreateContactResponseSchema, companyPayload)
			.then((response) => response.objects);

		const contactRef = SevdeskInputRefSchema.parse({
			id: this.toNumericId(company.id, "contact"),
			objectName: "Contact",
		});

		const address = await this.client.post(
			"/ContactAddress",
			SevdeskCreateContactAddressResponseSchema,
			{
				contact: contactRef,
				country: this.countryRef(),
				category: this.addressCategoryRef(),
				street: parsedInput.billingAddress.street,
				zip: parsedInput.billingAddress.zipCode,
				city: parsedInput.billingAddress.city,
				name: companyName,
			},
		).then((response) => response.objects);

		for (const person of parsedInput.contactPersons ?? []) {
			const personPayload = SevdeskContactCreateSchema.parse({
				surename: person.firstName,
				familyname: person.lastName,
				category: this.categoryRef(),
				status: 1000,
				parent: contactRef,
				description: [
					person.email ? `Email: ${person.email}` : null,
					person.phone ? `Phone: ${person.phone}` : null,
				]
					.filter(Boolean)
					.join(" | "),
			});

			await this.client.post(
				"/Contact",
				SevdeskCreateContactResponseSchema,
				personPayload,
			);
		}

		return {
			contactId: company.id,
			contactAddressId: address.id,
		};
	}

	async updateOrganizerContact(
		sevdeskContactId: string,
		input: CreateOrganizerContactInput,
	): Promise<UpsertOrganizerContactResult> {
		const parsedInput = CreateOrganizerContactInputSchema.parse(input);

		const companyName =
			parsedInput.name?.trim() ||
			`${parsedInput.firstName ?? parsedInput.billingAddress.firstName} ${parsedInput.lastName ?? parsedInput.billingAddress.lastName}`.trim();

		const companyPayload = SevdeskContactCreateSchema.parse({
			name: companyName,
			category: this.categoryRef(),
			status: 1000,
			vatNumber: parsedInput.vatNumber,
			taxNumber: parsedInput.taxIdentificationNumber,
			bankAccount: parsedInput.iban,
			bankNumber: parsedInput.bic,
		});

		const contact = await this.client
			.put(
				`/Contact/${sevdeskContactId}`,
				SevdeskCreateContactResponseSchema,
				companyPayload,
			)
			.then((response) => response.objects);

		const contactRef = SevdeskInputRefSchema.parse({
			id: this.toNumericId(sevdeskContactId, "contact"),
			objectName: "Contact",
		});

		let addressId = (
			await this.findAddressByContactId(sevdeskContactId)
		)?.id;

		if (addressId) {
			await this.client.put(
				`/ContactAddress/${addressId}`,
				SevdeskCreateContactAddressResponseSchema,
				{
					contact: contactRef,
					country: this.countryRef(),
					category: this.addressCategoryRef(),
					street: parsedInput.billingAddress.street,
					zip: parsedInput.billingAddress.zipCode,
					city: parsedInput.billingAddress.city,
					name: companyName,
				},
			);
		} else {
			const createdAddress = await this.client.post(
				"/ContactAddress",
				SevdeskCreateContactAddressResponseSchema,
				{
					contact: contactRef,
					country: this.countryRef(),
					category: this.addressCategoryRef(),
					street: parsedInput.billingAddress.street,
					zip: parsedInput.billingAddress.zipCode,
					city: parsedInput.billingAddress.city,
					name: companyName,
				},
			).then((response) => response.objects);

			addressId = createdAddress.id;
		}

		return {
			contactId: contact.id,
			contactAddressId: addressId,
		};
	}
}
