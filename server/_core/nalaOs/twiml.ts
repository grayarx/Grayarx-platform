import {
  escapeXml,
  getTwilioSpeechLanguage,
  getTwilioVoiceName,
} from "@nalaOs/twilio-voice";

export function twimlDocument(body: string): Response {
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`,
    { headers: { "Content-Type": "text/xml; charset=utf-8" } },
  );
}

export function say(text: string): string {
  return `<Say voice="${escapeXml(getTwilioVoiceName())}" language="${escapeXml(getTwilioSpeechLanguage())}">${escapeXml(text)}</Say>`;
}

export function gatherSpeech(actionUrl: string): string {
  return `<Gather input="speech" language="${escapeXml(getTwilioSpeechLanguage())}" speechTimeout="auto" action="${escapeXml(actionUrl)}" method="POST"></Gather>`;
}

export function hangup(): string {
  return "<Hangup/>";
}

export function agentTurnTwiml(
  agentText: string,
  turnUrl: string,
  endCall: boolean,
): Response {
  if (endCall) {
    return twimlDocument(`${say(agentText)}${hangup()}`);
  }
  return twimlDocument(`${say(agentText)}${gatherSpeech(turnUrl)}`);
}
