import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import VendorLayout from "@/components/VendorLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
  Loader2,
  Inbox,
  Calendar,
  Users,
  IndianRupee,
  Mail,
  Phone,
} from "lucide-react";

const STATUS_STYLES = {
  Pending:
    "bg-amber-500/15 text-amber-800 border border-amber-500/30",
  Confirmed:
    "bg-emerald-500/15 text-emerald-800 border border-emerald-500/30",
  Cancelled:
    "bg-red-500/15 text-red-800 border border-red-500/30",
  Completed:
    "bg-slate-500/15 text-slate-800 border border-slate-500/30",
};

function formatDate(date) {
  if (!date) return "Date TBC";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Date TBC";
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function VendorRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState(null);

  const loadRequests = async () => {
    setLoading(true);

    try {
      const data = await base44.entities.Booking.list(
        "-created_date",
        100
      );

      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      toast({
        title: "Couldn't load requests",
        description:
          err?.message || "Something went wrong while loading requests.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const respond = async (id, status) => {
    setActingOn(id);

    try {
      await base44.entities.Booking.update(id, {
        status,
      });

      setRequests((current) =>
        current.map((request) =>
          request.id === id
            ? { ...request, status }
            : request
        )
      );

      toast({
        title:
          status === "Confirmed"
            ? "Request accepted"
            : "Request declined",
      });
    } catch (err) {
      toast({
        title: "Couldn't update request",
        description:
          err?.message || "Something went wrong while updating the request.",
        variant: "destructive",
      });
    } finally {
      setActingOn(null);
    }
  };

  return (
    <VendorLayout active="Requests">
      <div className="min-h-screen bg-[#F3E7D3] text-[#292525]">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#7A2348]/10">
              <Inbox
                className="h-5 w-5 text-[#7A2348]"
                aria-hidden="true"
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-[#7A2348]">
                Requests
              </h1>

              <p className="text-sm text-[#6F6265]">
                Booking requests planners have sent to your listing.
              </p>
            </div>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-7 w-7 animate-spin text-[#7A2348]" />
            </div>
          ) : requests.length === 0 ? (
            /* Empty state */
            <Card className="border-[#E8C7CF] bg-[#F3E7D3] p-10 text-center shadow-none">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E8C7CF]/45">
                <Inbox className="h-6 w-6 text-[#7A2348]" />
              </div>

              <h2 className="mt-4 text-base font-bold text-[#292525]">
                No requests yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-[#6F6265]">
                New booking requests will appear here as soon as a planner
                or customer sends one to your listing.
              </p>
            </Card>
          ) : (
            /* Requests */
            <div className="space-y-4">
              {requests.map((request) => {
                const statusStyle =
                  STATUS_STYLES[request.status] ||
                  "bg-[#E8C7CF]/35 text-[#7A2348] border border-[#E8C7CF]";

                const isActing = actingOn === request.id;

                return (
                  <Card
                    key={request.id}
                    className="border-[#E8C7CF] bg-[#F3E7D3] p-5 shadow-none"
                  >
                    {/* Request heading */}
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-[#292525]">
                            {request.event_type || "Event request"}
                          </p>

                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle}`}
                          >
                            {request.status || "Pending"}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-[#6F6265]">
                          {request.client_name || "Client"}
                        </p>
                      </div>

                      {request.status === "Pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isActing}
                            onClick={() =>
                              respond(request.id, "Cancelled")
                            }
                            className="border-[#7A2348]/20 bg-[#F3E7D3] text-[#7A2348] hover:bg-[#E8C7CF]/45"
                          >
                            Decline
                          </Button>

                          <Button
                            size="sm"
                            disabled={isActing}
                            onClick={() =>
                              respond(request.id, "Confirmed")
                            }
                            className="bg-[#7A2348] text-white hover:bg-[#5A1835]"
                          >
                            {isActing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Accept"
                            )}
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Request details */}
                    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                      <div className="flex items-center gap-2 text-[#6F6265]">
                        <Calendar className="h-4 w-4 shrink-0 text-[#7A2348]" />
                        {formatDate(request.event_date)}
                      </div>

                      {request.guest_count ? (
                        <div className="flex items-center gap-2 text-[#6F6265]">
                          <Users className="h-4 w-4 shrink-0 text-[#7A2348]" />
                          {request.guest_count} guests
                        </div>
                      ) : null}

                      {request.budget ? (
                        <div className="flex items-center gap-2 text-[#6F6265]">
                          <IndianRupee className="h-4 w-4 shrink-0 text-[#7A2348]" />
                          ₹
                          {Number(request.budget).toLocaleString(
                            "en-IN"
                          )}{" "}
                          budget
                        </div>
                      ) : null}

                      {request.client_email ? (
                        <div className="flex items-center gap-2 break-all text-[#6F6265]">
                          <Mail className="h-4 w-4 shrink-0 text-[#7A2348]" />
                          {request.client_email}
                        </div>
                      ) : null}

                      {request.client_phone ? (
                        <div className="flex items-center gap-2 text-[#6F6265]">
                          <Phone className="h-4 w-4 shrink-0 text-[#7A2348]" />
                          {request.client_phone}
                        </div>
                      ) : null}
                    </div>

                    {/* Notes */}
                    {request.notes ? (
                      <div className="mt-4 rounded-xl border border-[#E8C7CF] bg-[#E8C7CF]/25 p-3">
                        <p className="text-sm text-[#292525]">
                          {request.notes}
                        </p>
                      </div>
                    ) : null}

                    {/* Commission */}
                    {request.status === "Confirmed" ? (
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#7A2348]/15 bg-[#E8C7CF]/30 p-3 text-xs font-medium text-[#7A2348]">
                        <span>
                          Platform Commission (8%):{" "}
                          <strong>
                            ₹
                            {(
                              request.commission_amount ||
                              parseFloat(request.budget || 0) * 0.08
                            ).toLocaleString("en-IN")}
                          </strong>
                        </span>

                        <span className="rounded-full border border-[#7A2348]/15 bg-[#E8C7CF]/45 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#7A2348]">
                          Commission:{" "}
                          {request.commission_status || "pending"}
                        </span>
                      </div>
                    ) : null}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </VendorLayout>
  );
}
