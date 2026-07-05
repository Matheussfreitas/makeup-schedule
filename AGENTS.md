<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:application-continuous-memory -->
# Application Continuous Memory

Maintain this section as the persistent working memory for the application. When a change affects product behavior, scheduling rules, data formats, core UI structure, or framework/component conventions, update this section in the same change.

## Current Application

- Product: a makeup/beauty appointment scheduling interface inspired by a soft pastel booking flow.
- Main route: `app/page.tsx` renders `BookingScheduler`.
- Main interactive component: `components/booking-scheduler.tsx`.
- UI system: shadcn components in `components/ui`, using the project `base-maia` preset and Hugeicons.
- Visual direction: pastel warm neutrals with sage/mauve accents, restrained border radius, and editorial display typography.

## Scheduling Rules

- Calendar and time selection must be functional.
- Users must be able to select one day and one available time slot before confirming.
- Changing the selected day should clear the selected time so the confirmation always reflects an explicit day/time pair.
- Booked slots are disabled and cannot be selected.
- Appointment state currently lives client-side in `BookingScheduler`.

## Timezone And Timestamp Rules

- Scheduling works in Brazil time: `America/Sao_Paulo`.
- Do not convert selected appointment times to UTC for display or confirmation.
- Do not add or subtract hours from the selected civil time.
- Confirmed timestamps should preserve the chosen date and hour exactly in this shape: `YYYY-MM-DDTHH:mm:00-03:00`.
- Keep separate civil values (`YYYY-MM-DD` and `HH:mm`) available in state or payloads when adding integrations, so backend/API code does not infer a different timezone.

## Next Agent Checklist

- Before editing Next.js behavior, read the relevant guide in `node_modules/next/dist/docs/`.
- Before changing shadcn components or usage, run the shadcn CLI docs/info commands for the relevant component and inspect generated local files.
- Preserve the current booking behavior unless the requested change explicitly changes it.
- If adding persistence or API submission, document the request/response payload shape here and keep the Brazil timezone rule intact.
<!-- END:application-continuous-memory -->
