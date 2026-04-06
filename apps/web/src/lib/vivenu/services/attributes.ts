import { AppError } from "@/lib/errors";
import type { VivenuClient } from "@/lib/vivenu/client";

type VivenuAttributeDoc = {
	_id: string;
	slug: string;
	name: string;
	resourceTypes: string[];
	type: string;
	options?: string[];
};

type VivenuAttributesResponse = {
	docs: VivenuAttributeDoc[];
	total?: number;
};

const VIVENU_ORGANIZER_ATTRIBUTE_SLUG = "organizerid";

export class VivenuAttributesService {
	constructor(private readonly client: VivenuClient) {}

	async ensureOrganizerAttributeOption(organizerId: string): Promise<void> {
		const normalizedOrganizerId = organizerId.trim();
		if (!normalizedOrganizerId) {
			throw new AppError("Organizer ID must not be empty", 400);
		}

		const response =
			await this.client.apiGet<VivenuAttributesResponse>("/attributes");

		if (!Array.isArray(response?.docs)) {
			throw new AppError(
				"Vivenu attributes response is malformed: missing docs array",
				500,
			);
		}

		const organizerAttribute = response.docs.find(
			(attribute) => attribute.slug === VIVENU_ORGANIZER_ATTRIBUTE_SLUG,
		);

		if (!organizerAttribute) {
			await this.client.apiPost("/attributes", {
				slug: VIVENU_ORGANIZER_ATTRIBUTE_SLUG,
				name: VIVENU_ORGANIZER_ATTRIBUTE_SLUG,
				resourceTypes: ["event"],
				type: "select",
				options: [normalizedOrganizerId],
			});
			return;
		}

		const existingOptions = Array.isArray(organizerAttribute.options)
			? organizerAttribute.options
			: [];

		if (existingOptions.includes(normalizedOrganizerId)) {
			return;
		}

		await this.client.apiPut(`/attributes/${organizerAttribute._id}`, {
			slug: organizerAttribute.slug,
			name: organizerAttribute.name,
			resourceTypes: organizerAttribute.resourceTypes,
			type: organizerAttribute.type,
			options: [...existingOptions, normalizedOrganizerId],
		});
	}
}
