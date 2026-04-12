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

export const CreateOrganizerContactInputSchema = z.object({
	name: z.string().min(1),
	vatNumber: z.string().min(1).optional(),
	taxIdentificationNumber: z.string().min(1).optional(),
	iban: z.string().min(1).optional(),
	bic: z.string().min(1).optional(),
	billingAddress: OrganizerBillingAddressSchema,
	contactPersons: z.array(OrganizerContactPersonSchema).optional(),
});

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

export class SevdeskContactsService {
	constructor(private readonly client: SevdeskClient) {}

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

	async createOrganizerWithContacts(
		input: CreateOrganizerContactInput,
	): Promise<UpsertOrganizerContactResult> {
		const parsedInput = CreateOrganizerContactInputSchema.parse(input);

		const companyPayload = SevdeskContactCreateSchema.parse({
			name: parsedInput.name,
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
			id: company.id,
			objectName: "Contact",
		});

		const address = await this.client
			.post("/ContactAddress", SevdeskCreateContactAddressResponseSchema, {
				contact: contactRef,
				country: this.countryRef(),
				category: this.addressCategoryRef(),
				street: parsedInput.billingAddress.street,
				zip: parsedInput.billingAddress.zipCode,
				city: parsedInput.billingAddress.city,
				// name: parsedInput.ContactPersons[0].firstName ... Here we could potentially use the firstName and lastName of the contact person ("z. Hd.")
			})
			.then((response) => response.objects);

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

		const companyPayload = SevdeskContactCreateSchema.parse({
			name: parsedInput.name,
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
			id: sevdeskContactId,
			objectName: "Contact",
		});

		let addressId = await this.client
			.get(
				`/Contact/${sevdeskContactId}`,
				z.object({
					objects: z.array(
						z.object({
							addresses: z
								.array(z.object({ id: z.coerce.string() }))
								.optional()
								.default([]),
						}),
					),
				}),
				{ embed: "addresses" },
			)
			.then((response) => response.objects[0]?.addresses[0]?.id ?? null);

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
				},
			);
		} else {
			const createdAddress = await this.client
				.post("/ContactAddress", SevdeskCreateContactAddressResponseSchema, {
					contact: contactRef,
					country: this.countryRef(),
					category: this.addressCategoryRef(),
					street: parsedInput.billingAddress.street,
					zip: parsedInput.billingAddress.zipCode,
					city: parsedInput.billingAddress.city,
				})
				.then((response) => response.objects);

			addressId = createdAddress.id;
		}

		const person = parsedInput.contactPersons?.[0];

		const existingChildContactId = await this.client
			.get(
				"/Contact",
				z.object({
					objects: z.array(z.object({ id: z.coerce.string() })),
				}),
				{
					"parent[id]": this.toNumericId(sevdeskContactId, "contact"),
					"parent[objectName]": "Contact",
					limit: 1,
				},
			)
			.then((response) => response.objects[0]?.id ?? null);

		if (person) {
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

			if (existingChildContactId) {
				await this.client.put(
					`/Contact/${existingChildContactId}`,
					SevdeskCreateContactResponseSchema,
					personPayload,
				);
			} else {
				await this.client.post(
					"/Contact",
					SevdeskCreateContactResponseSchema,
					personPayload,
				);
			}
		}

		return {
			contactId: contact.id,
			contactAddressId: addressId,
		};
	}
}
