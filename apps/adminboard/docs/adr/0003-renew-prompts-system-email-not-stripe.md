# Renew prompts use Virtality System Email, not Stripe Billing emails

Adminboard must configure day-offsets independently for email and in-app renew prompts. Stripe Billing customer emails cannot share those Adminboard offsets or cover in-app delivery, so renew email is a Virtality **System Email** keyed off the same **Entitlement Clock** as in-app triggers. Stripe remains source of truth for the clock end time; overlapping Stripe trial/invoice reminder emails should stay unused so seat holders are not double-emailed.
