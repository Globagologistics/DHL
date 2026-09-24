PROJECT TITLE:
DHL EXPRESS — NEXT-GENERATION SHIPMENT TRACKING & CUSTOMER SUPPORT EXPERIENCE

PROJECT TYPE:
High-fidelity responsive UI/UX redesign concept and interactive prototype.

PURPOSE:
This is a professional UI redesign concept intended for a DHL design/prototype presentation.

The goal is to redesign an existing shipment/consignment tracking experience into a cleaner, more modern, premium, responsive DHL digital experience.

This is primarily a customer-facing shipment tracking application.

Do NOT invent an entirely new logistics business model.

Do NOT build unnecessary shipping, payment, e-commerce, quotation, account-management, or enterprise dashboard functionality.

The most important experience is:

Onboarding
→ Home Dashboard
→ Shipment Search
→ Tracking Result
→ Detailed Tracking Timeline
→ Package Image / Waybill / Route Information
→ Customer Support Verification
→ Shipment-Specific Chat

Also create:
Navigation Sidebar
Send Shipment temporary loading/server-unavailable experience

This prototype must work beautifully across:

MOBILE
TABLET
DESKTOP

The design must be mobile-first but fully responsive.

--------------------------------------------------
BRAND
--------------------------------------------------

The application brand is:

DHL EXPRESS

Use DHL's recognizable visual identity.

PRIMARY YELLOW:
#FFCC00

DHL RED:
#D40511

PRIMARY BLACK:
#191919

DARK TEXT:
#1D1D1B

SECONDARY TEXT:
#5F6368

WHITE:
#FFFFFF

BACKGROUND:
#F5F5F5
or another extremely light neutral gray.

SUCCESS GREEN:
#36A852

WARNING:
#E7A000

ERROR:
#D40511

Use the DHL logo in headers and appropriate branded areas.

The interface should immediately feel like DHL while presenting a significantly more refined and modern customer experience.

Do NOT simply reproduce the current DHL website pixel-for-pixel.

This should feel like a future-facing DHL redesign concept.

Think:

DHL brand identity
+
Apple-level spacing and polish
+
modern FedEx/UPS shipment clarity
+
premium banking-app information architecture
+
high-quality logistics tracking UX.

--------------------------------------------------
OVERALL DESIGN CHARACTER
--------------------------------------------------

The interface should feel:

Premium
International
Trustworthy
Fast
Clean
Modern
Minimal
Professional
Logistics-focused
Reliable
Accessible
Highly readable

Avoid:

generic SaaS dashboard appearance
crypto-style UI
heavy glassmorphism
excessive gradients
oversized cards everywhere
unnecessary marketing sections
tiny text
clutter
cartoonish interfaces
overly playful illustrations

Use large amounts of intentional white space.

Use DHL yellow as the strongest brand surface.

Use red for:

primary DHL accents
important links
search/action controls
small branding highlights
critical error states

Do NOT make the entire application red.

--------------------------------------------------
TYPOGRAPHY
--------------------------------------------------

Use a clean contemporary sans-serif typeface.

Preferred:

Inter
Helvetica Neue
Arial
or a similarly neutral modern corporate typeface.

For iOS/mobile presentation, typography may have an SF Pro-like rhythm.

Typography hierarchy:

Hero Heading:
32–44px mobile
48–64px desktop

Screen Heading:
24–30px mobile
32–40px desktop

Section Heading:
18–22px mobile
20–26px desktop

Card Heading:
16–19px

Body:
15–17px mobile
16–18px desktop

Metadata:
13–14px

Buttons:
16–18px semibold

Keep all important shipment information easily readable.

--------------------------------------------------
DESIGN SYSTEM
--------------------------------------------------

Build a reusable professional design system.

Create reusable components and variants.

Use Auto Layout everywhere possible.

Use Variables for:

colors
spacing
radius
shadows
typography

Use an 8px spacing system.

Typical spacing:

4
8
12
16
20
24
32
40
48
64

Mobile horizontal padding:
16–20px

Tablet:
24–32px

Desktop content max width:
approximately 1200–1440px

Card radius:
12–18px

Button radius:
8–14px

Inputs:
10–14px radius

Do not make every element extremely rounded.

DHL is a serious international logistics brand.

Use subtle shadows and borders.

--------------------------------------------------
CREATE REUSABLE COMPONENTS
--------------------------------------------------

Create reusable components for:

DHL Header

Desktop Navigation

Mobile Header

Mobile Bottom Navigation

Hamburger Menu

Navigation Drawer

Primary Button

Secondary Button

Text Button

Tracking Input

Search Button

Status Badge

Delivery Progress Indicator

Tracking Timeline Event

Shipment Information Card

Package Image Card

Waybill Card

Route Map Card

Notification Badge

Floating Support Button

Customer Chat Bubble

Support Chat Bubble

Shipment Chat Card

Chat Composer

Loading Spinner

Server Error State

Modal

Desktop Sidebar

Toast / Feedback Message

Input Default

Input Focus

Input Error

Input Success

--------------------------------------------------
FRAME ORGANIZATION
--------------------------------------------------

Organize the Figma document into clearly named sections:

00 — Design System

01 — Mobile

02 — Tablet

03 — Desktop

04 — Components

05 — Prototype Flow

06 — States & Modals

07 — Presentation Cover

Avoid names such as:

Frame 47
Rectangle 91
Group 22

Use semantic names such as:

Mobile/HomeDashboard

Mobile/TrackingResult

Mobile/TrackingTimeline

Mobile/SupportGate

Mobile/ShipmentChat

Desktop/HomeDashboard

Desktop/TrackingTimeline

Component/ShipmentStatusCard

Component/ChatComposer

--------------------------------------------------
TARGET BREAKPOINTS
--------------------------------------------------

Design around these approximate responsive sizes:

MOBILE:
390 × 844
or similar modern iPhone viewport.

TABLET:
768 × 1024

DESKTOP:
1440 × 1024
or comparable desktop viewport.

The web application must adapt smoothly between sizes.

Do not simply scale the mobile screen larger on desktop.

The desktop layout should genuinely use additional screen space.

--------------------------------------------------
IOS OPTIMIZATION
--------------------------------------------------

Mobile should be particularly optimized for iPhone.

Respect:

Dynamic Island
notch
status bar
top safe area
bottom Home Indicator
Safari bottom area

Nothing important should collide with iOS safe areas.

Use comfortable thumb-friendly touch targets.

Minimum interactive target approximately 44px.

--------------------------------------------------
DESKTOP RESPONSIVE PRINCIPLES
--------------------------------------------------

On desktop:

Use a proper desktop header.

DHL logo aligned left.

Navigation/actions can appear across the header.

Tracking areas can become wider.

Tracking Timeline information may use a 2-column composition.

For example:

LEFT:
timeline and shipment progress

RIGHT:
package information
waybill
map preview
support shortcut

Do not stretch text paragraphs across the full monitor width.

Use a centered max-width container.

Floating customer support remains in the bottom-right.

On desktop it can display:

chat icon
+
“Support”

On mobile it should remain a circular floating icon.

--------------------------------------------------
PRIMARY SCREENS TO CREATE
--------------------------------------------------

Create exactly these important product screens:

01 — Welcome / Onboarding

02 — Home Dashboard

03 — Track Shipment / Shipment Search

04 — Tracking Result

05 — Tracking Timeline / Shipment Details

06 — Navigation Sidebar / Drawer

07 — Customer Support Shipment-ID Gate

08 — Shipment Support Chat

09 — Send Shipment Loading

10 — Send Shipment Connection Error

11 — Send Shipment Server Issue

Create responsive versions for:

mobile
tablet
desktop

where appropriate.

--------------------------------------------------
SCREEN 01
WELCOME / ONBOARDING
--------------------------------------------------

Create a premium DHL introduction experience.

Use high-quality logistics imagery.

Possible visual composition:

DHL cargo aircraft
DHL delivery vehicle
freight containers
international logistics facility
airport cargo terminal

The imagery should look realistic and premium.

Use DHL yellow, black, white and subtle red.

Hero headline:

“Delivering possibilities.
Worldwide.”

Alternative secondary line:

“Track every shipment with confidence.”

Supporting message:

“Real-time shipment updates, delivery progress and secure customer support in one seamless experience.”

Primary CTA:

“Get Started”

The screen should feel immersive but uncluttered.

Include subtle carousel/page indicators if useful.

Do NOT show the floating support button on the onboarding screen.

MOBILE:

Full-screen vertical composition.

DESKTOP:

Use a strong split-screen or wide hero treatment.

For example:

Left:
copy and CTA

Right:
large logistics visual

or a sophisticated full-width branded hero.

--------------------------------------------------
SCREEN 02
HOME DASHBOARD
--------------------------------------------------

This is the main customer entry point.

HEADER:

Mobile:

hamburger icon
centered DHL logo
notification icon

Desktop:

DHL logo
navigation
notification
optional sign-in action

Main hero area should strongly emphasize shipment tracking.

Headline:

“Hello, Guest”

Main heading:

“Track your DHL Express shipment”

Supporting text:

“Get real-time updates on your shipment anywhere in the world.”

Create a large tracking search field.

Placeholder:

“Enter tracking number”

Search/CTA:

“Track”

Use a red DHL search button or action area.

Tracking must be the strongest element on the page.

Below the tracking hero create only useful customer actions:

Track Shipment

Send Shipment

Customer Support

Optional:
Service Points

Do NOT add unnecessary things such as:

advertising
promotions
news
financial statistics
sales widgets
marketing offers
complex account cards

--------------------------------------------------
FLOATING CHAT BUTTON
--------------------------------------------------

Add a persistent floating chat/support button.

Do NOT show it on onboarding.

Show it on:

Home Dashboard

Tracking Result

Tracking Timeline

and other authenticated-looking customer areas where appropriate.

Mobile:

Circular floating button.

Prefer DHL red with white chat icon
or an elegant dark/red DHL treatment.

Position:

bottom-right
above bottom navigation
above iOS safe area

Desktop:

bottom-right fixed floating control.

Can expand slightly to show:

“Support”

--------------------------------------------------
BOTTOM MOBILE NAVIGATION
--------------------------------------------------

Use:

Home

Track

Support

More

Use simple clean line icons.

Active tab should be obvious.

DHL red may indicate active state.

Do not overcrowd navigation.

--------------------------------------------------
SCREEN 03
TRACK SHIPMENT / SHIPMENT SEARCH
--------------------------------------------------

Header:

back arrow
title:

“Track Shipment”

Use a minimal package/search illustration.

Heading:

“Track your shipment”

Supporting copy:

“Enter your tracking number to view shipment status, route and delivery updates.”

Large tracking input:

“Enter tracking number”

Primary button:

“Track Shipment”

Optional secondary control:

“Scan Barcode”

Do not introduce extra functionality.

--------------------------------------------------
SCREEN 04
TRACKING RESULT
--------------------------------------------------

After entering a valid tracking number, show a clear tracking summary.

Use example tracking ID:

JD0146000038429915

Make the tracking number easy to replace.

Show copy icon.

Shipment Status:

“In Transit”

Estimated Delivery:

“Wednesday, 10 March”

Create a horizontal progress tracker:

Shipment Picked Up

In Transit

Out for Delivery

Delivered

Highlight the current stage.

Below display:

LATEST UPDATE

Example:

“Shipment has arrived at the local delivery facility.”

Date:

“10 March · 08:42 local time”

LOCATION

“Los Angeles, CA, United States”

RECIPIENT

“Sherry Gaetke”

Create prominent CTA:

“View Tracking Timeline”

Under it display useful shortcut cards:

Package Image

Waybill

Route Map

Use clear icons.

--------------------------------------------------
SCREEN 05
TRACKING TIMELINE / SHIPMENT DETAILS
--------------------------------------------------

This is one of the most important screens.

It should communicate substantial shipment information without feeling cluttered.

TOP:

Tracking Number:

JD0146000038429915

Status:

In Transit

Estimated Delivery:

Wednesday, 10 March

Create progress indicator:

Picked Up

In Transit

Out for Delivery

Delivered

Then show:

“Tracking Timeline”

Create a vertical DHL-style logistics timeline.

LATEST EVENT:

10 March 2026

09:42

Shipment is out with courier for delivery

Los Angeles, CA — United States

SECOND EVENT:

10 March 2026

07:51

Arrived at delivery facility

Los Angeles, CA — United States

THIRD:

09 March 2026

21:04

Processed at sorting facility

San Bernardino, CA — United States

FOURTH:

09 March 2026

14:31

Departed DHL facility

Phoenix, AZ — United States

FIFTH:

08 March 2026

10:15

Shipment picked up

Dallas, TX — United States

Use vertical timeline lines and status nodes.

Highlight newest event using DHL red or green success/status treatment depending on event type.

--------------------------------------------------
PACKAGE INFORMATION
--------------------------------------------------

Below the timeline create:

“Package Details”

Show an actual shipment/package thumbnail.

This represents the photographed package belonging to the consignment.

Example information:

1 Piece

2.5 kg

30 × 20 × 15 cm

Package thumbnail should be clickable.

Clicking opens:

PACKAGE IMAGE MODAL.

--------------------------------------------------
PACKAGE IMAGE MODAL
--------------------------------------------------

Title:

“Package Image”

Large shipment/package image.

Tracking Number:

JD0146000038429915

Metadata:

1 Piece

2.5 kg

Uploaded:
08 March 2026

Close control.

Desktop:

use a centered modal.

Mobile:

use full-screen or near-full-screen sheet.

--------------------------------------------------
WAYBILL
--------------------------------------------------

Create:

“Waybill & Documents”

Show:

Waybill

Tracking reference:

JD0146000038429915

CTA:

“View Waybill”

Use a clear document icon.

Click opens:

WAYBILL PREVIEW.

--------------------------------------------------
WAYBILL PREVIEW
--------------------------------------------------

Create a polished DHL-style shipping-document preview.

Include example fields such as:

Tracking Number

Sender

Recipient

Origin

Destination

Shipment Date

Pieces

Weight

Reference

Do not need to reproduce an existing real customer's DHL document.

Create a clean conceptual DHL waybill interface for the prototype.

Actions:

Download

Close

--------------------------------------------------
SIMULATED LIVE ROUTE MAP
--------------------------------------------------

Create section:

“Shipment Route”

or:

“Live Shipment Map”

IMPORTANT:

This is a PROTOTYPE visualization.

It does NOT need Google Maps integration.

Create a custom/static route visualization.

Show:

Origin:
Dallas, TX

Processing:
Phoenix, AZ

Current:
Los Angeles, CA

Destination:
Pacific Grove, CA

Use:

route line

current-location marker

small logistics vehicle icon

destination marker

Completed path:
solid DHL red

Remaining path:
gray or dashed

Include:

“View Larger”

--------------------------------------------------
EXPANDED MAP
--------------------------------------------------

Create a responsive larger shipment-map screen or modal.

Heading:

“Shipment Location”

Show:

current logistics location

last tracking update

destination

route

Example:

“Last updated 9:42 AM”

Explain visually that this is shipment-route progress.

Do NOT describe the location as exact live GPS.

--------------------------------------------------
FLOATING SUPPORT
--------------------------------------------------

The floating support icon MUST remain visible on the Tracking Timeline page.

--------------------------------------------------
SCREEN 06
NAVIGATION SIDEBAR / DRAWER
--------------------------------------------------

MOBILE:

Slide from the left.

Approximately 82–86% screen width.

Dim remaining content behind it.

Top:

DHL logo.

User:

Guest

Subtitle:

“Track and manage your shipments”

Navigation:

Home

Track Shipment

Tracking Timeline

Send Shipment

Customer Support

Notifications

Help Center

Optional bottom action:

“Sign In”

Do not force account creation.

Guest shipment tracking remains available.

Active page should have:

subtle yellow background

dark text

small red active indicator if appropriate.

DESKTOP:

Translate the drawer behavior appropriately.

Either:

desktop header navigation

or

collapsible side navigation where appropriate.

Do not permanently waste large desktop space if it is unnecessary.

--------------------------------------------------
SCREEN 07
CUSTOMER SUPPORT SHIPMENT-ID GATE
--------------------------------------------------

IMPORTANT FOR THIS PROTOTYPE:

This is NOT real authentication yet.

It is purely a clickable design/prototype demonstration.

When someone clicks:

Floating Chat Button

Customer Support card

Support navigation

open this screen or modal.

Title:

“Connect to Shipment Support”

Description:

“Enter your tracking ID to start a conversation about your shipment.”

Input placeholder:

“Enter tracking number”

Primary CTA:

“Continue to Chat”

Security/support message:

“Support conversations are linked to your shipment reference.”

FOR THIS PROTOTYPE ONLY:

Do NOT actually validate the tracking number.

Do NOT connect to an API.

Do NOT search a database.

Do NOT require a real DHL tracking ID.

ANY NON-EMPTY VALUE entered into the field must be treated as valid.

Example:

1234

TEST123

JD0001

ABC

All should proceed to the chat.

If the input is empty and Continue is clicked:

show:

“Please enter a tracking number.”

Once any characters are entered:

enable Continue to Chat.

When Continue is clicked:

briefly display:

“Connecting to shipment support…”

for approximately 500–1000ms in prototype behavior.

Then open the Shipment Support Chat.

This behavior is ONLY for demonstrating the UI prototype.

--------------------------------------------------
SUPPORT GATE VISUAL DESIGN
--------------------------------------------------

Use DHL branding.

Possible visual:

parcel
chat icon
shield
customer-support headset

Do not over-emphasize security because this prototype is not actually authenticating.

Use friendly professional copy.

MOBILE:

Can appear as full-screen page or bottom sheet.

DESKTOP:

Use elegant centered modal approximately 440–520px wide.

--------------------------------------------------
SCREEN 08
SHIPMENT SUPPORT CHAT
--------------------------------------------------

This screen must receive very careful attention.

It should feel like a world-class customer-support chat.

Think:

Apple Messages

modern banking support chat

premium airline support

DHL logistics tracking

combined.

Do NOT reuse the messy structure of an old chat system.

--------------------------------------------------
CHAT HEADER
--------------------------------------------------

Mobile:

back arrow

DHL logo or title:

“Shipment Support”

Under header show:

Tracking ID:

JD0146000038429915

or display whichever random ID was entered on the previous prototype screen.

Label:

“Shipment Support”

Status:

Online

Optional shipment status badge:

“In Transit”

Keep header compact.

DESKTOP:

Create professional split layout if appropriate.

Possible structure:

LEFT:
conversation

RIGHT:
shipment information panel

or

single centered chat card with shipment information accessible from the header.

--------------------------------------------------
CHAT BUBBLES
--------------------------------------------------

CUSTOMER:

right aligned

background:
DHL yellow or dark charcoal/red depending on readability

Prefer:
#FFCC00 with dark text

or tasteful DHL-red variation where appropriate.

SUPPORT:

left aligned

very light gray

dark text

Use a simple DHL support icon.

Do NOT use fake employee photos.

Show readable timestamps.

--------------------------------------------------
EXAMPLE CHAT
--------------------------------------------------

Customer:

“Hi, could you please tell me the current status of my shipment?”

Support:

“Hello 👋 Thanks for reaching out. I’ve checked the latest updates for your shipment.”

Then display an EMBEDDED SHIPMENT STATUS CARD inside the conversation.

Shipment:

JD0146000038429915

Status:

In Transit

1 Piece

Timeline preview:

09:42

Shipment is out with courier for delivery

Los Angeles, CA

07:51

Arrived at delivery facility

Los Angeles, CA

21:04

Processed at sorting facility

San Bernardino, CA

CTA:

“View Details”

Then support message:

“Your shipment is currently with our courier and is scheduled for delivery today. We’ll keep you updated if anything changes.”

Customer:

“Great, thank you!”

--------------------------------------------------
CHAT COMPOSER
--------------------------------------------------

Sticky at bottom.

LEFT:

attachment / paperclip

CENTER:

text field

Placeholder:

“Type your message…”

RIGHT:

circular DHL red send button

white paper-plane icon.

Allow multiline.

Create component states:

Empty

Typing

Sending

Sent

Delivered

Failed

Support Typing

Typing indicator example:

“DHL Support is typing…”

Use subtle animated dots in prototype.

--------------------------------------------------
MOBILE KEYBOARD BEHAVIOR
--------------------------------------------------

Simulate layout behavior correctly.

When keyboard is conceptually open:

chat composer remains immediately above keyboard.

Messages remain scrollable.

Nothing overlaps the iPhone Home Indicator.

--------------------------------------------------
DESKTOP CHAT
--------------------------------------------------

Use available desktop space intelligently.

Possible desktop composition:

LEFT COLUMN:
approximately 65–70%
chat conversation

RIGHT COLUMN:
approximately 30–35%
shipment context

Right panel can contain:

Tracking Number

Current Status

Expected Delivery

Destination

Latest Update

small Route Map

View Full Tracking button

The support conversation should remain the visual focus.

--------------------------------------------------
SCREEN 09
SEND SHIPMENT — INITIAL LOADING
--------------------------------------------------

IMPORTANT:

DO NOT design the complete shipment-booking workflow.

It has not been finalized.

When users choose:

Send Shipment

open a temporary polished loading page.

Heading:

“Preparing shipment services…”

Supporting copy:

“Please wait while we connect you to DHL shipment services.”

Show:

package/conveyor/freight illustration

animated loading indicator.

Prototype behavior:

remain loading for approximately 10 seconds.

Then show Connection Issue.

--------------------------------------------------
SCREEN 10
SEND SHIPMENT — CONNECTION ISSUE
--------------------------------------------------

Heading:

“We’re having trouble connecting.”

Supporting text:

“Shipment services are temporarily unavailable.”

Primary CTA:

“Try Again”

Secondary:

“Back to Home”

Click:

Try Again

→ return to loading state.

--------------------------------------------------
SCREEN 11
SEND SHIPMENT — SERVER ISSUE
--------------------------------------------------

After retry loading, show:

“Shipment services are temporarily unavailable.”

Message:

“We are currently experiencing server issues. Please try again in approximately 5 minutes.”

Primary:

“Try Again”

Secondary:

“Back to Home”

Do not display:

HTTP errors

server codes

developer messages

API stack traces

technical infrastructure information

Make it feel like a deliberate, professionally handled service interruption.

--------------------------------------------------
PROTOTYPE INTERACTIONS
--------------------------------------------------

Build a working clickable Figma prototype.

FLOW:

Welcome

Get Started
→ Home Dashboard

HOME:

Tracking input
→ Track Shipment / Tracking Result

Track action
→ Tracking Result

Track Shipment card
→ Track Shipment screen

Customer Support
→ Support Shipment-ID Gate

Floating chat
→ Support Shipment-ID Gate

Send Shipment
→ Loading State

Hamburger
→ Navigation Drawer

--------------------------------------------------
TRACKING FLOW
--------------------------------------------------

Track Shipment

Enter any demonstration tracking number

Track Shipment
→ Tracking Result

Tracking Result

View Tracking Timeline
→ Tracking Timeline

Package Image
→ Package Image Modal

View Waybill
→ Waybill Preview

Route Map
→ Expanded Route Map

Floating Chat
→ Support Gate

--------------------------------------------------
CHAT PROTOTYPE FLOW
--------------------------------------------------

Floating Chat

→ Support Gate

Support Gate:

empty field
→ Continue disabled or validation message.

Enter ANY non-empty text.

Example:

ABC123

→ Continue becomes active.

Continue

→ short Connecting state

→ Shipment Support Chat.

DO NOT perform real tracking verification.

The objective is to demonstrate the chat interface during the presentation.

--------------------------------------------------
CHAT INTERACTIONS
--------------------------------------------------

Allow prototype interactions such as:

send sample message

show sent message

display support typing indicator

display response

open embedded shipment details

return to tracking details

The prototype does not need a backend.

Use realistic interaction simulation.

--------------------------------------------------
RESPONSIVE BEHAVIOR
--------------------------------------------------

Do not merely create three unrelated designs.

Create one coherent responsive system.

MOBILE:

single-column

bottom navigation

floating support icon

drawer navigation

stacked tracking content

TABLET:

wider cards

some 2-column sections

larger map

larger timeline areas

DESKTOP:

desktop header

centered max-width content

2-column information layouts where helpful

timeline + shipment information side-by-side where appropriate

chat conversation + shipment context side panel

modals instead of full-screen pages where appropriate

--------------------------------------------------
MOTION AND TRANSITIONS
--------------------------------------------------

The final prototype should feel smooth.

Use tasteful transitions.

Examples:

drawer:
slide in

support gate:
fade + slight upward motion

modal:
fade + scale

page navigation:
subtle smart animate

chat message:
small fade/slide

loading:
smooth rotating indicator

tracking status:
small progress animation

Do NOT use distracting animations.

Target transition duration approximately:

180–300ms

Use ease-out motion.

--------------------------------------------------
ACCESSIBILITY
--------------------------------------------------

Maintain strong contrast.

Do not place yellow text on white.

Use black/dark text on DHL yellow.

Use white text on DHL red only when contrast is strong.

Ensure controls remain recognizable without relying only on color.

Use large touch targets.

Text should remain legible at normal mobile scale.

--------------------------------------------------
PRESENTATION QUALITY
--------------------------------------------------

This project will be shown as a professional redesign concept.

Create a presentation cover frame:

“DHL Express
Digital Shipment Experience
UI/UX Redesign Concept”

Optional subtitle:

“Tracking, shipment visibility and customer support reimagined.”

Keep the actual application screens free of unnecessary presentation labels.

The cover can identify the work as a redesign concept.

--------------------------------------------------
IMPORTANT FINAL CONSTRAINTS
--------------------------------------------------

DO NOT add an unnecessary:

checkout

payment system

complex booking wizard

marketplace

e-commerce store

analytics dashboard

admin dashboard

rewards program

advertisements

promotional feed

social features

AI assistant

phone/video calling

The redesign must stay focused on:

TRACKING

SHIPMENT VISIBILITY

PACKAGE INFORMATION

WAYBILL ACCESS

ROUTE VISUALIZATION

CUSTOMER SUPPORT

--------------------------------------------------
FINAL DELIVERABLE
--------------------------------------------------

Produce:

High-fidelity mobile screens

High-fidelity tablet adaptation

High-fidelity desktop adaptation

Responsive Auto Layout

Reusable design system

Reusable component variants

Clickable prototype

Smooth interactions

Prototype chat

Prototype shipment-ID entry

Tracking timeline

Package image preview

Waybill preview

Simulated shipment route map

Navigation drawer

Floating support control

Send Shipment loading/error experience

Keep the design editable and developer-friendly.

Do NOT flatten the main interface into screenshots.

All UI elements should remain usable as Figma layers/components so the design can later be used as the visual source of truth for implementation in an existing React/TypeScript web application.