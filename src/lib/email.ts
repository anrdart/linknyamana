export async function sendEmail(config: {
  apiKey: string
  from: string
  to: string
  subject: string
  html: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: config.from,
        to: [config.to],
        subject: config.subject,
        html: config.html
      })
    });

    if (res.ok) {
      return { success: true };
    } else {
      let errorMessage: string | undefined;
      try {
        const data = await res.json();
        if (data?.message) errorMessage = data.message;
        else if (data?.error) errorMessage = data.error;
      } catch {
        // ignore JSON parse errors
      }
      if (!errorMessage) errorMessage = `Request failed with status ${res.status}`;
      return { success: false, error: errorMessage };
    }
  } catch {
    return { success: false, error: 'Network error' };
  }
}
