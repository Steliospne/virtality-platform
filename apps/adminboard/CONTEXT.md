# Adminboard

Internal admin dashboard for managing platform resources and operational content.

## UI patterns

When a dropdown menu item opens a dialog, follow `docs/adr/0002-dropdown-dialog-pointer-events.md` (controlled menu, `modal={false}`, defer dialog open via `useDropdownMenu`).

## Language

**Bucket Object**:
A file-like asset stored in the platform media bucket and served through the Virtality CDN.
_Avoid_: S3 resource, file resource

**Object Key**:
The slash-separated, URL-safe name of a bucket object. Admin-created object keys keep a readable filename stem and include a unique suffix.
_Avoid_: File path, S3 path

**CDN URL**:
The public Virtality CDN address for a bucket object.
_Avoid_: File path, S3 URL

**Object Replacement**:
A content update that creates a new bucket object instead of changing the contents at an existing CDN URL.
_Avoid_: Overwrite

**Referenced Bucket Object**:
A bucket object whose CDN URL or object key is used by another platform resource.
_Avoid_: Attached file

**Folder**:
A navigational grouping of bucket objects by shared path-like location. Empty folders are not independent admin-managed things.
_Avoid_: Directory

**Folder Operation**:
An admin action applied to every bucket object in a folder.
_Avoid_: Folder CRUD

**Admin-authored Email**:
A marketing, newsletter, or announcement email composed by an Adminboard admin using Email Body Blocks.
_Avoid_: Custom template, HTML email

**System Email**:
A code-owned account or product email that changes infrequently and is not edited through the no-code builder.
_Avoid_: Transactional template

**Email Draft**:
A saved, editable Admin-authored Email that has not been final-sent.
_Avoid_: Template draft

**Sent Email Record**:
An immutable record created by Final Send, including the rendered snapshot and per-recipient delivery results.
_Avoid_: Sent message

**Email Body Block**:
A structured content unit in the no-code builder, such as Heading, Paragraph, Image, Button, List, Card, or Divider.
_Avoid_: Component, widget

**Email Brand Shell**:
The locked Virtality header, footer, and sender identity wrapped around admin-authored body content.
_Avoid_: Email layout, wrapper template

**Email Recipient List**:
The explicit list of recipient email addresses entered for a draft send.
_Avoid_: Audience, mailing list

**Email Test Send**:
A required pre-send delivery to verify the rendered email in a real inbox.
_Avoid_: Preview send

**Final Send**:
The immediate, irreversible send that creates a Sent Email Record.
_Avoid_: Blast send, publish
