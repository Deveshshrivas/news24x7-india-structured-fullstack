# Website theme settings

Open Dashboard → Settings → Website theme. Admins and super admins can select Light, Pure Black, Charcoal, or Warm Gray and click **Apply to website**. The separate language/general-settings controls do not save the theme.

The selection is stored in MongoDB `site_settings`. Public visitors fetch it on page load, focus, and every 30 seconds. It sets the default for visitors without a saved preference. The light/dark toggle stays visible, and explicit visitor preferences win over the default. Selecting a dark palette changes the appearance of dark mode for everyone. Selecting Light preserves the last saved dark palette (Pure Black if none was saved). Until the first theme is saved, existing visitor preferences remain in effect. The initial page can briefly display the local preference while the setting loads. A failed request keeps the currently displayed theme until a later successful refresh.

The dashboard retains its own local display mode. Public pages use the selected light/dark mode; the homepage has the complete palette treatment. Existing specialized article/reader styles remain intact.

API: public `GET /appearance`, authenticated `PUT /appearance` with `{ "theme": "light|black|charcoal|warm" }` (one of these four literal values). Editors, reporters, ad managers, inactive accounts and anonymous users cannot save the setting.
