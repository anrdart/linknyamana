export async function sendTelegramMessage(botToken: string, chatId: string, text: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return { success: false, error: (data as any)?.description || `HTTP ${res.status}` }
    }
    return { success: true }
  } catch {
    return { success: false, error: 'Network error' }
  }
}
