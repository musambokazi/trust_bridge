# Bank branding and reference data

Bank names were checked on 15 November 2026 against the SARB registered-bank,
CODI member-bank and mutual-bank registers. Postbank is also available. Foreign
representative offices and liquidated banks are excluded. Bank coverage is a
maintained snapshot, not a bank-verification service.

- https://www.resbank.co.za/en/home/what-we-do/Prudentialregulation/sa-registered-banks-and-representative-offices
- https://www.resbank.co.za/en/home/what-we-do/Deposit-insurance/member-banks0
- https://apim.nedbank.co.za/static/docs/verification-bankidentifiers
- https://gotyme.co.za/ (current GoTyme name/logo, formerly TymeBank)
- https://enlbank.co.za/ (current eNL name/logo, formerly YWBN)

`source-catalog.json` records the source of each logo. SVG originals are retained
where available. Some banks publish raster artwork only; their source URLs are recorded and
resized PNG copies are retained. The native app uses locally bundled PNG renditions, so branding remains
available offline without adding an SVG native dependency or requiring a new APK.
These are bank-owned marks shown to identify choices, not evidence of a banking
partnership or independent verification. OM Bank uses the Old Mutual group emblem.

Only branch codes present in the linked bank documentation are suggested. Other
banks require manual branch-code entry. Codes remain strings to preserve leading
zeroes. Selecting a bank never changes the account/payment reference.

OSK is listed by name only: an authoritative standalone bank logo could not be verified. The council-site banknote photograph was rejected rather than presented as a logo.

Display renditions use transparent canvases instead of white backing plates.
Definition/clip-path rectangles and genuine white mark details are retained.
Raster-only sources have connected near-white backing removed; neutral dark
ink uses a white display rendition for contrast on the app's dark surfaces.
SVG sources retain their original mark colours; native PNGs are the dark-surface
renditions. These display treatments do not imply endorsement.
