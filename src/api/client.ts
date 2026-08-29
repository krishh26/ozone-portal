import { API_BASE_URL } from "../config/env";
import { ApiError, apiFetch, getAuthToken, setAuthToken } from "../lib/api";
import { resolveMediaUrl } from "../lib/mediaUrl";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export async function loginApi(email: string, password: string): Promise<User> {
  const response = await apiFetch<
    ApiEnvelope<{ token: string; user: { id?: string; _id?: string; name: string; email: string; role: string } }>
  >("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  setAuthToken(response.data.token);
  const user = response.data.user;
  return {
    id: user.id ?? user._id ?? "",
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export async function meApi(): Promise<User> {
  const response = await apiFetch<
    ApiEnvelope<{ id?: string; _id?: string; name: string; email: string; role: string }>
  >("/auth/me");
  const user = response.data;
  return {
    id: user.id ?? user._id ?? "",
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export async function logoutApi(): Promise<void> {
  try {
    await apiFetch("/auth/logout", { method: "POST" });
  } finally {
    setAuthToken(null);
  }
}

export type InquiryStatus = "new" | "read" | "contacted" | "closed";
export type InquiryType = "inquiry" | "appointment";

export interface Inquiry {
  id: string;
  type: InquiryType;
  name: string;
  email: string;
  phone: string;
  service: string;
  preferredDate: string;
  time: string;
  doctorName: string;
  message: string;
  source: string;
  status: InquiryStatus;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface ListResponse<T> {
  success: boolean;
  data: T[];
  pagination: Pagination;
}

export async function listInquiries(params: {
  page?: number;
  q?: string;
  status?: string;
  type?: string;
}): Promise<{ items: Inquiry[]; total: number; pages: number; page: number }> {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("limit", "20");
  if (params.q) query.set("q", params.q);
  if (params.status) query.set("status", params.status);
  if (params.type) query.set("type", params.type);

  const response = await apiFetch<ListResponse<Inquiry>>(`/contact?${query.toString()}`);
  return {
    items: response.data,
    total: response.pagination?.total ?? response.data.length,
    pages: response.pagination?.pages ?? 1,
    page: response.pagination?.page ?? 1,
  };
}

export async function updateInquiryStatus(id: string, status: InquiryStatus): Promise<Inquiry> {
  const response = await apiFetch<ApiEnvelope<Inquiry>>(`/contact/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return response.data;
}

export type AppointmentStatus = "pending" | "confirmed" | "cancelled";

export interface Appointment {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  serviceId: string;
  serviceName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  source: string;
  status: AppointmentStatus;
  createdAt: string;
}

export async function listAppointments(params: {
  page?: number;
  q?: string;
  status?: string;
  date?: string;
}): Promise<{ items: Appointment[]; total: number; pages: number; page: number }> {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("limit", "20");
  if (params.q) query.set("q", params.q);
  if (params.status) query.set("status", params.status);
  if (params.date) query.set("date", params.date);

  const response = await apiFetch<ListResponse<Appointment>>(
    `/appointments?${query.toString()}`,
  );
  return {
    items: response.data,
    total: response.pagination?.total ?? response.data.length,
    pages: response.pagination?.pages ?? 1,
    page: response.pagination?.page ?? 1,
  };
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<Appointment> {
  const response = await apiFetch<ApiEnvelope<Appointment>>(`/appointments/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return response.data;
}

export async function deleteAppointment(id: string): Promise<void> {
  await apiFetch(`/appointments/${id}`, { method: "DELETE" });
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  excerpt: string;
  thumbnail: string;
  tags: string[];
  content: string;
  published: boolean;
}

export async function listBlogPosts(): Promise<BlogPost[]> {
  const response = await apiFetch<ApiEnvelope<BlogPost[]>>("/blog/admin");
  return response.data;
}

export async function getBlogPost(id: string): Promise<BlogPost> {
  const response = await apiFetch<ApiEnvelope<BlogPost>>(`/blog/admin/${id}`);
  return response.data;
}

export async function createBlogPost(payload: Partial<Omit<BlogPost, "tags">> & { tags?: string | string[] }): Promise<BlogPost> {
  const response = await apiFetch<ApiEnvelope<BlogPost>>("/blog/admin", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function updateBlogPost(
  id: string,
  payload: Partial<Omit<BlogPost, "tags">> & { tags?: string | string[] },
): Promise<BlogPost> {
  const response = await apiFetch<ApiEnvelope<BlogPost>>(`/blog/admin/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function deleteBlogPost(id: string): Promise<void> {
  await apiFetch(`/blog/admin/${id}`, { method: "DELETE" });
}

export async function uploadBlogImage(file: File): Promise<string> {
  return uploadImageFile(file, "/blog/admin/upload");
}

export async function uploadGalleryImage(file: File): Promise<string> {
  return uploadImageFile(file, "/gallery/admin/upload");
}

async function uploadImageFile(file: File, path: string): Promise<string> {
  const token = getAuthToken();
  const body = new FormData();
  body.append("image", file);

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body,
  });

  if (!res.ok) {
    let message = res.statusText || "Upload failed";
    try {
      const payload = (await res.json()) as {
        message?: string;
        error?: string | { message?: string };
      };
      if (typeof payload.error === "object" && payload.error?.message) {
        message = payload.error.message;
      } else if (payload.message) {
        message = payload.message;
      }
    } catch {
      // ignore
    }
    throw new ApiError(res.status, message);
  }

  const payload = (await res.json()) as ApiEnvelope<{ url: string }>;
  return resolveMediaUrl(payload.data.url);
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  image: string;
  order: number;
  published: boolean;
}

export async function listGallery(): Promise<GalleryItem[]> {
  const response = await apiFetch<ApiEnvelope<GalleryItem[]>>("/gallery/admin");
  return response.data;
}

export async function createGalleryItem(payload: {
  title: string;
  category: string;
  image: string;
  published?: boolean;
}): Promise<GalleryItem> {
  const response = await apiFetch<ApiEnvelope<GalleryItem>>("/gallery/admin", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function updateGalleryItem(
  id: string,
  payload: Partial<Pick<GalleryItem, "title" | "category" | "image" | "published" | "order">>,
): Promise<GalleryItem> {
  const response = await apiFetch<ApiEnvelope<GalleryItem>>(`/gallery/admin/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function deleteGalleryItem(id: string): Promise<void> {
  await apiFetch(`/gallery/admin/${id}`, { method: "DELETE" });
}

export type ServiceCategory = "skin" | "laser" | "hair" | "body";

export interface ClinicService {
  id: string;
  slug: string;
  name: string;
  category: ServiceCategory;
  icon: string;
  shortDesc: string;
  fullDesc: string;
  howItWorks: string;
  benefits: string[];
  sessions: string;
  recovery: string;
  duration: string;
  startingPrice: string;
  image: string;
  detailSections: unknown[];
  order: number;
  published: boolean;
}

export async function listClinicServices(): Promise<ClinicService[]> {
  const response = await apiFetch<ApiEnvelope<ClinicService[]>>("/services/admin");
  return response.data;
}

export async function getClinicService(id: string): Promise<ClinicService> {
  const response = await apiFetch<ApiEnvelope<ClinicService>>(`/services/admin/${id}`);
  return response.data;
}

export async function createClinicService(
  payload: Partial<Omit<ClinicService, "benefits" | "detailSections">> & {
    benefits?: string | string[];
    detailSections?: unknown;
  },
): Promise<ClinicService> {
  const response = await apiFetch<ApiEnvelope<ClinicService>>("/services/admin", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function updateClinicService(
  id: string,
  payload: Partial<Omit<ClinicService, "benefits" | "detailSections">> & {
    benefits?: string | string[];
    detailSections?: unknown;
  },
): Promise<ClinicService> {
  const response = await apiFetch<ApiEnvelope<ClinicService>>(`/services/admin/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function deleteClinicService(id: string): Promise<void> {
  await apiFetch(`/services/admin/${id}`, { method: "DELETE" });
}

export async function uploadServiceImage(file: File): Promise<string> {
  return uploadImageFile(file, "/services/admin/upload");
}
