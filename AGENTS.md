# contact (mcheck)

Don't modify working code unrelated to the request.

## SendGrid contact forward — block list (Aug 2026)

`POST /api/sendgrid` forwards contact submissions to `info@tu.biz` via SendGrid. A JSON block list drops known spam **before** `sgMail.send`.

### Locked design (keep)

| Piece | Detail |
|-------|--------|
| List file | `app/api/sendgrid/blocked-emails.json` — lowercase bare addresses |
| Route | `app/api/sendgrid/route.js` imports the JSON, builds a `Set` |
| Match | `extractEmail(from)` — handles plain `email@x.com` and `Name <email@x.com>` |
| Blocked response | `200` `{ message: "Email received" }` — do **not** call SendGrid; silent so bots don't learn |
| Forwarded mail | Always **to** `info@tu.biz`, **from** `edgar@teams.tu.biz`, **replyTo** = submitter `from` |
| Log | `Blocked sendgrid forward for {email}` on block (check host logs when debugging) |

### What this does **not** do

- Does **not** stop Gmail/Outlook compose to `emma@team05.tu.biz` (or any mailbox). That is MX/mailbox delivery.
- Does **not** stop Google Workspace / Microsoft **forwarding** of those mailboxes to `info@tu.biz`.
- Only applies when something **POST**s `/api/sendgrid` with a `from` field on the list.

If `info@tu.biz` shows **From: elindo586@gmail.com** (not `edgar@teams.tu.biz`), that mail never hit this route — fix mailbox filters/forwards, not the JSON list.

### How to add a blocker

1. Append the address (lowercase) to `app/api/sendgrid/blocked-emails.json`.
2. Deploy. Confirm host is on the commit that includes the JSON + route.
3. Test with POST `from` exactly that address (or `Name <that@address>`). Expect no new mail at `info@tu.biz`; host logs should show the blocked line.

### Forbidden shortcuts

- Stripping the block check or returning an error that reveals the block to scrapers (prefer silent `200`)
- Matching only raw `from.trim().toLowerCase()` without `extractEmail` (misses `Name <email>`)
- Assuming the request body `to` is used for delivery — it is validated but SendGrid always sends to `info@tu.biz`
- Expecting this list to replace spam filters on `team05` / personal inboxes

### Key files

| Area | Path |
|------|------|
| Forward API | `app/api/sendgrid/route.js` |
| Block list | `app/api/sendgrid/blocked-emails.json` |
| Event webhook (unrelated) | `app/api/sendgrid-webhook/route.js` |
