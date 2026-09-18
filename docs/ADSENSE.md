# AdSense setup

Set these variables in the root `.env` or frontend hosting environment:

```env
ADSENSE_ENABLED=true
ADSENSE_CLIENT_ID=ca-pub-YOUR_16_DIGIT_ID
ADSENSE_HOME_TOP_SLOT=YOUR_10_DIGIT_SLOT
ADSENSE_HOME_BOTTOM_SLOT=YOUR_10_DIGIT_SLOT
ADSENSE_ARTICLE_INLINE_SLOT=YOUR_10_DIGIT_SLOT
ADSENSE_ARTICLE_BOTTOM_SLOT=YOUR_10_DIGIT_SLOT
ADSENSE_PUBLIC_BOTTOM_SLOT=YOUR_10_DIGIT_SLOT
ADSENSE_ARTICLE_LEFT_TOP_SLOT=YOUR_10_DIGIT_SLOT
ADSENSE_ARTICLE_LEFT_BOTTOM_SLOT=YOUR_10_DIGIT_SLOT
ADSENSE_ARTICLE_RIGHT_TOP_SLOT=YOUR_10_DIGIT_SLOT
ADSENSE_ARTICLE_RIGHT_BOTTOM_SLOT=YOUR_10_DIGIT_SLOT
ADSENSE_ARTICLE_FOOTER_SLOT=YOUR_10_DIGIT_SLOT
ADSENSE_ARTICLE_LEFT_EXTRA_SLOT=YOUR_10_DIGIT_SLOT
ADSENSE_ARTICLE_RIGHT_EXTRA_SLOT=YOUR_10_DIGIT_SLOT
```

Create responsive Display ad units in AdSense and copy their IDs. Leave any slot
blank to omit that placement. Restart/rebuild after changing configuration.
The homepage has two placements: after the lead stories and near the footer.
Articles have a bottom placement after 200 words, plus one inline placement
after paragraph four when at least eight paragraphs exist. Ads are labelled,
loaded near the viewport, and excluded from admin/login pages. Disabled or
unconfigured placements render no empty ad space. There is no automatic refresh.

The public-bottom unit appears on category, latest news, search, reporter,
e-paper, live TV and informational pages. Admin, login and authentication routes
are excluded, including client navigation. Homepage and article pages retain
their own placements without an extra global ad. Ads are hidden when printing.

Articles of at least 200 words can show configured left/right ad columns on
screens 1400px and wider. Second rail ads require 600 words, and the additional
post-author footer placement requires 500 words. Below 1400px, the left rail is
hidden and the right rail moves below the article. Each blank slot removes its
position entirely. Side units are responsive display units in columns up to
300px wide. Do not turn on every position for short articles; use the actual
AdSense preview and reports to adjust density after approval.

Register and approve the production domain in your own AdSense account. Check
`https://YOUR-DOMAIN/ads.txt`; it is generated from the publisher ID. With manual
placements, disable Auto ads initially in AdSense to avoid doubling ad density.
Ad fill, account approval, reporting and Auto ads controls are managed by Google,
not by this application. Don't click your own ads while testing.

Before enabling ads for visitors, configure Google's required consent flow for
the regions you serve through AdSense Privacy & messaging. This integration
does not include a consent management platform. Keep ads disabled until the
appropriate consent configuration is ready.

Google documentation:
- https://support.google.com/adsense/answer/1346295
- https://support.google.com/adsense/answer/9183460
