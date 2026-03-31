// Netlify Function: Send SMS verification code via Twilio Verify API
// Required env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { phone } = JSON.parse(event.body);

    if (!phone || phone.replace(/\D/g, '').length < 10) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Valid phone number required' }) };
    }

    const digits = phone.replace(/\D/g, '');
    const e164 = '+1' + digits; // US numbers

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;

    // Debug: log which vars are missing (values are not logged)
    const missing = [];
    if (!accountSid) missing.push('TWILIO_ACCOUNT_SID');
    if (!authToken) missing.push('TWILIO_AUTH_TOKEN');
    if (!verifySid) missing.push('TWILIO_VERIFY_SERVICE_SID');

    if (missing.length > 0) {
      console.error('Missing env vars:', missing.join(', '));
      return { statusCode: 500, body: JSON.stringify({ error: 'SMS service not configured', missing: missing }) };
    }

    // Use Twilio Verify API to send verification code
    const authHeader = 'Basic ' + Buffer.from(accountSid + ':' + authToken).toString('base64');
    const params = new URLSearchParams();
    params.append('To', e164);
    params.append('Channel', 'sms');

    const response = await fetch(
      `https://verify.twilio.com/v2/Services/${verifySid}/Verifications`,
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
      const errorData = await response.text();
      console.error('Twilio error:', errorData);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to send verification code' }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ sent: true }),
    };
  } catch (err) {
    console.error('send-sms-code error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal error' }) };
  }
};
