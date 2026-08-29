import { useCallback, useEffect, useState } from "react";
import {
  deleteAppointment,
  listAppointments,
  updateAppointmentStatus,
  type Appointment,
  type AppointmentStatus,
} from "../api/client";
import { ConfirmModal } from "../components/ConfirmModal";
import { IconButton } from "../components/IconButton";
import { ChevronLeftIcon, ChevronRightIcon, EyeIcon, TrashIcon, XIcon } from "../components/icons";
import { ApiError } from "../lib/api";

const STATUS_OPTIONS: AppointmentStatus[] = ["pending", "confirmed", "cancelled"];

function statusClass(status: AppointmentStatus) {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-900";
    case "confirmed":
      return "bg-emerald-100 text-emerald-900";
    default:
      return "bg-slate-200 text-slate-700";
  }
}

export function AppointmentsPage() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Appointment | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await listAppointments({
        page,
        q: query.trim() || undefined,
        status: status || undefined,
        date: date || undefined,
      });
      setItems(result.items);
      setPages(result.pages);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load appointments.");
    } finally {
      setLoading(false);
    }
  }, [page, query, status, date]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load();
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [load]);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setError("");
    try {
      await deleteAppointment(pendingDelete.id);
      const wasLastOnPage = items.length === 1 && page > 1;
      setItems((current) => current.filter((item) => item.id !== pendingDelete.id));
      setTotal((current) => Math.max(0, current - 1));
      setSelected((current) => (current?.id === pendingDelete.id ? null : current));
      setPendingDelete(null);
      if (wasLastOnPage) setPage((current) => Math.max(1, current - 1));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete appointment.");
    } finally {
      setDeleting(false);
    }
  }

  async function changeStatus(row: Appointment, next: AppointmentStatus) {
    try {
      const updated = await updateAppointmentStatus(row.id, next);
      setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setSelected((current) => (current?.id === updated.id ? updated : current));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update status.");
    }
  }

  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        Live bookings from the website appointment page. Confirming or cancelling updates slot availability.
      </p>
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_160px_180px]">
        <input
          className="rounded-lg border border-slate-200 bg-white px-3 py-2"
          placeholder="Search name, phone, service, doctor…"
          value={query}
          onChange={(e) => {
            setPage(1);
            setQuery(e.target.value);
          }}
        />
        <select
          className="rounded-lg border border-slate-200 bg-white px-3 py-2"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <input
          type="date"
          className="rounded-lg border border-slate-200 bg-white px-3 py-2"
          value={date}
          onChange={(e) => {
            setPage(1);
            setDate(e.target.value);
          }}
        />
      </div>

      {error ? (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Patient</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Doctor</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={8}>
                    Loading appointments…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={8}>
                    No appointments yet. Book one from the clinic website.
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr
                    key={row.id}
                    className="cursor-pointer border-t border-slate-100 hover:bg-amber-50/40"
                    onClick={() => setSelected(row)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">{row.date}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{row.time}</td>
                    <td className="px-4 py-3 font-medium">{row.name}</td>
                    <td className="px-4 py-3">
                      <a className="text-amber-800" href={`tel:${row.phone}`}>
                        {row.phone}
                      </a>
                    </td>
                    <td className="px-4 py-3">{row.serviceName || "—"}</td>
                    <td className="px-4 py-3">{row.doctorName || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center justify-end">
                        <IconButton
                          icon={<EyeIcon />}
                          label="View details"
                          onClick={() => setSelected(row)}
                        />
                        <IconButton
                          variant="danger"
                          icon={<TrashIcon />}
                          label="Delete"
                          onClick={() => setPendingDelete(row)}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
          <span>{total} total</span>
          <div className="flex items-center gap-2">
            <IconButton
              variant="outline"
              icon={<ChevronLeftIcon />}
              label="Previous"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            />
            <span>
              {page} / {pages}
            </span>
            <IconButton
              variant="outline"
              icon={<ChevronRightIcon />}
              label="Next"
              disabled={page >= pages}
              onClick={() => setPage((current) => current + 1)}
            />
          </div>
        </div>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4" onClick={() => setSelected(null)}>
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">{selected.name}</h2>
                <p className="text-sm text-slate-500">
                  {selected.date} · {selected.time}
                </p>
              </div>
              <IconButton icon={<XIcon />} label="Close" onClick={() => setSelected(null)} />
            </div>
            <dl className="mt-4 grid gap-3 text-sm">
              <div>
                <dt className="text-slate-500">Phone</dt>
                <dd>
                  <a className="text-amber-800" href={`tel:${selected.phone}`}>
                    {selected.phone}
                  </a>
                </dd>
              </div>
              {selected.email ? (
                <div>
                  <dt className="text-slate-500">Email</dt>
                  <dd>
                    <a className="text-amber-800" href={`mailto:${selected.email}`}>
                      {selected.email}
                    </a>
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-slate-500">Service</dt>
                <dd>{selected.serviceName || "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Doctor</dt>
                <dd>{selected.doctorName || "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Notes</dt>
                <dd className="whitespace-pre-wrap">{selected.notes || "—"}</dd>
              </div>
            </dl>
            <label className="mt-5 block text-sm font-medium text-slate-700">
              Status
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={selected.status}
                onChange={(e) => void changeStatus(selected, e.target.value as AppointmentStatus)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      ) : null}

      {pendingDelete ? (
        <ConfirmModal
          title="Delete appointment"
          description={`Delete the booking for ${pendingDelete.name} on ${pendingDelete.date} at ${pendingDelete.time}? This frees the slot.`}
          loading={deleting}
          onConfirm={() => void confirmDelete()}
          onCancel={() => {
            if (!deleting) setPendingDelete(null);
          }}
        />
      ) : null}
    </div>
  );
}
