import Link from "next/link";
import { BookingActions } from "@/components/marketplace/ServiceBookingClient";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Card, EmptyState, type BadgeTone } from "@/components/ui/card";
import { createDb } from "@/lib/db/server";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/server/auth/session";
import { listBookingsForUser } from "@/server/repositories/services";

export const metadata = { title: "Bookings" };

const STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  pending: { label: "Waiting for the provider", tone: "warning" },
  confirmed: { label: "Confirmed", tone: "brand" },
  in_progress: { label: "In progress", tone: "info" },
  completed: { label: "Completed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

export default async function DashboardBookingsPage() {
  const user = await requireUser("/dashboard/bookings");
  const bookings = await listBookingsForUser(await createDb(), user.userId);

  return (
    <>
      <div>
        <h1 className="text-[28px] leading-tight font-bold text-ink md:text-[32px]">Bookings</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Services you have booked, and bookings clients have made with you.
        </p>
      </div>

      {bookings.length === 0 ? (
        <EmptyState title="No bookings yet" action={<ButtonLink href="/services">Find a service</ButtonLink>}>
          When you book a service, or a client books yours, it appears here.
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {bookings.map((booking) => {
            const iAmProvider = booking.providerId === user.userId;
            const other = iAmProvider ? booking.client : booking.provider;
            const status = STATUS[booking.status] ?? { label: booking.status, tone: "neutral" as BadgeTone };
            return (
              <li key={booking.id}>
                <Card className="flex flex-col gap-3 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-muted">
                        {booking.bookingNumber} · {iAmProvider ? "Client" : "Provider"}:{" "}
                        {other?.displayName ?? "A member"}
                      </p>
                      <p className="text-base font-semibold text-ink">
                        {booking.service ? (
                          <Link href={`/services/${booking.service.slug}`} className="hover:text-primary-700">
                            {booking.service.title}
                          </Link>
                        ) : (
                          "Service no longer listed"
                        )}
                      </p>
                    </div>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </div>
                  <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-ink-soft">
                    <span className="text-base font-bold text-ink">
                      {formatMoney(booking.amountMinor, booking.currency)}
                    </span>
                    <span>{booking.packageName}</span>
                    {booking.scheduledDate ? (
                      <span>
                        {new Date(booking.scheduledDate).toLocaleString("en-GB", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    ) : null}
                  </p>
                  {booking.deliverablesNote ? (
                    <p className="text-sm whitespace-pre-line text-ink-soft">{booking.deliverablesNote}</p>
                  ) : null}
                  <BookingActions
                    bookingId={booking.id}
                    status={booking.status}
                    role={iAmProvider ? "provider" : "client"}
                  />
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
