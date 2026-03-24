"use server";

import { revalidatePath } from "next/cache";
import { OrganizersService } from "@/lib/dynamodb/services/organizers";
import { AppError } from "@/lib/errors";
import {
	type CreateOrganizerInput,
	CreateOrganizerInputSchema,
	OrganizerIdSchema,
	type UpdateOrganizerInput,
} from "@/types/organizers";

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

export async function createOrganizer(input: CreateOrganizerInput) {
	try {
		const parsed = CreateOrganizerInputSchema.parse(input);
		OrganizerIdSchema.parse(parsed.organizerid);

		const created = await organizersService.createOrganizer(parsed);
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
		OrganizerIdSchema.parse(input.organizerid);
		const updated = await organizersService.updateOrganizer(input);
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
