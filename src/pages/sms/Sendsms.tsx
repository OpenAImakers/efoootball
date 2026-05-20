// ~/e-football/src/pages/sms/Sendsms.tsx
import { useState } from 'react';
import { transmitLiveSMS } from './Api';

export default function SendSMS() {
  const [phone, setPhone] = useState('+254');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!phone.trim() || !message.trim()) {
      setError('Both phone number and message fields are required.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await transmitLiveSMS({ phone: phone.trim(), message: message.trim() });
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while sending.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-12 p-8 border rounded-xl shadow-lg bg-white">
      <h1 className="text-3xl font-bold text-center mb-2">eFootball Live SMS</h1>
      <p className="text-center text-gray-500 mb-8 font-medium">Africa’s Talking Production Route</p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Recipient Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+254712345678"
            className="w-full p-4 border rounded-lg text-gray-900 focus:outline-none focus:border-green-500 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Message Content</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="Type tournament updates, fixtures or match details here..."
            className="w-full p-4 border rounded-lg text-gray-900 focus:outline-none focus:border-green-500 transition"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-4 rounded-lg font-semibold text-lg transition shadow-md"
        >
          {loading ? 'Transmitting to AT Gateway...' : 'Send Live SMS Now'}
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm">
            <span className="font-bold">Dispatch Error:</span> {error}
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 p-5 rounded-lg">
            <p className="font-semibold text-green-800 mb-3">✅ Gateway Acknowledgement Received</p>
            <pre className="text-xs bg-white p-4 rounded overflow-auto max-h-48 border text-gray-700 font-mono">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}