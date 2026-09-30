# DESIGN.md: Pinwheel Heating, Air & Plumbing (concept)

Concept site by Ben Young Web Design. Everything here is sample data for a fictional business.

This is the plan. Tokens, wireframes, and every word of copy were written before any page code. Build around this document. If the site and this file disagree, update this file.

---

## 1. Brand

| Item | Value |
|---|---|
| Name | **Pinwheel Heating, Air & Plumbing** (short: Pinwheel) |
| Why the name | The Altamont Pass windmills are the first thing you see coming home to Tracy. A pinwheel is moving air, which is the whole job. Two warm blades and two cool blades make it a heating and cooling mark. |
| Name check | "Delta Breeze Heating & Air" is a real HVAC company in Oakley, CA, about 30 miles from Tracy, and another "Delta Breeze" operates in Orangevale. Too close, so we did not use it. Web searches found no "Pinwheel" heating, air, or plumbing business. Ben should still confirm before showing it widely (web search is not a trademark search). |
| Phone | (209) 555-0142. Calls use `tel:+12095550142`. Text uses `sms:+12095550142`. |
| License | CSLB #000000 (placeholder) |
| Address | Street address placeholder, Tracy, CA 95376 |
| Hours | Mon to Sat, 7am to 7pm. Emergency line 24/7. |
| Cities | Tracy (home base), Mountain House, Manteca, Lathrop, Stockton, Livermore |
| Owners | Luis and Carmen Ortega (illustrative names), family owned since 2010 |
| Voice | Plain, confident, local. Short sentences. No em dashes. No filler. Buttons say what happens. |

### Design idea: "Sunny valley modern"
- Warm light gray page, white cards, deep navy bands for contrast, bold red-orange for action.
- Ice blue shows up only when we talk about cooling (AC tiles, snowflake icons, the cool blades of the logo).
- One California signature: photos sit inside a **mission arch** (rounded top), a nod to the stucco and tile-roof homes across the valley.
- Headline accents: one key phrase per headline in brand orange with a hand-drawn underline.
- Motion is small and useful: hover lift, header compacting, count-up stats, accordion easing. CSS transitions only. All of it turns off under `prefers-reduced-motion`.

---

## 2. Design tokens

All tokens live at the top of `css/site.css` as custom properties.

```css
:root {
  /* Color: brand */
  --c-brand: #E4572E;         /* bold warm red-orange. Graphics, icons, big display accents */
  --c-brand-strong: #D1441C;  /* button fill behind white text (4.6:1) */
  --c-brand-hover: #B93A16;   /* button hover */
  --c-brand-deep: #B5391A;    /* orange text on light backgrounds (5.3:1 on --c-bg) */
  --c-brand-tint: #FDE8DF;    /* soft orange wash */

  /* Color: navy */
  --c-navy: #14213D;          /* contrast bands, headings */
  --c-navy-2: #1C2D52;        /* raised navy surface */
  --c-navy-3: #2B3F6B;        /* borders on navy */

  /* Color: neutrals (warm) */
  --c-bg: #F6F3EF;            /* light warm gray page */
  --c-bg-alt: #EEE9E2;        /* alternate section */
  --c-surface: #FFFFFF;       /* cards */
  --c-line: #E2DBD1;          /* hairlines */
  --c-text: #26314D;          /* body text (11.6:1 on --c-bg) */
  --c-muted: #5A6275;         /* secondary text (5.5:1 on --c-bg) */

  /* Color: cooling moments only */
  --c-ice: #8FD3FF;           /* on navy */
  --c-ice-tint: #E3F3FD;      /* cooling card wash */
  --c-ice-deep: #0A5F8C;      /* ice text on light (6.9:1 on white) */

  /* Color: utility */
  --c-star: #FBBC04;          /* review stars */
  --c-success: #16794C;
  --c-focus: #1A73E8;         /* focus ring, visible on light and navy */

  /* Spacing: 8px scale (4px half step for fine tuning) */
  --sp-05: 4px;  --sp-1: 8px;   --sp-2: 16px;  --sp-3: 24px;
  --sp-4: 32px;  --sp-5: 40px;  --sp-6: 48px;  --sp-8: 64px;
  --sp-10: 80px; --sp-12: 96px; --sp-14: 112px; --sp-16: 128px;
  --section-y: clamp(4rem, 2.886rem + 4.571vw, 7rem); /* 64px at 390 to 112px at 1440 */

  /* Type: families */
  --ff-display: "Plus Jakarta Sans", "Inter", system-ui, sans-serif; /* 800 for headlines */
  --ff-body: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;

  /* Type: fluid scale, min at 390px, max at 1440px */
  --fs-xs:   clamp(0.75rem, 0.727rem + 0.095vw, 0.8125rem);  /* 12 to 13 */
  --fs-sm:   clamp(0.875rem, 0.852rem + 0.095vw, 0.9375rem); /* 14 to 15 */
  --fs-base: clamp(1rem, 0.977rem + 0.095vw, 1.0625rem);     /* 16 to 17 */
  --fs-md:   clamp(1.125rem, 1.079rem + 0.19vw, 1.25rem);    /* 18 to 20 */
  --fs-lg:   clamp(1.25rem, 1.157rem + 0.381vw, 1.5rem);     /* 20 to 24 */
  --fs-xl:   clamp(1.5rem, 1.361rem + 0.571vw, 1.875rem);    /* 24 to 30 */
  --fs-2xl:  clamp(1.75rem, 1.471rem + 1.143vw, 2.5rem);     /* 28 to 40, H2 */
  --fs-3xl:  clamp(2.375rem, 1.679rem + 2.857vw, 4.25rem);   /* 38 to 68, H1 */
  --lh-tight: 1.08; --lh-snug: 1.2; --lh-body: 1.6;

  /* Shape */
  --r-sm: 8px;      /* inputs, small chips */
  --r-card: 14px;   /* cards */
  --r-lg: 24px;     /* big panels */
  --r-pill: 999px;  /* buttons, pills */
  --r-arch: 999px 999px var(--r-lg) var(--r-lg); /* mission arch photo frame */

  /* Shadows: layered and soft (navy tinted, never gray-black) */
  --shadow-1: 0 1px 2px rgb(20 33 61 / .06), 0 2px 8px rgb(20 33 61 / .06);
  --shadow-2: 0 2px 4px rgb(20 33 61 / .05), 0 10px 24px rgb(20 33 61 / .09);
  --shadow-3: 0 4px 10px rgb(20 33 61 / .06), 0 24px 48px rgb(20 33 61 / .16);

  /* Layout */
  --max: 1200px;
  --gutter: clamp(16px, 0.5rem + 2vw, 32px);
  --header-h: 64px;         /* 76px at 900px and up. The bar shrinks to 64px once you scroll */
  --bar-h: 64px;            /* mobile sticky bar (plus safe area) */

  /* Motion */
  --ease: cubic-bezier(.2, .7, .2, 1);
  --t-fast: 150ms; --t-med: 250ms; --t-slow: 450ms;
}
```

### Contrast checks (AA)
| Pair | Ratio | Use |
|---|---|---|
| White on `--c-brand-strong` #D1441C | 4.6:1 | Primary buttons |
| `--c-brand-deep` #B5391A on `--c-bg` | 5.3:1 | Orange text links, eyebrows |
| `--c-text` #26314D on `--c-bg` | 11.6:1 | Body |
| `--c-muted` #5A6275 on `--c-bg` | 5.5:1 | Secondary text |
| White on `--c-navy` #14213D | 16:1 | Navy bands |
| `--c-ice` #8FD3FF on `--c-navy` | 9.8:1 | Cooling accents on navy |
| `--c-brand` #E4572E on `--c-navy` | 4.3:1 | Large display text and icons only (3:1 rule) |

Rule: `--c-brand` #E4572E is never used for small text. Small orange text uses `--c-brand-deep`.

### Icons
Custom inline SVG line icons in one sprite, 24px grid, `stroke-width: 2`, round caps and joins, `stroke: currentColor`. One weight everywhere.

### Breakpoints (mobile first)
- Base: 0 to 599px (designed at 390px)
- `600px`: large phones and small tablets
- `900px`: tablet landscape and up. Desktop nav, two-column layouts.
- `1200px`: wide desktop (designed at 1440px, content capped at 1200px)

---

## 3. Components

| Component | Notes |
|---|---|
| Button | Pill, 52px tall (44px min on compact). Primary: orange fill, white text. Secondary: white fill, navy text, hairline. Ghost on navy: white text, white 30% border. Icon left. Hover lifts 2px with a deeper shadow. |
| Sample tag | Tiny pill: "Illustrative", "Sample pricing", "Example only", "Sample data". Muted text on a dashed hairline. Same look everywhere so honesty reads as a design system, not an apology. |
| Concept pill | "Concept site by Ben Young Web Design. Sample data." In flow at the top of every page hero and again in the footer. Never fixed, never covers anything. |
| Card | White, 14px radius, `--shadow-1`, hover `--shadow-2` plus 2px lift when it is a link. |
| Chip radio | Radio input with a pill label. 44px min height. Checked state is navy fill. Used by the estimator, helper, and booking. |
| Arch photo | Photo inside `--r-arch`. Always has width, height, and a warm background color while loading. |
| Stat | Big Jakarta number that counts up once when it enters the viewport. |
| Accordion | WAI-ARIA pattern: `h3 > button[aria-expanded]` controlling a region. Content is visible without JS. |
| Dialog | Native `<dialog>` for booking. Full-height sheet on phones, centered card on desktop. |
| Demo confirmation | Green check, summary, and the line: "This is a demo. On a live site, this goes straight to the owner's phone." |

---

## 4. Homepage wireframes

Every section has one job. If a block does not help that job, it goes.

### 1. Seasonal offer bar
- **Job:** Give a timely reason to call now.
- **Phone (390):** Full-width navy strip, one line of 14px text that wraps to two lines at most, "Book my check" text link, 44px close button on the right.
- **Desktop (1440):** Centered single line, link inline, close button at the far right.
- **Copy:** "Fall furnace safety check $89. Members free." Link: "Book my check". Tag: "Sample offer".
- Dismiss hides it and remembers the choice in this browser (try/catch around storage).

### 2. Header
- **Job:** Make calling or booking possible from anywhere, in one tap.
- **Phone:** 64px bar. Logo left. Round call button (44px) and menu button (44px) right. Menu opens a full-height panel with big links, a Call button, a Book button, and hours. Book lives in the sticky bottom bar on phones.
- **Desktop:** 72px bar, compacts to 64px with a shadow after scrolling. Logo left. Nav center: Services (menu), Membership, Financing, Service Areas (menu), Reviews. Right: phone number with icon, then "Book Online" button.
- Services and Service Areas open small disclosure panels (button with `aria-expanded`), not hover menus.

### 3. Hero
- **Job:** In five seconds, say who we are, where we work, and how to reach us.
- **Phone:** Concept pill, eyebrow, H1 (3 to 4 lines), subhead naming all six cities, full-width Call now and Book online buttons stacked, one-line reassurance, Google rating badge, then the arch photo with a "Next opening" chip.
- **Desktop:** Two columns, 55/45. Text left. Arch photo right with a soft sun glow behind it, the rating badge floating on the lower left of the photo and the "Next opening" chip on the upper right.
- **H1:** "A comfortable home, without the runaround."

### 4. Trust strip
- **Job:** Remove the "can I trust these people?" doubt right away.
- **Phone:** Navy band. The five promises as a 2-column list of check items. Three count-up stats in a row below.
- **Desktop:** Five promises in one row with icons. Divider. Three large count-up stats in a row.
- **Promises:** Licensed, Insured, Family owned, Upfront pricing, Satisfaction guarantee.

### 5. Reviews
- **Job:** Let neighbors do the selling.
- **Phone:** Heading, rating summary, sideways scroll of review cards (85% width, snap), a swipe hint.
- **Desktop:** Heading left, prev/next buttons right. Cards 3.2 across so the row visibly scrolls.
- **H2:** "Neighbors say it better than we can." Label: "Illustrative reviews".

### 6. Services (bento)
- **Job:** Show we fix everything they might need, and route them to the right page.
- **Phone:** AC repair and Water heaters as full-width photo tiles. The other six as a 2-column grid of icon tiles.
- **Desktop:** 4-column bento. AC repair spans 2x2 with a photo. Heating and Heat pumps fill the top right. Water heaters spans 2 wide with a photo. Drains, Leak repair, Repiping, Indoor air quality across the bottom.
- Cooling tiles use the ice tint. Heating tiles use the orange tint. Plumbing tiles stay white.
- **H2:** "One call for heating, air, and plumbing."

### 7. Instant price estimator
- **Job:** Give shoppers a real number so they book the in-home quote with us instead of calling around.
- **Phone:** Three stacked questions as chip radios, "Get my price" button, result card appears below and scrolls into view.
- **Desktop:** Questions left (7 columns), sticky result card right (5 columns) with an empty state until they answer.
- **H2:** "What will a new system cost?" Label: "Sample pricing".

### 8. Membership block
- **Job:** Turn one-time callers into members.
- **Phone:** Navy band. Membership card graphic first, then heading, price, three benefits, button.
- **Desktop:** Two columns. Copy and benefits left, tilted membership card right.
- **H2:** "Skip the line when it's 105 outside."

### 9. Financing block
- **Job:** Make a big purchase feel doable today.
- **Phone:** Heading, slider for project cost, term chips, big monthly payment, fine print, button.
- **Desktop:** Two columns. Copy left, calculator card right.
- **H2:** "Comfort now. Easy monthly payments." Label: "Example only".

### 10. Meet the owner and team
- **Job:** Put a face on the company.
- **Phone:** Arch portrait, name and role, short story, pull quote, team photo, three proof chips, link.
- **Desktop:** Portrait left in an arch, story and quote right, team photo band below.
- **H2:** "Local owners who still answer the phone."

### 11. Service areas map
- **Job:** Confirm "yes, we come to you" and link the city pages.
- **Phone:** Heading, the SVG map full width, then a 2-column list of the six cities (Tracy and Mountain House link to their pages).
- **Desktop:** Map left (7 columns), list and note right (5 columns).
- **H2:** "Close by, so we get there fast."

### 12. FAQ
- **Job:** Answer the last objections before they call.
- **Phone:** Single column accordion, 8 questions.
- **Desktop:** Heading and a small call card left (4 columns), accordion right (8 columns).
- **H2:** "Straight answers to common questions."

### 13. Final call band and footer
- **Job:** One last, easy way to act. Then the facts.
- **Phone:** Orange band, heading, stacked Call, Book, and Text buttons. Footer stacks: logo and blurb, contact and hours, link groups, concept pill, credits.
- **Desktop:** Band with heading left and buttons right. Four-column footer.
- **H2:** "Need help today? A real person picks up."

### 14. Mobile sticky bar
- **Job:** Keep Call, Book, and Text one thumb-tap away.
- **Phone only (under 900px):** Fixed bottom bar, three equal buttons, 64px plus `env(safe-area-inset-bottom)`. The page gets matching bottom padding so the bar never covers content. The chat bubble sits above the bar.

---

## 5. Copy deck

Word target for homepage body copy: 700 to 900 (reviews, nav, and footer not counted).

### Global
- Concept pill: "Concept site by Ben Young Web Design. Sample data."
- Footer credit: "Concept by Ben Young Web Design."
- Demo form confirmation: "This is a demo. On a live site, this goes straight to the owner's phone."
- Footer blurb: "Family-owned heating, air, and plumbing for San Joaquin County and the Tri-Valley since 2010."
- Footer fine print: "Pinwheel Heating, Air & Plumbing is a fictional business. Reviews, names, numbers, and prices on this site are illustrative."
- Sticky bar: "Call", "Book", "Text"

### Homepage

**Offer bar:** Fall furnace safety check $89. Members free. [Book my check]

**Hero**
- Eyebrow: Family owned in Tracy since 2010
- H1: A comfortable home, *without the runaround.*
- Sub: Same-day heating, air, and plumbing repair for Tracy, Mountain House, Manteca, Lathrop, Stockton, and Livermore. You see the price before we start. Every time.
- Buttons: [Call now] [Book online]
- Reassurance: A real person answers 7am to 7pm. Emergency line 24/7.
- Badge: 4.9, 186 Google reviews (Illustrative)
- Photo chip: Next opening today, 2 to 5 pm

**Trust strip**
- Licensed: CSLB #000000
- Insured: Bonded and fully covered
- Family owned: Local since 2010
- Upfront pricing: Your price before we start
- Satisfaction guarantee: We make it right
- Stats (Illustrative): 16 years in the valley. 8,400+ homes helped. 97% on-time arrivals.

**Reviews** (Illustrative reviews)
- H2: Neighbors say it better *than we can.*
- Sub: 4.9 stars from 186 Google reviews.
1. Maria G., Tracy, 2 weeks ago: "Our AC quit on a 108 degree day. A tech was here by 3 and the house was cool by dinner. He showed me the price on his tablet before he touched anything."
2. Derek S., Mountain House, 1 month ago: "Water heater started leaking on a Sunday. They answered, came out, and had a new one in by Monday at noon. Fair price and zero mess."
3. Priya R., Tracy, 3 weeks ago: "Another company said we needed a whole new system. Pinwheel found a bad capacitor and fixed it for a fraction of that. Honest people."
4. Tom W., Manteca, 2 months ago: "Our kitchen drain backed up for weeks. Andre cleared it in half an hour and showed us the camera video so we knew what caused it."
5. Angela M., Lathrop, 1 week ago: "We joined the Comfort Club after our tune-up. Getting the first slot during the July heat wave paid for the whole year."
6. Kevin L., Stockton, 5 days ago: "On time, shoe covers on, clean van. He walked me through three options with zero pressure. Easy five stars."
7. Rosa T., Livermore, 3 months ago: "They repiped our 1970s house in two days. The drywall patches are so clean we can't find where they cut."
8. Jason P., Tracy, 4 weeks ago: "Financing made the heat pump doable for us. Our power bill dropped the very first month."

**Services**
- Eyebrow: Services
- H2: One call for heating, *air, and plumbing.*
- Sub: The same trained techs and the same upfront pricing on every job, big or small.
- AC repair: Cool again fast. Most repairs are done in one visit.
- Heating: Furnace repair, tune-ups, and new systems before the cold hits.
- Heat pumps: One quiet system that cools and heats. Lower bills all year.
- Water heaters: Tank or tankless. Most replacements are done the same day.
- Drains: Slow or stopped drains cleared, with a camera look when needed.
- Leak repair: We find hidden leaks fast and fix them with less mess.
- Repiping: Whole-home PEX or copper, with clean drywall patching.
- Indoor air quality: Filters and purifiers that help during smoke season.
- Links: See heating and cooling. See plumbing.

**Estimator** (Sample pricing)
- Eyebrow: Instant estimate
- H2: What will a new system cost?
- Sub: Answer 3 quick questions. See a real price range in seconds.
- Q1: How big is your home? Under 1,500 sq ft / 1,500 to 2,500 / 2,500 to 3,500 / Over 3,500
- Q2: What do you need? AC only / Furnace only / AC and furnace / Heat pump
- Q3: How old is your current system? Under 10 years / 10 to 15 years / Over 15 years / Not sure
- Button: Get my price
- Empty state: Your price range shows up here.
- Result: Your estimated range. [$X to $Y]. Includes equipment, install, permits, haul-away, and a 10-year parts warranty.
- Young system note: Good news. Systems under 10 years old can often be repaired. Try our repair-or-replace helper.
- Button: Book a free in-home quote
- Fine print: Sample pricing for this concept. Your real price comes from a free, no-pressure visit.

Pricing model (sample): base for 1,500 to 2,500 sq ft. AC only $6,800 to $9,200. Furnace only $4,900 to $7,200. AC and furnace $11,200 to $15,600. Heat pump $12,400 to $17,800. Size factor 0.85, 1.0, 1.2, 1.45. Age adds $0, $0, $600 (likely duct or electrical updates), or $300 for "not sure". Rounded to the nearest $100.

**Membership** (Sample pricing)
- Eyebrow: Comfort Club
- H2: Skip the line when it's *105 outside.*
- Sub: Members get the first open slot, two tune-ups a year, and 15% off every repair. $19 a month. Cancel anytime.
- Priority service: You move to the front of the line, even during a heat wave.
- 2 tune-ups a year: AC in spring, furnace in fall. We catch small problems early.
- Member discount: 15% off repairs and no trip fees. Ever.
- Button: Join the Comfort Club

**Financing** (Example only)
- Eyebrow: Financing
- H2: Comfort now. *Easy monthly payments.*
- Sub: Slide to your project cost and pick a term. Your example payment updates as you go.
- Labels: Project cost. Term. Estimated monthly payment.
- Fine print: Example only. 7.99% APR is for illustration. Real rates and terms depend on credit approval.
- Button: See financing options

**Team**
- Eyebrow: Meet the family
- H2: Local owners who still *answer the phone.*
- Body: Luis Ortega started Pinwheel in 2010 with one van and three promises: show up on time, give the price first, and leave the house cleaner than we found it. Today Carmen runs the office, and a crew of 14 trained techs covers six valley cities. The promises haven't changed.
- Quote: "If something isn't right, text me. I read every message." (Luis Ortega, owner)
- Proof chips: Background-checked techs. Trained every month. Shoe covers on, every visit.
- Caption: Names and photos are illustrative.
- Link: Meet the whole team

**Service areas**
- Eyebrow: Service areas
- H2: Close by, so we *get there fast.*
- Sub: Our vans start each day in Tracy and Manteca, so most homes see a tech the same day.
- List: Tracy (home base), Mountain House, Manteca, Lathrop, Stockton, Livermore
- Note: Just outside these cities? Call us. If we can get there fast, we'll come.

**FAQ**
- H2: Straight answers to *common questions.*
1. How fast can you get here? Most homes in Tracy, Mountain House, Lathrop, and Manteca get a same-day visit. Stockton and Livermore are usually same day or next morning. Members go first.
2. Do you charge a trip fee? Our diagnostic visit is $79 (sample pricing), and we waive it when you go ahead with the repair. Comfort Club members never pay it.
3. Will I know the price before you start? Yes. You approve the full price in writing before we pick up a tool. No hourly surprises.
4. Should I repair or replace my AC? Under 10 years old, a repair usually wins. Past 15 years, or when a repair costs more than a third of a new system, replacing often saves money. Our repair-or-replace helper gives you a quick answer.
5. Do you offer financing? Yes. Most homeowners qualify for monthly payments on new systems, water heaters, and repipes.
6. Are you licensed and insured? Yes. California license CSLB #000000 (placeholder), with full liability and workers' comp coverage.
7. Do you work on all brands? Yes. We service every major brand of AC, furnace, heat pump, and water heater.
8. Do you serve my area? We cover Tracy, Mountain House, Manteca, Lathrop, Stockton, and Livermore. Close by but not listed? Call and ask.

**Final band**
- H2: Need help today? A real person picks up.
- Sub: Call, text, or book online. We'll confirm your arrival window within minutes.
- Buttons: Call (209) 555-0142. Book online. Text us.

### Heating & Cooling (heating-cooling.html)
- Title: AC Repair, Heating & Heat Pumps in Tracy, CA | Pinwheel (Concept)
- H1: Cool summers. Warm winters. *Lower bills.*
- Sub: AC repair, furnace service, heat pumps, and cleaner indoor air for Tracy and five nearby cities. Same-day visits and the price before we start.
- Services: AC repair and replacement. Furnace repair and tune-ups. Heat pumps. Ductless mini-splits. Indoor air quality. Maintenance.
- Warning signs H2: Signs your system needs help. Warm air from the vents. It turns on and off every few minutes. New grinding, squealing, or banging. Ice on the copper lines. Your bill jumped and your habits didn't.
- Helper H2: Repair or replace? Get a straight answer.
- Process H2: How a visit works. 1 Book or call. 2 We text when we're on the way. 3 You approve the price. 4 We fix it and clean up.
- Local note: Valley summers top 100 degrees and afternoon wind packs dust into outdoor coils. A spring tune-up keeps your AC from working twice as hard.

### Plumbing (plumbing.html)
- H1: Plumbing fixed right, *without the mess.*
- Sub: Water heaters, drains, leaks, and repiping for Tracy and the valley. Clean techs, clear prices, and most jobs done in one visit.
- Services: Water heaters (tank and tankless). Drain cleaning. Leak detection and repair. Repiping. Fixtures and toilets. Sewer camera inspection.
- Emergency box H2: Water where it shouldn't be? Do this first. 1 Find your main shutoff, usually near the front hose bib or in the garage. 2 Turn it clockwise until it stops. 3 Call us. We answer 24/7.
- Tank vs tankless comparison: upfront cost, lifespan, space, hot water supply.
- Local note: Valley water is on the hard side. Minerals settle in tanks and shorten their life, so we flush tanks at every Comfort Club visit.

### Comfort Club (membership.html)
- H1: Skip the line. *Save all year.*
- Plans (sample pricing): Comfort Club $19/mo (1 system). Comfort Club Plus $29/mo (2 systems plus water heater flush).
- Included: 2 tune-ups a year. Priority scheduling. 15% off repairs. No trip fees. Plumbing safety check. Reminder texts.
- Math: 2 tune-ups ($258) + no trip fee ($79) + 15% off a $600 repair ($90) = $427 of value for $228 a year.
- Join form (demo): name, phone, plan, button "Join the Comfort Club".

### Financing & Offers (financing.html)
- H1: Comfort now. *Easy monthly payments.*
- Calculator (full size), 3 steps (Apply in 2 minutes with a soft credit check. Pick your plan. We install.), current offers (sample): Fall furnace safety check $89, $500 off a new heat pump, free second opinion on replacement quotes, 10% off for military, teachers, and first responders.

### About (about.html)
- H1: Family owned. *Valley raised.*
- Story, the name (Altamont windmills), four promises (On time. Price first. Clean up. Make it right.), team, clean vans, licenses, community.

### City pages
- Tracy H1: Heating, air, and plumbing in *Tracy, CA.* Local detail: 100-degree summers, afternoon wind and dust on coils, older downtown homes with galvanized pipes, newer homes in Ellis and Tracy Hills. Neighborhoods: Downtown, Redbridge, Ellis, Tracy Hills, Hidden Lake, Fair Oaks Ranch. ZIPs 95376, 95377, 95304.
- Mountain House H1: Heating, air, and plumbing in *Mountain House.* Local detail: first homes went up in the early 2000s, so many original AC systems are 18 to 22 years old. Two-story floor plans run hot upstairs. Villages: Wicklund, Altamont, Bethany, Hansen, Questa, Cordes, College Park, and The Lakes. ZIP 95391.

### Review page (review.html)
- H1: Thanks for choosing us!
- Sub: Your review helps local families find honest help. It takes about 30 seconds.
- Button: Leave a Google review
- QR: Scan to open this page on another phone.
- Secondary: Something not right? Text the owner.

### Sample report (sample-report.html)
- H1: Your website results, *September 2026*
- KPIs (Sample data): 58 calls from the website. 21 booking requests. 9 new Google reviews. 4.9 average rating. 2,140 Google profile views.
- Charts: calls by week, top city pages, where calls came from.
- What we did this month / What we'll do next month.

### 404
- H1: This page *blew away.*
- Sub: The wind took this one. Let's get you where you were going.

---

## 6. Photo plan

Real photography only (Unsplash). No AI-generated people. Credits on credits.html.

| Slot | Plan | What shipped | Where |
|---|---|---|---|
| Hero | Tech at an outdoor AC unit, bright daylight | Smiling tech in a navy jacket and cap (no free photo of a tech at a home AC unit was good enough) | Home hero, team |
| Owner | Friendly owner portrait (HTML comment marks where the real photo goes) | Owner in a work shirt in the shop | Home team, About |
| Plumber | Plumber under a sink | Plumber tightening a drain under a sink | Home bento, Plumbing |
| AC units | Outdoor condensers | Two condensers on a river rock bed | Home bento, Heating & Cooling |
| Van | Clean white service van | White van under oaks, golden light | About |
| Team | Small crew | Three single portraits (Ray, Jess, Mateo) | Home team, About, Review page |
| Stucco home | Stucco house, tile roof, sun | White stucco, red tile roof, arched entry | Tracy page |
| Suburb | Newer tidy neighborhood | Aerial of a sunny planned neighborhood | Mountain House page |
| Extras | Supporting shots | Heat pump, cozy mug, filter change, copper pipes, Altamont turbines, couple at home | Inner pages |

Spare: a smart thermostat photo sits in `scripts/photos.json` but is not on a page. Credits list only the photos in use.

Delivery: images.unsplash.com is blocked in the build container, so photos load from the Unsplash CDN with size and format parameters (`w`, `h`, `fit=crop`, focal point, `fm=webp`, `q=70`, or `q=62` at 1200px and wider) and `srcset`. The hero is art directed: a square crop on phones and a 4:5 crop on desktop, each with its own preload. Every photo has width and height set, a warm background color while loading, and lazy loading below the fold. The hero is preloaded with `fetchpriority="high"` and never wider than 1600px.

---

## 7. Speed and accessibility plan
- One CSS file, one deferred JS file. The QR library loads only on review.html.
- Two self-hosted variable WOFF2 fonts, preloaded, `font-display: swap`. Subset to Latin-1 plus common punctuation and trimmed to the weights we use (Inter 400 to 800 is 27KB, Plus Jakarta Sans 700 to 800 is 16KB). Size-adjusted fallback faces keep the layout from shifting while fonts load.
- No animation libraries. CSS transitions only. `prefers-reduced-motion` turns them off and shows final numbers.
- AA contrast (see table), visible focus ring on everything, one H1 per page, 44px minimum tap targets, skip link, landmarks, labeled forms, `aria-live` results.
- No sideways scroll at 390px: `overflow-x: clip` on the page wrapper is a safety net only. Layouts are built to fit.
