/**
 * Direct Supabase Cloud Helper (Fallback Engine when Laptop/Ngrok is offline)
 * Allows Vercel / Next.js server components and API routes to query Supabase directly 24/7.
 */

const SUPABASE_API_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_API_URL ||
  "https://pitbddduxxntkhawzxrr.supabase.co";

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpdGJkZGR1eHhudGtoYXd6eHJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjAzMTgyMywiZXhwIjoyMDk3NjA3ODIzfQ.3GVskVCDS5fBR2L0rr8RPwB_kzpl7YY37SC3sop1sdA";

const getHeaders = () => ({
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
});

export async function fetchCertificateFromSupabase(id: string) {
  try {
    const cleanId = id.trim();
    // Query certificates by certId or id
    const url = `${SUPABASE_API_URL}/rest/v1/certificates?or=(certId.eq.${cleanId},id.eq.${cleanId})&select=*,course:courses(id,title,certificateTemplate,user:users(id,name,nip,majority,studyProgram))&limit=1`;
    
    const res = await fetch(url, {
      headers: getHeaders(),
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`[Supabase Direct] Certificate fetch failed: ${res.status}`);
      return null;
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const item = data[0];

    // Fetch course competency units if available
    let competencyUnits = item.competencyUnits;
    if ((!competencyUnits || !Array.isArray(competencyUnits) || competencyUnits.length === 0) && item.courseId) {
      try {
        const unitsUrl = `${SUPABASE_API_URL}/rest/v1/course_competency_units?courseId.eq.${item.courseId}&order=order.asc`;
        const unitsRes = await fetch(unitsUrl, { headers: getHeaders(), cache: "no-store" });
        if (unitsRes.ok) {
          const unitsData = await unitsRes.json();
          if (Array.isArray(unitsData) && unitsData.length > 0) {
            competencyUnits = unitsData.map((u: any) => ({
              code: u.code,
              title: u.title,
              standard: u.standard || "SKKNI",
              result: "KOMPETEN",
            }));
          }
        }
      } catch (e) {}
    }

    return {
      certId: item.certId || item.id,
      studentId: item.studentId,
      name: item.studentName || item.name,
      majority: item.majority,
      program: item.program,
      cid: item.cid || "",
      hash: item.hash,
      status: item.status || "ISSUED",
      issuedAt: item.issuedAt,
      courseId: item.courseId,
      courseName: item.course?.title || undefined,
      course: item.course,
      certificateNumber: item.certificateNumber || undefined,
      schoolName: item.schoolName || undefined,
      signers: item.signers || undefined,
      competencyUnits: competencyUnits || undefined,
      layoutMode: item.layoutMode || "STANDARD",
      blockchainSyncStatus: item.blockchainSyncStatus || "SYNCED",
      blockchainTxId: item.blockchainTxId || undefined,
      source: "mirror_database" as const,
      isChainVerified: item.blockchainSyncStatus === "SYNCED",
    };
  } catch (err: any) {
    console.error("[Supabase Direct Error]:", err.message);
    return null;
  }
}

export async function fetchCoursesFromSupabase() {
  try {
    const url = `${SUPABASE_API_URL}/rest/v1/courses?select=*,user:users(id,name)&order=createdAt.desc`;
    const res = await fetch(url, { headers: getHeaders(), cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch (err: any) {
    console.error("[Supabase Direct Courses Error]:", err.message);
    return [];
  }
}

export async function findUserByIdentifier(identifier: string) {
  try {
    const clean = encodeURIComponent(identifier.trim());
    const url = `${SUPABASE_API_URL}/rest/v1/users?or=(email.eq.${clean},studentId.eq.${clean},nip.eq.${clean},personalEmail.eq.${clean})&limit=1`;
    const res = await fetch(url, { headers: getHeaders(), cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    return data[0];
  } catch (err: any) {
    console.error("[Supabase User Lookup Error]:", err.message);
    return null;
  }
}

export async function findUserById(id: string) {
  try {
    const clean = encodeURIComponent(id.trim());
    const url = `${SUPABASE_API_URL}/rest/v1/users?id=eq.${clean}&limit=1`;
    const res = await fetch(url, { headers: getHeaders(), cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    return data[0];
  } catch (err: any) {
    console.error("[Supabase Find User Error]:", err.message);
    return null;
  }
}

export async function updateUserSession(userId: string, currentSessionId: string) {
  try {
    const url = `${SUPABASE_API_URL}/rest/v1/users?id=eq.${encodeURIComponent(userId)}`;
    await fetch(url, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({
        currentSessionId,
        updatedAt: new Date().toISOString(),
      }),
    });
  } catch (e) {}
}

export async function createSupabaseUser(userPayload: any) {
  try {
    const url = `${SUPABASE_API_URL}/rest/v1/users`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...getHeaders(),
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        ...userPayload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || "Registration failed on cloud database");
    }
    const created = await res.json();
    return Array.isArray(created) ? created[0] : created;
  } catch (err: any) {
    console.error("[Supabase Create User Error]:", err.message);
    throw err;
  }
}

export async function fetchStudentCertificatesFromSupabase(studentIdOrUserId: string) {
  try {
    const clean = encodeURIComponent(studentIdOrUserId.trim());
    const url = `${SUPABASE_API_URL}/rest/v1/certificates?or=(studentId.eq.${clean},userId.eq.${clean})&select=*,course:courses(id,title)&order=issuedAt.desc`;
    const res = await fetch(url, { headers: getHeaders(), cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch (err: any) {
    console.error("[Supabase Student Certificates Error]:", err.message);
    return [];
  }
}

export async function fetchTeacherCoursesFromSupabase(teacherId: string) {
  try {
    const clean = encodeURIComponent(teacherId.trim());
    const url = `${SUPABASE_API_URL}/rest/v1/courses?userId=eq.${clean}&select=*&order=createdAt.desc`;
    const res = await fetch(url, { headers: getHeaders(), cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch (err: any) {
    console.error("[Supabase Teacher Courses Error]:", err.message);
    return [];
  }
}

export async function getSystemSettingsMap(): Promise<Record<string, string>> {
  try {
    const url = `${SUPABASE_API_URL}/rest/v1/system_settings?select=*`;
    const res = await fetch(url, { headers: getHeaders(), cache: "no-store" });
    if (!res.ok) return {};
    const list = await res.json();
    const map: Record<string, string> = {};
    if (Array.isArray(list)) {
      list.forEach((item: any) => {
        if (item.key) map[item.key] = item.value;
      });
    }
    return map;
  } catch (err: any) {
    console.error("[Supabase System Settings Error]:", err.message);
    return {};
  }
}

export async function upsertSystemSetting(key: string, value: string) {
  try {
    const url = `${SUPABASE_API_URL}/rest/v1/system_settings`;
    await fetch(url, {
      method: "POST",
      headers: {
        ...getHeaders(),
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({ key, value }),
    });
  } catch (e) {}
}

export async function deleteSystemSetting(key: string) {
  try {
    const url = `${SUPABASE_API_URL}/rest/v1/system_settings?key=eq.${encodeURIComponent(key)}`;
    await fetch(url, {
      method: "DELETE",
      headers: getHeaders(),
    });
  } catch (e) {}
}

export async function insertCertificateToSupabase(certRecord: any) {
  try {
    const url = `${SUPABASE_API_URL}/rest/v1/certificates`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...getHeaders(),
        Prefer: "return=representation",
      },
      body: JSON.stringify(certRecord),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || "Failed to insert certificate into database");
    }
    const data = await res.json();
    return Array.isArray(data) ? data[0] : data;
  } catch (err: any) {
    console.error("[Supabase Insert Certificate Error]:", err.message);
    throw err;
  }
}

export async function fetchCourseUnitsFromSupabase(courseId: string) {
  try {
    const url = `${SUPABASE_API_URL}/rest/v1/course_competency_units?courseId.eq.${encodeURIComponent(courseId)}&order=order.asc`;
    const res = await fetch(url, { headers: getHeaders(), cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch (err: any) {
    return [];
  }
}

export async function fetchCourseByIdFromSupabase(courseId: string) {
  try {
    const url = `${SUPABASE_API_URL}/rest/v1/courses?id=eq.${encodeURIComponent(courseId)}&select=*,user:users(id,name,nip,studyProgram,majority)&limit=1`;
    const res = await fetch(url, { headers: getHeaders(), cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch (err: any) {
    return null;
  }
}

export async function updateCourseInSupabase(courseId: string, updates: any) {
  try {
    const url = `${SUPABASE_API_URL}/rest/v1/courses?id=eq.${encodeURIComponent(courseId)}`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: { ...getHeaders(), Prefer: "return=representation" },
      body: JSON.stringify({ ...updates, updatedAt: new Date().toISOString() }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data[0] : data;
  } catch (err: any) {
    return null;
  }
}

export async function deleteCourseInSupabase(courseId: string) {
  try {
    const url = `${SUPABASE_API_URL}/rest/v1/courses?id=eq.${encodeURIComponent(courseId)}`;
    await fetch(url, { method: "DELETE", headers: getHeaders() });
    return true;
  } catch (err: any) {
    return false;
  }
}

export async function fetchCourseStudentsFromSupabase(courseId: string) {
  try {
    const url = `${SUPABASE_API_URL}/rest/v1/enrollments?courseId.eq.${encodeURIComponent(courseId)}&select=*,user:users(id,name,email,studentId,majority,studyProgram,avatar)`;
    const res = await fetch(url, { headers: getHeaders(), cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    return [];
  }
}

export async function saveCompetencyUnitsInSupabase(courseId: string, units: any[]) {
  try {
    // Delete existing
    const delUrl = `${SUPABASE_API_URL}/rest/v1/course_competency_units?courseId.eq.${encodeURIComponent(courseId)}`;
    await fetch(delUrl, { method: "DELETE", headers: getHeaders() });

    if (units.length === 0) return [];

    const insertPayload = units.map((u, index) => ({
      id: u.id || crypto.randomUUID(),
      courseId,
      code: u.code,
      title: u.title,
      standard: u.standard || "SKKNI",
      order: u.order !== undefined ? u.order : index,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    const insUrl = `${SUPABASE_API_URL}/rest/v1/course_competency_units`;
    const res = await fetch(insUrl, {
      method: "POST",
      headers: { ...getHeaders(), Prefer: "return=representation" },
      body: JSON.stringify(insertPayload),
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (err: any) {
    return [];
  }
}

export async function updateUserStatusInSupabase(userId: string, updates: any) {
  try {
    const url = `${SUPABASE_API_URL}/rest/v1/users?id=eq.${encodeURIComponent(userId)}`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: { ...getHeaders(), Prefer: "return=representation" },
      body: JSON.stringify({ ...updates, updatedAt: new Date().toISOString() }),
    });
    return res.ok;
  } catch (err: any) {
    return false;
  }
}

export async function deleteUserInSupabase(userId: string) {
  try {
    const url = `${SUPABASE_API_URL}/rest/v1/users?id=eq.${encodeURIComponent(userId)}`;
    const res = await fetch(url, { method: "DELETE", headers: getHeaders() });
    return res.ok;
  } catch (err: any) {
    return false;
  }
}

export async function fetchCorrectionRequestsFromSupabase(status?: string) {
  try {
    let url = `${SUPABASE_API_URL}/rest/v1/certificate_correction_requests?select=*,certificate:certificates(certId,studentName,studentId,course:courses(title))&order=createdAt.desc`;
    if (status) {
      url += `&status=eq.${encodeURIComponent(status)}`;
    }
    const res = await fetch(url, { headers: getHeaders(), cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch (err: any) {
    return [];
  }
}

export async function insertCorrectionRequestInSupabase(payload: any) {
  try {
    const url = `${SUPABASE_API_URL}/rest/v1/certificate_correction_requests`;
    const res = await fetch(url, {
      method: "POST",
      headers: { ...getHeaders(), Prefer: "return=representation" },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        ...payload,
        status: "PENDING",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    });
    if (!res.ok) throw new Error("Failed to submit correction request");
    return await res.json();
  } catch (err: any) {
    throw err;
  }
}

export async function fetchUsersByRoleFromSupabase(role?: string, search?: string) {
  try {
    let url = `${SUPABASE_API_URL}/rest/v1/users?select=id,name,email,role,studentId,nip,faculty,majority,studyProgram,avatar,isVerified,isApproved,isActive,createdAt&order=name.asc`;
    if (role) {
      url += `&role=eq.${encodeURIComponent(role)}`;
    }
    const res = await fetch(url, { headers: getHeaders(), cache: "no-store" });
    if (!res.ok) return [];
    let data = await res.json();
    if (search && Array.isArray(data)) {
      const q = search.toLowerCase();
      data = data.filter((u: any) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.studentId?.toLowerCase().includes(q) ||
        u.nip?.toLowerCase().includes(q)
      );
    }
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    return [];
  }
}
