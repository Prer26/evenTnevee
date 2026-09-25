// Self-hosted replacement for the Base44 SDK client.
//
// Same exposed shape (base44.auth.*, base44.entities.X.*,
// base44.integrations.Core.InvokeLLM) as before, so pages don't need to
// change — but every call now hits our own free, self-hosted server
// instead of Base44's paid platform.

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const TOKEN_KEY = "eventneve_token";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request(
  path,
  { method = "GET", body, auth = true } = {}
) {
  const headers = {
    "Content-Type": "application/json",
  };

  const token = getToken();

  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res;

  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new Error(
      `Failed to connect to backend server (${API_URL}). Please ensure the backend server is running.`
    );
  }

  let data = null;

  try {
    data = await res.json();
  } catch {
    // no JSON body
  }

  if (!res.ok) {
    const error = new Error(
      data?.message || `Request failed (${res.status})`
    );

    error.status = res.status;
    error.code = data?.code;

    throw error;
  }

  return data;
}

// Same-origin base (API_URL minus the trailing /api)
// Uploaded files are served from here, not under /api.
const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

// The server returns a relative path like "/uploads/abc.jpg"
// or an absolute S3/CDN URL like "https://...".
function resolveUploadUrl(url) {
  if (!url) return "";

  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  return `${API_ORIGIN}${url}`;
}

// Separate from request() because file uploads use multipart/form-data.
async function requestUpload(path, formData) {
  const headers = {};

  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });

  let data = null;

  try {
    data = await res.json();
  } catch {
    // no JSON body
  }

  if (!res.ok) {
    const error = new Error(
      data?.message || `Upload failed (${res.status})`
    );

    error.status = res.status;

    throw error;
  }

  return data;
}

function makeEntity(resource) {
  return {
    list: (sort, limit) => {
      const params = new URLSearchParams();

      if (sort) {
        params.set("sort", sort);
      }

      if (limit) {
        params.set("limit", limit);
      }

      const qs = params.toString();

      return request(
        `/${resource}${qs ? `?${qs}` : ""}`
      );
    },

    get: (id) =>
      request(`/${resource}/${id}`),

    create: (data) =>
      request(`/${resource}`, {
        method: "POST",
        body: data,
      }),

    update: (id, data) =>
      request(`/${resource}/${id}`, {
        method: "PATCH",
        body: data,
      }),
  };
}

export const base44 = {
  // ============================================================
  // AUTH
  // ============================================================

  auth: {
    async me() {
      return request("/auth/me");
    },

    setToken(token) {
      setToken(token);
    },

    getToken,

    async logout() {
      setToken(null);
      window.location.href = "/login";
    },

    redirectToLogin(returnUrl) {
      const target =
        returnUrl || window.location.pathname;

      window.location.href =
        `/login?redirect=${encodeURIComponent(target)}`;
    },

    async loginViaEmailPassword(email, password) {
      const data = await request("/auth/login", {
        method: "POST",
        body: {
          email,
          password,
        },
        auth: false,
      });

      setToken(data.access_token);

      return data;
    },

    async loginWithProvider() {
      throw new Error(
        "Social login isn't configured on the self-hosted backend yet. Please use email/password."
      );
    },

    async register({
      email,
      password,
      full_name,
      account_type,
    }) {
      return request("/auth/register", {
        method: "POST",
        body: {
          email,
          password,
          full_name,
          account_type,
        },
        auth: false,
      });
    },

    async verifyOtp({
      email,
      otpCode,
    }) {
      const data = await request(
        "/auth/verify-otp",
        {
          method: "POST",
          body: {
            email,
            otpCode,
          },
          auth: false,
        }
      );

      setToken(data.access_token);

      return data;
    },

    async resendOtp(email) {
      return request(
        "/auth/resend-otp",
        {
          method: "POST",
          body: {
            email,
          },
          auth: false,
        }
      );
    },

    async resetPasswordRequest(email) {
      return request(
        "/auth/reset-password-request",
        {
          method: "POST",
          body: {
            email,
          },
          auth: false,
        }
      );
    },

    async resetPassword({
      resetToken,
      newPassword,
    }) {
      return request(
        "/auth/reset-password",
        {
          method: "POST",
          body: {
            resetToken,
            newPassword,
          },
          auth: false,
        }
      );
    },
  },

  // ============================================================
  // ENTITIES
  // ============================================================

  entities: {
    Vendor: makeEntity("vendors"),

    Booking: makeEntity("bookings"),

    Inquiry: makeEntity("inquiries"),

    Transaction: makeEntity("transactions"),

    // Company profile CRUD
    CompanyProfile: makeEntity("company-profiles"),
  },

  // ============================================================
  // REVIEWS
  // ============================================================

  reviews: {
    async create({
      booking_id,
      rating,
      comment,
    }) {
      return request("/reviews", {
        method: "POST",
        body: {
          booking_id,
          rating,
          comment,
        },
      });
    },

    async getForVendor(vendorId) {
      return request(
        `/reviews/vendor/${vendorId}`
      );
    },
  },

  // ============================================================
  // VENDOR PROFILE
  // ============================================================

  vendorProfile: {
    async get() {
      return request("/vendors/me");
    },

    async create(data) {
      return request("/vendors/me", {
        method: "POST",
        body: data,
      });
    },

    async update(data) {
      return request("/vendors/me", {
        method: "PUT",
        body: data,
      });
    },

    async setAvailability(is_available) {
      return request(
        "/vendors/me/availability",
        {
          method: "PATCH",
          body: {
            is_available,
          },
        }
      );
    },

    async updateBlockedDates(blocked_dates) {
      return request(
        "/vendors/me/blocked-dates",
        {
          method: "PATCH",
          body: {
            blocked_dates,
          },
        }
      );
    },

    async getBlockedDates(vendorId) {
      return request(
        `/vendors/${vendorId}/blocked-dates`
      );
    },

    async getContact(vendorId) {
      return request(
        `/vendors/${vendorId}/contact`
      );
    },

    async uploadPhoto(file) {
      const formData = new FormData();

      formData.append("photo", file);

      const { url } = await requestUpload(
        "/uploads/photo",
        formData
      );

      return resolveUploadUrl(url);
    },
  },

  // ============================================================
  // AI
  // ============================================================

  integrations: {
    Core: {
      async InvokeLLM({
        prompt,
        response_json_schema,
      }) {
        return request("/ai/invoke", {
          method: "POST",
          body: {
            prompt,
            response_json_schema,
          },
          auth: false,
        });
      },
    },
  },

  // ============================================================
  // PAYMENTS
  // ============================================================

  payments: {
    async getKey() {
      return request(
        "/payments/key",
        {
          auth: false,
        }
      );
    },

    async createOrder({
      amount,
      plan_id,
      booking_id,
      transaction_id,
      vendor_name,
      notes,
    } = {}) {
      return request(
        "/payments/create-order",
        {
          method: "POST",
          body: {
            amount,
            plan_id,
            booking_id,
            transaction_id,
            vendor_name,
            notes,
          },
        }
      );
    },

    async verify(payload) {
      return request(
        "/payments/verify",
        {
          method: "POST",
          body: payload,
        }
      );
    },
  },

  // ============================================================
  // MESSAGES
  // ============================================================

  messages: {
    async send({
      vendor_id,
      vendor_name,
      body,
    }) {
      return request("/messages", {
        method: "POST",
        body: {
          vendor_id,
          vendor_name,
          body,
        },
      });
    },

    async reply({
      vendor_id,
      vendor_name,
      user_id,
      body,
    }) {
      return request("/messages/reply", {
        method: "POST",
        body: {
          vendor_id,
          vendor_name,
          user_id,
          body,
        },
      });
    },

    async threads() {
      return request(
        "/messages/threads"
      );
    },

    async thread(vendorId, userId) {
      const params = new URLSearchParams({
        vendor_id: vendorId,
      });

      if (userId) {
        params.set("user_id", userId);
      }

      return request(
        `/messages/thread?${params.toString()}`
      );
    },
  },

  // ============================================================
  // SUBSCRIPTION
  // ============================================================

  subscription: {
    async getPlans() {
      return request(
        "/subscription/plans",
        {
          auth: false,
        }
      );
    },

    async getMySubscription() {
      return request(
        "/subscription/me"
      );
    },

    async createOrder(plan_id) {
      return request(
        "/payments/create-order",
        {
          method: "POST",
          body: {
            plan_id,
          },
        }
      );
    },

    async verifyPayment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan_id,
    }) {
      return request(
        "/payments/verify",
        {
          method: "POST",
          body: {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            plan_id,
          },
        }
      );
    },
  },
};