CRITICAL UI/UX CORRECTION AND COMPLETE REDESIGN REQUEST

PROJECT:
DHL EXPRESS — SHIPMENT TRACKING & CUSTOMER SUPPORT REDESIGN PROTOTYPE

IMPORTANT:
You are receiving an EXISTING Figma Make project/codebase.

DO NOT treat the current visual design as approved.

The current implementation is functionally useful as a starting point, but the visual result is NOT ACCEPTED and is substantially different from the intended high-fidelity design.

I want you to INSPECT THE EXISTING PROJECT FIRST, understand its current components, navigation, state handling and interactions, and then REBUILD/REFINE THE CUSTOMER-FACING UI.

DO NOT merely change a few colors.

DO NOT simply polish the existing layouts.

DO NOT preserve incorrect visual compositions just because they already exist.

The existing application should be treated as:

FUNCTIONAL STRUCTURE = useful
CURRENT VISUAL DESIGN = rejected

The new result must feel like an entirely more refined, premium DHL redesign proposal.

--------------------------------------------------
PRIMARY OBJECTIVE
--------------------------------------------------

Transform the existing prototype into a:

• extremely polished
• minimal
• sophisticated
• modern
• premium
• responsive
• iOS-optimized
• DHL-branded

shipment tracking experience.

This is being prepared as a UI/UX REDESIGN CONCEPT for presentation to DHL.

The design must look convincing enough to present as a serious redesign proposal for a global logistics company.

It must NOT look like:

• a generic React demo
• a Tailwind template
• a SaaS dashboard
• an AI-generated website
• an ordinary DHL clone
• a collection of random cards
• an e-commerce application
• a student design exercise

The final interface should feel like a professionally designed DHL digital product.

--------------------------------------------------
DO NOT START CODING IMMEDIATELY
--------------------------------------------------

FIRST inspect:

src/App.tsx
src/index.css
existing components
existing states
existing interactions
responsive behavior

Identify what can remain logically.

Then rebuild the visual presentation.

Preserve useful prototype logic such as:

• navigation
• tracking ID state
• support gate
• prototype chat state
• send-shipment loading behavior

But replace/restructure the UI where necessary.

--------------------------------------------------
VISUAL REFERENCE DIRECTION
--------------------------------------------------

The intended design style is the HIGH-FIDELITY MOBILE PROTOTYPE STYLE:

clean white surfaces
very intentional spacing
large readable typography
premium logistics imagery
minimal card borders
very subtle shadows
compact navigation
strong information hierarchy
large touch targets
iOS-quality spacing
beautiful shipment progress visualization
simple floating support control

The interface must look sophisticated even when very little information is displayed.

LESS visual clutter.

LESS boxed content.

LESS decorative UI.

MORE hierarchy.

MORE breathing room.

MORE premium typography.

MORE refined spacing.

--------------------------------------------------
DHL BRAND SYSTEM
--------------------------------------------------

Use DHL branding throughout the new application.

Primary DHL Yellow:
#FFCC00

Primary DHL Red:
#D40511

Near Black:
#191919

Primary Text:
#1D1D1B

Secondary Text:
#62656A

Light Secondary Text:
#85898F

White:
#FFFFFF

Primary Background:
#F7F7F5

Secondary Background:
#F2F3F4

Border:
#E6E7E8

Success Green:
#2E9B50

Soft Success Background:
#EDF8F0

Warning:
#D99700

Error:
#D40511

DO NOT turn every screen yellow.

Use DHL yellow strategically.

Use white as the dominant application surface.

Use black/dark charcoal for typography.

Use red primarily for:

• DHL identity
• important actions
• active details
• links
• alerts

Yellow can be used for:

• major CTA
• shipment highlights
• selected navigation
• floating accents
• progress highlights where appropriate

The design should unmistakably belong to DHL without looking visually aggressive.

--------------------------------------------------
TYPOGRAPHY
--------------------------------------------------

Use:

Inter
Helvetica Neue
or a similar high-quality neutral sans-serif.

Typography should resemble premium native applications.

Mobile:

Hero headline:
34–40px

Main page title:
26–30px

Section headings:
19–22px

Card titles:
16–18px

Body:
15–17px

Supporting:
14–15px

Metadata:
12–13px

Button:
16–17px semibold

Desktop:

Hero:
52–64px

Main titles:
34–42px

Body:
16–18px

DO NOT use tiny text.

DO NOT make everything bold.

Use weight intentionally.

--------------------------------------------------
SPACING SYSTEM
--------------------------------------------------

Use an 8px spacing philosophy.

Core spacing:

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
80

Mobile horizontal padding:
20px

Some dense screens:
16px minimum.

Cards:
16–20px internal padding.

Sections:
24–32px apart.

Desktop content:
max-width approximately 1240px.

Do not allow full-width text to stretch across huge monitors.

--------------------------------------------------
CORNER RADIUS
--------------------------------------------------

Do NOT use excessive pill shapes.

Cards:
16–20px

Large hero cards:
22–24px

Inputs:
14–16px

Buttons:
12–16px

Small badges:
999px only where a real pill is appropriate.

--------------------------------------------------
SHADOWS
--------------------------------------------------

Use extremely subtle shadows.

Example:

0 8px 30px rgba(0,0,0,0.06)

or lighter.

Prefer:

white space
thin borders
surface contrast

over heavy shadows.

--------------------------------------------------
IMPORTANT:
REMOVE THE CURRENT GENERIC WEBSITE FEEL
--------------------------------------------------

The new application should feel closer to:

Apple Wallet
Apple Maps
premium airline apps
premium banking apps
modern parcel tracking apps

than to a traditional corporate website.

On MOBILE especially, it should feel almost like a native iOS application even though it is a responsive web app.

--------------------------------------------------
MOBILE-FIRST
--------------------------------------------------

Primary viewport:

iPhone 15 Pro
393 × 852 approximately.

Respect:

Dynamic Island
status bar
top safe area
Safari safe zones
bottom Home Indicator

No controls under the Home Indicator.

Minimum touch area:
44px.

--------------------------------------------------
RESPONSIVENESS
--------------------------------------------------

Create polished layouts for:

MOBILE
390–430px

TABLET
768–1024px

DESKTOP
1280–1600px

DO NOT simply stretch mobile cards on desktop.

Mobile:
single-column.

Tablet:
1–2 columns depending on content.

Desktop:
use sophisticated two-column compositions where useful.

--------------------------------------------------
REQUIRED APPLICATION SCREENS
--------------------------------------------------

The finished prototype MUST contain ALL of these:

01. Onboarding / Welcome

02. Home Dashboard

03. Track Shipment Search

04. Tracking Result

05. Detailed Tracking Timeline

06. Navigation Drawer / Sidebar

07. Shipment Support ID Entry

08. Shipment Support Chat

09. Send Shipment Loading

10. Send Shipment Connection Error

11. Send Shipment Server Error

12. Settings

13. Package Image Preview

14. Waybill Preview

15. Expanded Shipment Route Map

DO NOT FINISH THE PROJECT IF ANY OF THESE ARE MISSING.

--------------------------------------------------
01 — COMPLETELY REBUILD THE ONBOARDING SCREEN
--------------------------------------------------

IMPORTANT:

THE CURRENT ONBOARDING DESIGN IS NOT ACCEPTED.

Replace it completely.

Do not use a generic left-text/right-image corporate landing-page layout as the main mobile concept.

MOBILE DESIGN:

Create an immersive full-screen logistics experience.

Background:

high-quality DHL logistics image.

Composition should contain:

DHL aircraft
international logistics terminal
freight truck
cargo / warehouse activity

The image should occupy approximately 65–72% of the screen.

Use subtle black/navy tonal overlay at bottom for readability.

Top:

DHL Express logo.

Do NOT place the logo inside a random white/yellow card.

Place it naturally over the visual.

Text should appear over or immediately below the cinematic imagery.

Headline:

“Delivering possibilities.
Worldwide.”

Alternative supporting heading:

“Track every shipment with confidence.”

Supporting text:

“Real-time shipment updates and customer support, wherever your shipment is headed.”

Bottom:

large yellow CTA.

“Get Started”

Dark text.

Chevron/right arrow.

Below or near CTA:

three small pagination dots.

Only first active.

NO CHAT BUTTON on onboarding.

NO BOTTOM NAVIGATION.

NO SIGN-IN REQUIREMENT.

Make this screen visually impressive.

--------------------------------------------------
DESKTOP ONBOARDING
--------------------------------------------------

Desktop must also feel cinematic.

Use a sophisticated 55/45 or 60/40 composition.

One area:

large logistics photography.

Other area:

DHL yellow/white content composition.

Do NOT make it look like an ordinary marketing website.

Keep the design immersive and minimal.

--------------------------------------------------
02 — COMPLETELY REDESIGN HOME DASHBOARD
--------------------------------------------------

This is the most important application screen.

MOBILE HEADER:

hamburger left

DHL logo centered

notification right

White header.

Minimal.

Approximately 60–68px plus safe area.

Under header:

create a large premium TRACKING HERO CARD.

This should visually resemble a high-end native application card.

Use strong DHL logistics imagery as the background.

Examples:

DHL aircraft
distribution facility
DHL vehicle
warehouse lights

Add controlled dark gradient overlay.

Within hero:

small:

“Hello, Guest”

Main:

“Track your DHL Express shipment”

Supporting:

“Get real-time updates wherever your shipment is headed.”

At bottom of hero:

WHITE tracking input.

Placeholder:

“Enter tracking number”

Red square/rounded search/arrow action on right.

The input should feel integrated into the hero.

DO NOT place the tracking input separately below a giant yellow section.

--------------------------------------------------
HOME QUICK ACTIONS
--------------------------------------------------

Below hero:

title:

“Quick actions”

Create simple premium cards.

ONLY:

Track Shipment

Send Shipment

Customer Support

Service Points

Mobile:
2 × 2 grid.

Cards:

white
minimal
subtle border
approximately 150–170px tall
large icon circle
title
one-line description
small chevron

Examples:

Track Shipment
“Check shipment status”

Send Shipment
“Prepare a shipment”

Customer Support
“Get help with a shipment”

Service Points
“Find a DHL location”

Do NOT overload the cards.

--------------------------------------------------
BOTTOM NAVIGATION
--------------------------------------------------

Mobile:

fixed above safe area.

White.

Thin top border.

Four items:

Home

Track

Support

More

Active:

red icon/text

or black icon with small DHL yellow/red indicator.

Avoid oversized bottom navigation.

--------------------------------------------------
FLOATING SUPPORT BUTTON
--------------------------------------------------

REQUIRED.

Home must contain a floating support/chat button.

Mobile:

approximately 54–58px circle.

Bottom-right.

Position ABOVE bottom navigation.

DHL Red:
#D40511

White chat bubble icon.

Subtle shadow.

Desktop:

floating button bottom-right.

Approximately:

chat icon
“Support”

--------------------------------------------------
03 — TRACK SHIPMENT SEARCH
--------------------------------------------------

Do NOT overdesign this screen.

Header:

back

“Track Shipment”

Use lots of whitespace.

Centered minimal illustration:

parcel + search.

Heading:

“Track your shipment”

Text:

“Enter your tracking number to see its current status and journey.”

Large input.

Placeholder:

“Enter tracking number”

Yellow primary CTA:

“Track Shipment”

Black/dark text.

Optional secondary control:

Scan Barcode

Use icon + text.

Do not add unrelated content.

--------------------------------------------------
04 — TRACKING RESULT
--------------------------------------------------

Create a beautiful shipment summary.

Top:

DHL header/back.

Main card:

Tracking Number

JD0146000038429915

copy button.

Large current status:

“In Transit”

Use green status indication.

Estimated Delivery:

“Wednesday, 10 March”

Then horizontal progress:

Received
In Transit
Out for Delivery
Delivered

Use extremely clean line/nodes.

Completed/current:
green or DHL red depending on semantic status.

Future:
light gray.

DO NOT use giant cartoon icons.

--------------------------------------------------
TRACKING RESULT INFORMATION
--------------------------------------------------

Below:

Latest update card.

Icon.

Label:

LATEST UPDATE

“Shipment has arrived at local sorting facility”

“10 March · 08:42 local time”

Next:

Destination

Pacific Grove, CA
United States

Next:

Recipient

Sherry Gaetke

Then:

large yellow CTA:

“View Tracking Timeline”

--------------------------------------------------
TRACKING RESULT SHORTCUTS
--------------------------------------------------

Under CTA:

three compact equal cards:

Package Image

Waybill

Live Map

Each:

icon
label
chevron

Minimal.

Do not make these huge.

--------------------------------------------------
05 — DETAILED TRACKING TIMELINE
--------------------------------------------------

This must closely follow the quality and information hierarchy of the previously approved high-fidelity concept.

Header.

Tracking ID.

Status.

Estimated delivery.

Compact horizontal journey progress.

Then:

TRACKING TIMELINE

Use a vertical timeline.

Example:

10 MAR
09:42

Shipment is out with courier for delivery

Los Angeles, CA

10 MAR
07:51

Arrived at local facility

Los Angeles, CA

09 MAR
21:04

Processed at sorting facility

San Bernardino, CA

09 MAR
14:31

Departed DHL facility

Phoenix, AZ

08 MAR
10:15

Shipment picked up

Dallas, TX

Use:

vertical thin line
circular nodes

Newest:
strong DHL red/green current node.

Older:
light gray nodes.

DO NOT enclose every event inside a separate big card.

Use ONE clean timeline surface.

--------------------------------------------------
PACKAGE SECTION
--------------------------------------------------

Below timeline:

two-column card layout where width allows.

PACKAGE DETAILS

Show a REALISTIC package photograph thumbnail.

Not a cartoon illustration.

Information:

1 Piece

2.5 kg

30 × 20 × 15 cm

Click:
Package Image Preview.

--------------------------------------------------
WAYBILL
--------------------------------------------------

Second card:

WAYBILL & DOCUMENTS

Document icon.

Waybill Number:

JD0146000038429915

Button:

“View Waybill”

--------------------------------------------------
LIVE ROUTE MAP
--------------------------------------------------

Below:

“Shipment Route”

Create a clean map card.

Do NOT require Google Maps.

Use a styled simulated map.

Route:

Dallas
→ Phoenix
→ Los Angeles
→ Pacific Grove

Completed route:
DHL red.

Remaining:
dashed gray.

Current location:
prominent marker.

Add small truck/courier icon.

Button:

“View Larger”

Label somewhere subtle:

“Route progress”

Do not say exact GPS.

--------------------------------------------------
FLOATING SUPPORT ON TRACKING
--------------------------------------------------

Tracking Result AND Tracking Timeline must show floating support button.

--------------------------------------------------
06 — NAVIGATION DRAWER
--------------------------------------------------

Rebuild drawer with a very clean white layout.

Mobile:

85% width.

Background content dimmed.

Header:

DHL logo.

Close icon.

Profile area:

simple circular user icon.

Guest

“Track and manage shipments”

Navigation:

Home

Track Shipment

Send Shipment

Customer Support

Service Points

Notifications

Settings

Help Center

Use simple 20–22px line icons.

Each item approximately 52px high.

Active item:

very light DHL yellow background.

Small red vertical accent.

Do NOT use giant cards inside sidebar.

Bottom:

Sign In / Create Account

as a subtle secondary option.

--------------------------------------------------
07 — SUPPORT TRACKING-ID ENTRY
--------------------------------------------------

This MUST EXIST.

Clicking either:

floating support

Support navigation

Customer Support card

must open this interface.

This is a PRESENTATION PROTOTYPE.

NO REAL AUTHENTICATION.

NO API VALIDATION.

ANY NON-EMPTY INPUT MUST BE ACCEPTED.

Examples:

123

ABC

TEST01

JD00001

all work.

Empty:
show error.

--------------------------------------------------
SUPPORT GATE DESIGN
--------------------------------------------------

Mobile:

use a clean bottom-sheet/full-screen hybrid.

Do NOT use a generic centered desktop form card on mobile.

Header:

back

DHL logo/title.

Large minimal visual:

support headset
shipment box
small shield

Keep illustration refined, not cartoonish.

Heading:

“Connect to Shipment Support”

Text:

“Enter your tracking ID to start a conversation about your shipment.”

Input label:

Tracking number

Placeholder:

“Enter tracking number”

CTA:

“Continue to Chat”

Yellow background.

Dark text.

Below:

small shield icon

“Support conversations are linked to a shipment reference.”

Interaction:

empty:
button disabled or validation.

non-empty:
button active.

click:

show:

“Connecting to shipment support…”

for approximately 700ms.

Then open chat.

--------------------------------------------------
08 — CHAT SCREEN — MUST BE BUILT
--------------------------------------------------

CRITICAL:

THE FINAL PROJECT IS NOT COMPLETE WITHOUT A FULL CHAT INTERFACE.

Do NOT omit it.

Do NOT replace it with a message saying “coming soon.”

Do NOT leave it inaccessible.

The Support Gate MUST navigate into this screen.

--------------------------------------------------
MOBILE CHAT DESIGN
--------------------------------------------------

The mobile chat should look almost like a premium native messaging application.

FULL HEIGHT.

White.

NO generic website header.

TOP SAFE AREA.

Compact header:

back arrow

center/left area:

DHL support icon

Shipment Support

small green dot

Online

Right:
optional information icon.

Immediately underneath:

thin shipment context bar.

Example:

JD0146000038429915

Verified shipment support

small:

In Transit

Do NOT make this bar huge.

--------------------------------------------------
CHAT MESSAGES
--------------------------------------------------

Conversation background:

#F8F9FA
or white with extremely subtle separation.

CUSTOMER BUBBLES:

right aligned.

DHL Yellow:
#FFCC00

Text:
#191919.

Radius:
18px 18px 4px 18px.

SUPPORT:

left aligned.

Background:
#ECEEF1

Text:
#191919.

Radius:
18px 18px 18px 4px.

Maximum bubble width:
approximately 78%.

Spacing between related messages:
6–8px.

Different sender:
16–20px.

Timestamp:
12px muted.

--------------------------------------------------
CHAT AVATAR
--------------------------------------------------

Use a minimal circular DHL support mark/headset icon.

DO NOT use fake human faces.

--------------------------------------------------
CHAT CONTENT
--------------------------------------------------

Prepopulate the chat for presentation.

CUSTOMER:

“Hi, can you please tell me the current status of my shipment?”

SUPPORT:

“Hello 👋 Thanks for reaching out. I’ve checked the latest updates for your shipment.”

Then insert a SHIPMENT STATUS CARD inside the conversation.

The embedded card:

white surface

border

radius 16px.

Top:

parcel icon

JD0146000038429915

In Transit · 1 Piece

Button:
View Details

Then mini timeline:

09:42

Shipment is out with courier for delivery

Los Angeles, CA

07:51

Arrived at delivery facility

Los Angeles, CA

21:04

Processed at sorting facility

San Bernardino, CA

Do NOT make the embedded card too tall.

SUPPORT:

“Your shipment is currently with our courier and is scheduled for delivery today. We’ll keep you updated if anything changes.”

CUSTOMER:

“Great, thank you!”

--------------------------------------------------
CHAT COMPOSER
--------------------------------------------------

Must remain fixed at bottom.

Respect iOS Home Indicator.

White composer container.

Thin top border.

Paperclip button.

Rounded message field:

“Type your message…”

Circular red send button.

White paper-plane icon.

Message input supports multiline.

Pressing Send:

add message.

Clear input.

Show:

Delivered

Then after short delay:

“DHL Support is typing…”

animated three dots.

Then hide typing indicator.

The chat should be SCROLLABLE.

Newest content should scroll into view.

--------------------------------------------------
DESKTOP CHAT
--------------------------------------------------

Desktop chat must NOT simply be an enormous mobile chat.

Use premium two-column layout.

Main conversation:
approximately 68%.

Right context panel:
approximately 32%.

Right context contains:

SHIPMENT

JD0146000038429915

In Transit

Expected Delivery
Wednesday, 10 March

Destination
Pacific Grove, CA

Latest Update
Out with courier for delivery

small route map

button:
View Full Tracking

Keep entire chat app centered.

Max width:
approximately 1180–1240px.

Height:
approximately calc(100vh - 48px).

Radius:
20px.

Subtle shadow.

--------------------------------------------------
09–11 SEND SHIPMENT PLACEHOLDER FLOW
--------------------------------------------------

DO NOT build shipping form.

The real shipping flow is intentionally not ready.

When Send Shipment clicked:

SHOW LOADING.

Minimal logistics illustration.

Heading:

“Preparing shipment services…”

Copy:

“Please wait while we connect you to DHL shipment services.”

Smooth spinner.

Loading bar.

Approximately 10 seconds.

Then:

“We’re having trouble connecting.”

CTA:

Try Again

secondary:

Back to Home

Retry:

loading again.

Then:

“Shipment services are temporarily unavailable.”

“We are currently experiencing server issues. Please try again in approximately 5 minutes.”

CTA:
Try Again.

Secondary:
Back to Home.

Use one sophisticated central state.

Do not overcrowd.

--------------------------------------------------
12 — SETTINGS SCREEN
--------------------------------------------------

CREATE/REDESIGN A REAL SETTINGS SCREEN.

It must match the minimal design language.

Header:

back

Settings

Sections:

NOTIFICATIONS

Shipment Updates
toggle

Delivery Alerts
toggle

Support Messages
toggle

GENERAL

Language
English

Region
United States

Time Display
Local shipment time

PRIVACY & SUPPORT

Privacy

Terms

Help Center

ABOUT

App Version
Prototype

Do NOT create 20 settings.

Do NOT create complex account security because this is mainly a guest prototype.

Use white background.

Settings groups:

light section labels

rows separated by extremely subtle lines.

iOS-style switches.

DHL red or yellow active switch depending on readability.

No giant cards for every setting.

--------------------------------------------------
13 — PACKAGE IMAGE PREVIEW
--------------------------------------------------

Full-screen sheet mobile.

Desktop modal.

Header:

Package Image

Close.

Large realistic package photo.

Below:

JD0146000038429915

1 Piece

2.5 kg

30 × 20 × 15 cm

Uploaded:
08 March

Keep simple.

--------------------------------------------------
14 — WAYBILL PREVIEW
--------------------------------------------------

Clean document preview.

Header:

Waybill

Document sheet centered.

DHL branding.

Fields:

Tracking Number

Shipment Date

Sender

Recipient

Origin

Destination

Weight

Pieces

Reference

Bottom:

Download Waybill

Do NOT reproduce a real customer's private document.

Use fictional prototype data.

--------------------------------------------------
15 — EXPANDED SHIPMENT MAP
--------------------------------------------------

Create a proper expanded map.

Header:

Shipment Location

Map takes majority of viewport.

Route points.

Current marker.

Destination.

Bottom sheet/card:

In Transit

Last updated:
09:42 AM

Current location:
Los Angeles, CA

Next:
Pacific Grove, CA

Do NOT label it “Exact Live GPS.”

--------------------------------------------------
DESKTOP HOME REDESIGN
--------------------------------------------------

Desktop should use additional space elegantly.

HEADER:

yellow DHL brand strip or white professional header with DHL identity.

DHL logo left.

Navigation:

Track
Send Shipment
Support
Service Points

Right:

notification
Sign In

HOME HERO:

Two-column or integrated composition.

LEFT:

Hello, Guest

Track your DHL Express shipment

copy

large tracking search.

RIGHT:

large realistic DHL logistics visual.

OR use a wide image card.

Avoid massive flat yellow page backgrounds.

Below:

quick actions in horizontal cards.

The result should look significantly more premium than a basic corporate DHL page.

--------------------------------------------------
DESKTOP TRACKING
--------------------------------------------------

Tracking Result:

main summary left/center.

shipment context right where useful.

Tracking Timeline:

LEFT 60–65%:
timeline.

RIGHT 35–40%:

package image
waybill
route map
shipment details

Keep floating support bottom-right.

--------------------------------------------------
TABLET
--------------------------------------------------

Tablet should adapt naturally.

Do NOT create desktop squeezed into 768px.

Use:

wider single column
or selective two-column cards.

--------------------------------------------------
IMAGE RULES
--------------------------------------------------

Replace generic unsuitable photography.

Use logistics imagery appropriate to DHL:

cargo aircraft
freight warehouse
delivery vehicle
packages
airport cargo
shipping facilities

Avoid:

random passenger airplane photos
generic office stock photography
fake employees
cartoon warehouses

Use realistic photography.

Ensure images have proper cropping.

--------------------------------------------------
DHL LOGO
--------------------------------------------------

If a real DHL logo asset is available in the imported project, USE IT.

Do NOT recreate the DHL wordmark poorly using CSS text.

If there is no proper asset, create a dedicated replaceable Logo component/placeholder so a real SVG can be inserted later.

Do not use a distorted imitation.

--------------------------------------------------
NAVIGATION / ROUTING
--------------------------------------------------

Every screen must be accessible in the prototype.

Required navigation:

Welcome
→ Home

Home Tracking
→ Tracking Result

Home Track Shipment
→ Search

Search
→ Tracking Result

Tracking Result
→ Timeline

Timeline
→ Package Image

Timeline
→ Waybill

Timeline
→ Expanded Map

Floating Support
→ Support Gate

Customer Support
→ Support Gate

Support Gate + any non-empty ID
→ Chat

Chat View Details
→ Timeline

Send Shipment
→ Loading
→ Connection Error
→ Retry
→ Server Error

Hamburger
→ Drawer

Drawer Settings
→ Settings

Drawer Home
→ Home

Bottom Home
→ Home

Bottom Track
→ Search

Bottom Support
→ Support Gate

--------------------------------------------------
VERY IMPORTANT:
SUPPORT INPUT LOGIC
--------------------------------------------------

For this prototype:

functionally accept ANY non-empty tracking ID.

DO NOT validate format.

DO NOT call an API.

DO NOT reject random IDs.

The purpose is to present the chat flow.

If user enters:

123

and presses Continue:

OPEN CHAT.

If:

ABC123

OPEN CHAT.

Use entered ID inside chat header where possible.

--------------------------------------------------
MICRO-INTERACTIONS
--------------------------------------------------

Use subtle:

180–280ms transitions.

Drawer:
slide from left.

Support sheet:
fade + slide up.

Modal:
fade/scale.

Button:
small press state.

Chat message:
fade + translateY 4px.

Floating chat:
very subtle hover lift desktop.

Cards:
minimal hover.

Do NOT animate entire pages dramatically.

--------------------------------------------------
LOADING EXPERIENCE
--------------------------------------------------

Use proper loading skeleton/spinner.

Do not show browser-style loaders.

No giant spinner.

--------------------------------------------------
ACCESSIBILITY
--------------------------------------------------

Maintain contrast.

Never yellow text on white.

Use:

black on yellow.

white on red.

Dark text on white.

Minimum mobile target:
44 × 44px.

Provide visible keyboard focus states desktop.

--------------------------------------------------
REMOVE OR AVOID
--------------------------------------------------

Remove designs that create:

massive yellow empty backgrounds

generic centered marketing cards

huge pill buttons

overuse of red

random gradient blobs

excessive decorative circles

overly rounded everything

large unnecessary illustrations on tracking pages

unnecessary “secure” branding everywhere

tiny metadata

generic dashboard charts

advertising

promotional banners

quotes

payment

booking

e-commerce

analytics

AI assistant

--------------------------------------------------
DESIGN QUALITY CHECK
--------------------------------------------------

BEFORE DECLARING THE TASK COMPLETE, inspect each required screen manually.

Ask:

1. Does onboarding match a premium logistics experience?

2. Is Home tracking-first?

3. Is the hero card visually sophisticated?

4. Is the floating support button visible?

5. Can any random non-empty ID enter chat?

6. DOES THE CHAT SCREEN ACTUALLY EXIST AND RENDER?

7. Is chat polished on MOBILE?

8. Is chat redesigned appropriately on DESKTOP?

9. Is Tracking Result easy to scan?

10. Does Tracking Timeline contain:
package image
waybill
route map?

11. Does sidebar contain Settings?

12. Is Settings properly designed?

13. Is Send Shipment intentionally unavailable rather than accidentally broken?

14. Are all screens responsive?

15. Does the interface feel like one coherent design system?

If ANY answer is NO, continue working.

--------------------------------------------------
DO NOT STOP AFTER HOME PAGE
--------------------------------------------------

This is extremely important.

Do not spend most of the work on:

Welcome
Home
Tracking

and omit Support Chat.

Complete the entire requested prototype.

CHAT IS A REQUIRED PRIMARY SCREEN.

SETTINGS IS A REQUIRED SCREEN.

TIMELINE DETAILS ARE REQUIRED.

--------------------------------------------------
CODE QUALITY
--------------------------------------------------

Since this is Figma Make code:

keep components modular.

Suggested structure if refactoring is useful:

components/
  Header
  BottomNav
  FloatingSupport
  Drawer
  TrackingInput
  ProgressTracker
  Timeline
  ShipmentCard
  RouteMap
  ChatBubble
  ChatComposer
  StatusBadge

screens/
  Welcome
  Home
  Search
  TrackingResult
  TrackingTimeline
  SupportGate
  Chat
  SendShipment
  Settings

Do not put the entire application into one extremely large component if it can be cleanly separated.

Do not destroy currently functioning prototype interactions unnecessarily.

--------------------------------------------------
FINAL EXPECTATION
--------------------------------------------------

I want the imported project transformed into a substantially better high-fidelity DHL UI redesign.

DO NOT simply “improve” the current styling.

REBUILD any screen that does not meet this specification.

The visual priority order is:

1. Home Dashboard
2. Shipment Support Chat
3. Tracking Timeline
4. Tracking Result
5. Onboarding
6. Support ID Gate
7. Sidebar
8. Search
9. Settings
10. Send Shipment states

The final prototype must feel:

minimal
expensive
mature
fast
clean
DHL-branded
presentation-ready
iOS-quality on mobile
professionally responsive on desktop.

DO NOT declare completion until all required screens, navigation paths, responsive layouts and chat interactions have been implemented and verified.