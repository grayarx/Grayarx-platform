# GrayArx voice-agent implementation

This project currently contains the approved sales playbook and one-turn reply
API. It does not yet place or receive telephone calls.

## Recommended production path

Use:

- **Twilio Voice / SIP** for a South African phone number and call transport.
- **OpenAI Realtime over SIP** for live listening, turn-taking, reasoning, and
  speech.
- **GrayArx application server** for private business tools, product knowledge,
  dealership context, consent checks, scheduling, and call logs.

Twilio officially lists domestic outbound reachability for South Africa:
<https://www.twilio.com/en-us/guidelines/za/south-africa--voice-guidelines---twilio>

OpenAI's SIP integration is documented here:
<https://developers.openai.com/api/docs/guides/realtime-sip>

This fits the existing preference for OpenAI, but the OpenAI account must have
working billing and quota before implementation or testing.

## Call path

1. A GrayArx user selects an eligible dealership contact.
2. The server verifies consent, suppression, calling hours, and contact data.
3. Twilio calls the dealership from the approved GrayArx number.
4. Twilio routes the audio to an OpenAI Realtime SIP session.
5. GrayArx accepts the call webhook with the selected voice, instructions, and
   the dealership's approved context.
6. The model says one turn and waits. It never reads a complete script.
7. For product questions, the model searches approved GrayArx knowledge.
8. For actions, the model calls a server-side tool rather than claiming the
   action happened.
9. The server stores the transcript, outcome, follow-up, and any suppression.
10. On an ending turn, the voice finishes the complete farewell before the
    server disconnects the call.

## How the agent knows GrayArx

Do not paste the whole application into a prompt and tell the model it “knows
everything.” Give it two controlled sources:

### Approved product knowledge

Create versioned, reviewable articles for:

- What GrayArx does and does not do
- Free-pilot terms
- Showroom and inventory capabilities
- After-hours enquiry and test-drive flow
- Supported integrations
- Plans and approved pricing language
- POPIA, data, security, and legal answers
- Common dealer objections
- Claims the agent must never make

The agent retrieves only the relevant passages for each question. Unknown,
conflicting, legal, or technical questions go to a human.

### Live GrayArx tools

Expose narrowly scoped server-side functions:

- `get_dealership_context`
- `search_product_knowledge`
- `get_available_demo_slots`
- `book_demo`
- `send_approved_followup`
- `save_call_outcome`
- `mark_do_not_contact`
- `request_human_followup`

The model may ask to use a tool; only the server may perform the database or
messaging action. Every write must be authenticated, validated, and logged.

## Minimum data to add

For each contact:

- Name, role, dealership, phone, and source
- Decision-maker status
- Consent status, scope, source, and timestamp
- Last-contact timestamp and outcome
- Callback date and time
- Do-not-contact status and reason

For each call:

- Provider call ID
- Prompt and knowledge-base versions
- Start/end time and participants
- Transcript or approved recording reference
- Detected intents
- Tool calls and results
- Outcome, follow-up owner, and review status

## Compliance gate

This must be implemented before automated outbound calls.

The South African Information Regulator's direct-marketing guidance treats
outbound telemarketing calls as electronic communication. For a prospect who is
not an existing customer, the guidance says prior consent is required and only
one approach may be made to request that consent. A consent request must not be
silently treated as permission for a full sales pitch. Telephone consent must be
recorded as prescribed.

Official guidance:
<https://inforegulator.org.za/wp-content/uploads/2020/07/GUIDANCE-NOTE-ON-DIRECT-MARKETING-IN-TERMS-OF-THE-PROTECTION-OF-PERSONAL-INFORMATION-ACT-4-OF-2013-POPIA.pdf>

Have South African counsel approve the exact eligibility rules, consent wording,
recording notice, calling hours, retention, and opt-out process before launch.

At minimum, the dialler must reject:

- Unknown or missing consent where consent is required
- A previous refusal or do-not-contact request
- Suppressed numbers
- Calls outside approved hours
- Missing dealership/contact provenance

## Voice selection

“Themba” is the persona name, not a voice. Select a voice supported by the
Realtime model after listening tests. The acceptance criteria should be:

- Natural South African English pronunciation
- Warm, composed, and confident rather than over-energetic
- Clear pronunciation of dealership names and local place names
- Comfortable interruption and fast response latency
- No attempt to imitate a real person
- Honest disclosure that it is an automated GrayArx representative when asked

Store the chosen provider voice identifier in configuration, not in sales copy.

## Safe rollout

1. Internal calls to the GrayArx team.
2. Scripted scenario tests for receptionists, interruptions, objections,
   unsupported questions, opt-outs, and silence.
3. Calls to explicitly opted-in test dealerships.
4. Human-supervised pilot with low daily limits.
5. Review transcripts and correct knowledge gaps.
6. Increase volume only after compliance, booking, suppression, and handoff
   behavior are proven.

## Prerequisites still missing

- Access to the real `Grayarx-Final` repository
- Restored OpenAI billing/quota
- Twilio account, approved South African number, and SIP configuration
- A production HTTPS webhook on `grayarx.com`
- Approved knowledge articles and prohibited-claims list
- Consent/suppression records and server-side enforcement
- Calendar/demo-booking integration
- Persistent call logs and human follow-up queue
- Selected and tested voice
