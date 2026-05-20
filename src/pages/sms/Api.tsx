// ~/e-football/src/pages/sms/Api.tsx

export interface SMSSerializedPayload {
  phone: string;
  message: string;
}

export const transmitLiveSMS = async ({
  phone,
  message,
}: SMSSerializedPayload) => {
  const EDGE_FUNCTION_URL =
    "https://bkmdutrvxugyrwthmtjb.supabase.co/functions/v1/send-sms";

  const ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

  if (!ANON_KEY) {
    throw new Error("REACT_APP_SUPABASE_ANON_KEY is not defined.");
  }

const response = await fetch(EDGE_FUNCTION_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${ANON_KEY}`,
    apikey: ANON_KEY,
  },
  body: JSON.stringify({ phone, message }),
});

const text = await response.text();

console.log("Status:", response.status);
console.log("Response:", text);

if (!response.ok) {
  throw new Error(text);
}

return JSON.parse(text);
};