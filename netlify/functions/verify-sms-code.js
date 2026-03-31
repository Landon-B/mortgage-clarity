// Netlify Function: Verify SMS code via Twilio Verify API
// Required env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID

const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { phone, code } = JSON.parse(event.body);

    if (!phone || !code || code.length !== 6) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Phone and 6-digit code required' }) };
    }

    const digits = phone.replace(/\D/g, '');
    const e164 = '+1' + digits; // US numbers

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken || !TWILIO_VERIFY_SERVICE_SID) {
      return { statusCode: 500, body: JSON.stringify({ error: 'SMS service not configured' }) };
    }

    // Use Twilio Verify API to check the code
    const authHeader = 'Basic ' + Buffer.from(accountSid + ':' + authToken).toString('base64');
    const params = new URLSearchParams();
    params.append('To', e164);
    params.append('Code', code);

    const response = await fetch(
      `https://verify.twilio.com/v2/Services/${TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`,
      {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }
    );

    if (!response.ok) {
      return { statusCode: 200, body: JSON.stringify({ verified: false }) };
    }

    const data = await response.json();
    const verified = data.status === 'approved';

    return {
      statusCode: 200,
      body: JSON.stringify({ verified: verified }),
    };
  } catch (err) {
    console.error('verify-sms-code error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal error' }) };
  }
};
