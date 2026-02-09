import db from "@/lib/db";

/* ======================================================
   GET DISTRICTS (LIST)
====================================================== */
interface GetDistrictsParams {
  search?: string;
  page?: number;
  limit?: number;
  stateId?: string;
}

export async function getDistricts({
  search = "",
  page = 1,
  limit = 10,
  stateId,
}: GetDistrictsParams) {
  try {
    const where: any = {};

    if (stateId) {
      where.stateId = stateId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }

    const [districts, total] = await Promise.all([
      db.district.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          state: { select: { id: true, name: true } },
        },
      }),
      db.district.count({ where }),
    ]);

    return {
      districts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("getDistricts service error:", error);
    throw error;
  }
}

/* ======================================================
   CREATE DISTRICT
====================================================== */
interface CreateDistrictInput {
  code: string;
  name: string;
  stateId: string;
}

export async function createDistrict(data: CreateDistrictInput) {
  try {
    const stateExists = await db.state.findUnique({
      where: { id: data.stateId },
    });

    if (!stateExists) throw new Error("STATE_NOT_FOUND");

    const codeExists = await db.district.findUnique({
      where: { code: data.code },
    });

    if (codeExists) throw new Error("DISTRICT_CODE_EXISTS");

    const nameExists = await db.district.findFirst({
      where: { name: data.name, stateId: data.stateId },
    });

    if (nameExists) throw new Error("DISTRICT_NAME_EXISTS_IN_STATE");

    return await db.district.create({ data });
  } catch (error) {
    console.error("createDistrict service error:", error);
    throw error;
  }
}

/* ======================================================
   GET DISTRICT BY ID
====================================================== */
export async function getDistrictById(id: string) {
  try {
    const district = await db.district.findUnique({
      where: { id },
      include: {
        state: { select: { id: true, name: true } },
      },
    });

    if (!district) {
      throw new Error("DISTRICT_NOT_FOUND");
    }

    return district;
  } catch (error) {
    console.error("getDistrictById service error:", error);
    throw error;
  }
}

/* ======================================================
   UPDATE DISTRICT
====================================================== */
interface UpdateDistrictInput {
  code?: string;
  name?: string;
  stateId?: string;
  isActive?: boolean;
}

export async function updateDistrictById(
  id: string,
  data: UpdateDistrictInput,
) {
  try {
    const existing = await db.district.findUnique({ where: { id } });
    if (!existing) throw new Error("DISTRICT_NOT_FOUND");

    if (data.stateId) {
      const stateExists = await db.state.findUnique({
        where: { id: data.stateId },
      });
      if (!stateExists) throw new Error("STATE_NOT_FOUND");
    }

    if (data.code && data.code !== existing.code) {
      const codeExists = await db.district.findUnique({
        where: { code: data.code },
      });
      if (codeExists) throw new Error("DISTRICT_CODE_EXISTS");
    }

    if (data.name) {
      const nameExists = await db.district.findFirst({
        where: {
          name: data.name,
          stateId: data.stateId ?? existing.stateId,
          NOT: { id },
        },
      });
      if (nameExists) throw new Error("DISTRICT_NAME_EXISTS_IN_STATE");
    }

    return await db.district.update({
      where: { id },
      data,
    });
  } catch (error) {
    console.error("updateDistrictById service error:", error);
    throw error;
  }
}

/* ======================================================
   DELETE DISTRICT 
====================================================== */
export async function deleteDistrictById(id: string) {
  try {
    const existing = await db.district.findUnique({
      where: { id },
      include: {
        ulbs: { select: { id: true } },
      },
    });

    if (!existing) throw new Error("DISTRICT_NOT_FOUND");

    if (existing.ulbs.length > 0) {
      throw new Error("DISTRICT_HAS_ULBS");
    }

    await db.district.delete({
      where: { id },
    });
  } catch (error) {
    console.error("deleteDistrictById service error:", error);
    throw error;
  }
}
