// i18n – internationalisation for Relationshape.
// Supports EN (default) and DE. Language is auto-detected from browser
// and can be overridden manually in Settings or via the nav language picker.

const TRANSLATIONS = {
  en: {
    // Nav
    nav_profiles: "👤 Profiles",
    nav_import: "📥 Import",
    nav_compare: "📊 Compare",
    nav_settings: "⚙️ Settings",
    nav_about: "About",
    nav_home: "Home",

    // Home / Welcome
    welcome_title: "Relationshape",
    welcome_sub: "A private space to map your relationships — your needs, your boundaries, your shape.",
    welcome_cta: "✨ Create your first profile",
    welcome_about: "What is Relationshape?",
    welcome_f1: "🔒 Stays on this device",
    welcome_f2: "📤 End-to-end encrypted sharing",
    welcome_f3: "📊 Per-category & overview radar charts",
    welcome_f4: "👥 Multiple profiles in one app",
    profiles_title: "Your profiles",
    profiles_sub: "Each profile holds your own answers. Keep separate profiles per chapter of life or persona.",
    new_profile_btn: "New profile",
    imports_title: "📥 Imported results",
    imports_sub: "Encrypted shares from people you trust.",
    no_results: "no results yet",
    results_count_one: "relationship mapped",
    results_count_many: "relationships mapped",
    imported_on: "imported",
    btn_compare: "Compare",
    btn_delete: "Delete",

    // How-to / Walkthrough
    howto_title: "How it works",
    howto_step1_title: "Create a profile",
    howto_step1_desc: "Your profile is your identity in the app. Choose a name, emoji and accent colour.",
    howto_step2_title: "Start a relationship map",
    howto_step2_desc: 'For each connection you want to reflect on, start a new map. Give it a name — e.g. "Sam, my best friend".',
    howto_step3_title: "Answer the questionnaire",
    howto_step3_desc: "Walk through 30 categories covering emotional intimacy, physical closeness, finances, shared life and more. Rate each item on a scale from No to Need.",
    howto_step4_title: "Explore your results",
    howto_step4_desc: "View radar charts, item-by-item breakdowns and alignment overviews for any two maps side by side.",
    howto_step5_title: "Share encrypted",
    howto_step5_desc: "Optionally export your answers as an AES-encrypted bundle — nothing is sent to any server. Share the file and agree on a passphrase separately.",
    howto_wizard_btn: "✨ Show me around",
    howto_wizard_title: "Quick tour",
    howto_wizard_close: "Got it, let's start!",

    // Wizard steps
    wizard_s1_title: "Welcome to Relationshape 🌷",
    wizard_s1_body: "This app helps you map the shape of your relationships across many dimensions: emotional closeness, physical intimacy, shared life, finances, and more.",
    wizard_s2_title: "Everything stays private 🔒",
    wizard_s2_body: "All data is stored only in your browser — no accounts, no servers, no analytics. You are in full control.",
    wizard_s3_title: "Create a profile first 👤",
    wizard_s3_body: "A profile represents you (or a persona). You can have multiple profiles on one device, e.g. for different life chapters.",
    wizard_s4_title: "Map your relationships 🗺️",
    wizard_s4_body: "For each relationship you want to reflect on, create a \"relationship map\". Walk through the categories and rate each item — from 'No' to 'Need'.",
    wizard_s5_title: "Share & import results 📤",
    wizard_s5_body: "Share your answers and import your counterpart's map with end-to-end encryption. Nothing is sent to any server — you exchange a file and agree on a passphrase separately.",
    wizard_s6_title: "Compare & mapping 📊",
    wizard_s6_body: "View your counterpart's answers and overlay both your maps for a visual comparison of your wishes and needs.",
    wizard_s7_title: "Customise in settings ⚙️",
    wizard_s7_body: "In Settings you can adjust the answer scale (labels, colours, number of steps) and customise which items appear in each category — make it fully your own.",
    wizard_prev: "← Back",
    wizard_next: "Next →",
    wizard_finish: "Let's go! ✨",
    wizard_skip: "Skip intro",

    // Profile edit
    profile_new_title: "New profile",
    profile_edit_title: "Edit profile",
    profile_name_label: "Display name",
    profile_name_placeholder: "e.g. Alex",
    profile_pronouns_label: "Pronouns",
    profile_pronouns_placeholder: "she / they · he / him · …",
    profile_emoji_label: "Avatar emoji",
    profile_emoji_pick: "✨ Pick",
    profile_color_label: "Accent colour",
    btn_save: "Save",
    btn_create_profile: "Create profile",
    btn_cancel: "Cancel",
    btn_delete_profile: "Delete profile",
    confirm_delete_profile: "Delete this profile and all its answers? This cannot be undone.",

    // Profile detail
    maps_title: "Relationship maps",
    maps_sub: "One map per relationship you want to reflect on. You can revisit & update them anytime.",
    btn_new_map: "➕ Start a new relationship map",
    btn_edit: "✏️ Edit",
    updated: "Updated",
    answers: "answers",
    btn_continue: "Continue",
    btn_view: "📊 View",
    btn_share: "📤 Share",
    confirm_delete_map: "Delete this relationship map?",

    // New result
    new_map_title: "Start a new relationship map",
    start_blank_title: "Start blank",
    start_blank_desc: "Default scale; you can optionally pick which categories to focus on.",
    start_import_title: "Start from an imported result",
    start_import_desc: "Inherit the other person's scale, categories and custom items.",
    start_import_desc_count_one: "import available.",
    start_import_desc_count_many: "imports available.",

    // Questionnaire
    q_category: "Category",
    q_of: "of",
    q_item: "Item",
    btn_previous: "← Previous",
    btn_skip_results: "Skip to results",
    btn_next: "Next →",
    btn_finish: "Finish ✨",
    btn_back: "← Back",
    btn_skip: "Skip →",
    btn_add_custom: "➕ Add custom item",
    add_custom_title: "Add a custom item",
    add_custom_label: "Name of the new item",
    add_custom_placeholder: "e.g. astronomy",
    btn_add: "Add",
    item_already_exists: "That item already exists.",
    q_gr_tip: "Tip: items here support a \"Giving / Receiving / Both\" marker.",
    q_keyboard_tip: "⌨️ Tip: focus a question and press 1–{n} to rate, {m} to skip, Enter to advance.",
    q_slider_hint: "Drag the slider or tap a label to rate",
    q_slider_reset: "↺ Reset",
    custom_tag: "custom",
    note_placeholder: "Note (optional)…",
    btn_results: "📊 Results",
    q_done_title: "All done ✨",
    q_done_body: "You've walked through every item. Review your map below.",
    btn_start_over: "Start over",
    btn_see_results: "📊 See results",

    // Onboarding themes
    onboarding_title: "Quick onboarding",
    onboarding_sub: "Toggle which broad themes apply to this relationship. You can change this later. Skip to include everything.",
    btn_skip_onboarding: "Skip — include everything",
    btn_use_themes: "Use these themes",

    // Result view
    result_last_edited: "last edited",
    btn_map_settings: "⚙️ Map settings",
    btn_continue_editing: "✏️ Continue editing",
    result_category_overview: "Category overview",
    result_category_overview_sub: "Averaged per category — the further out, the more important to you on average.",
    compare_with: "Compare with someone",
    by_category: "By category",
    by_category_sub: "Open a card to see a per-item radar chart and the underlying breakdown.",
    no_compare: "Create another relationship map or import a shared one to compare.",

    // Category modal tabs
    tab_spider: "Radar Chart",
    tab_items: "Item by Item",
    tab_edit: "Edit Answers",
    btn_close: "Close",
    btn_save_changes: "Save changes",
    confirm_save_changes: "Save the changes you made to these answers?",
    confirm_discard_changes: "You have unsaved changes. Discard them?",
    btn_discard: "Discard",

    // Compare
    compare_title: "📊 Compare",
    compare_sub: "Pick up to four results to overlay. Open a category for a per-item radar chart.",
    compare_select: "Select results above.",
    alignment_title: "Alignment overview",
    cat_details_title: "Category details",
    cat_details_sub: "Each card opens a radar chart of the items inside it.",

    // New card scale dialog
    new_card_scale_title: "Scale for this map",
    new_card_scale_sub: "Use the default scale or customize it for this map only.",
    new_card_scale_use: "Use default",
    new_card_scale_customize: "Customize…",
    new_card_scale_confirm: "Use this scale",

    // Per-item scale
    item_edit_scale: "Edit Item/Scale",
    item_scale_change_warning: "This item already has an answer. Changing the scale will clear it. Continue?",
    q_single_hint_mobile: "Swipe left/right to go to previous/next question",
    q_single_hint_desktop: "Use ← → arrow keys to navigate between questions",
    btn_categories: "Categories",

    // Share
    share_title: "📤 Share encrypted result",
    share_intro: "Your answers will be packaged and encrypted with a passphrase. Set the passphrase and send the generated text via any channel to the other person. Share the passphrase separately (e.g. by phone or in person) to guarantee maximum data security. Both are required for a successful import.",
    share_intro_separately: "",
    share_intro_rest: "",
    share_callout_title: "🔐 No server, no traces.",
    share_callout_body: "Encryption happens on this device. The passphrase never leaves your head.",
    share_pass_label: "Passphrase",
    share_pass_confirm_label: "Repeat passphrase",
    btn_encrypt: "🔒 Encrypt & generate share",
    share_bundle_title: "Your encrypted bundle",
    share_bundle_sub: "Copy this text or download the file. Keep the passphrase separate.",
    btn_copy: "📋 Copy text",
    btn_download: "💾 Download file",
    pass_too_short: "Please choose at least 6 characters.",
    pass_mismatch: "The two passphrases don't match.",

    // Import
    import_title: "📥 Import a shared result",
    import_intro: "Paste the encrypted bundle below or load a",
    import_intro2: "file. Decryption happens locally.",
    import_bundle_label: "Encrypted bundle",
    import_file_label: "Or load a file",
    import_pass_label: "Passphrase",
    btn_decrypt: "🔓 Decrypt & import",
    import_empty: "Paste an encrypted bundle first.",
    import_wrong_type: "This bundle is not a Relationshape result.",
    import_failed_title: "Import failed",
    imported_toast: "Imported ✔",
    imported_versioned_toast: "Imported as v{n} ✔",

    // Settings
    settings_title: "⚙️ Settings",
    settings_appearance: "Appearance",
    settings_display_modes: "Display modes",
    fabi_mode_title: "Fabi mode",
    fabi_mode_desc: "Show a category-averages radar chart on the result and compare pages, and small per-category summary chips on the cards. Off by default because averaging across very different items can be misleading.",
    settings_scale_title: "Default Answer Scale",
    settings_scale_sub: "Sets the default answer scale for future relationship maps. Already created maps keep their own copy of the scale — this change only affects future maps. Use the arrows to adjust the order of the steps.",
    btn_add_step: "➕ Add step",
    btn_reset_defaults: "Reset to defaults",
    confirm_reset_scale: "Reset the scale to the default 7 steps?",
    settings_data: "Data",
    btn_backup: "💾 Download local backup",
    btn_restore: "📂 Restore from backup",
    btn_erase: "🗑 Erase all local data",
    confirm_erase: "Erase ALL data on this device — profiles, maps, imports, settings? This cannot be undone.",
    lang_label: "Language",
    theme_auto: "🖥 Auto (follow OS)",
    theme_light: "☀️ Light",
    theme_dark: "🌙 Dark",

    // Scale editor
    scale_step_label: "Long label",
    scale_step_short: "Short",
    scale_step_desc: "Tooltip / description",
    scale_step_new: "New step",
    scale_step_remove_confirm: "The step \"{label}\" is in use in some answers. Removing it will clear those answers. Continue?",
    scale_col_color: "Color",
    scale_col_label: "Label",
    scale_col_short: "Shorthand",

    // Map settings
    map_settings_title: "⚙️ Map settings",
    map_settings_identity: "Identity",
    map_settings_identity_sub: "Visual identity of this relationship map.",
    map_name_label: "Map name (subject)",
    map_emoji_label: "Avatar emoji",
    map_emoji_change: "· click to change",
    map_color_label: "Accent colour",
    map_scale_title: "Answer scale (this map only)",
    map_scale_sub: "These steps are stored with this map and will travel along when you share it.",
    map_cats_title: "Categories",
    map_cats_sub: "Toggle which categories this map will ask about.",
    map_asked_items_notice: "This map was started from an import. By default it only asks about the items the other person also answered.",
    btn_ask_all: "Ask all items in enabled categories",
    confirm_ask_all: "Expand this map to ask all items in the enabled categories?",

    // About
    about_title: "About Relationshape",
    about_p1: "Relationshape is a communication tool to help shape relationships around the actual needs and desires of everyone involved — independently from outside norms or hierarchies.",
    about_p2: "It comes from the world of relationship anarchy and was inspired by Andie Nordgren's manifesto, the Smorgasbord of relationship anarchy, and books like Polysecure (Jessica Fern) and More than Two (Eve Rickert & Franklin Veaux).",
    about_how_title: "How to use this app",
    about_how_1: "Create a profile for yourself.",
    about_how_2: "Start a relationship map for each connection you want to reflect on.",
    about_how_3: "Walk through the categories at your own pace. Use",
    about_how_3b: "(or your own custom scale) to mark how important each item is.",
    about_how_4: "Open a category in the result view to see a radar chart of its items.",
    about_how_5: "Optionally exchange your encrypted bundle with the other person and compare.",
    about_privacy_title: "Privacy",
    about_privacy: "Everything stays in your browser's local storage on this device. The app has no backend. Shared bundles are encrypted with AES-GCM (256-bit) using a key derived from your passphrase via PBKDF2 (250 000 iterations). Pick a passphrase you and the other person agree on out of band.",
    about_credits_title: "Credits",
    about_credits: "The Relationshape questionnaire and concept are by Anne Lüscher (she/they) and Benjamin Frey (him/his), released under CC BY-NC 4.0.",
    about_credits_repo: "Original repository",
    about_credits_unofficial: "This app is an unofficial implementation built to make the tool more interactive and accessible.",
    about_ai_title: "Transparency on the Use of AI Tools",
    about_ai_text: "This app was programmed with the help of Claude Code. The original idea, the structure of the app, as well as all elements, questions and texts are 100% the work of the original authors and the experiences of the broader community.",

    // Keyboard help
    kbd_title: "Keyboard shortcuts",
    kbd_sub: "Works on desktop in both questionnaire modes.",
    kbd_single_title: "Single mode (one item at a time)",
    kbd_list_title: "List mode (all items in category)",
    kbd_rate: "Rate with that step (briefly shown, then auto-advance)",
    kbd_skip_next: "Skip / next without rating",
    kbd_prev: "Previous",
    kbd_skip: "Skip",
    kbd_tab: "Move between items",
    kbd_rate_list: "Rate the focused item",
    kbd_clear: "Clear the focused item's rating",
    kbd_next_item: "Next item",
    kbd_prev_item: "Previous item",
    kbd_slider_title: "Slider",
    kbd_step: "Step lower / higher",
    kbd_bounds: "Lowest / highest",
    kbd_clear_rating: "Clear rating",
    btn_got_it: "Got it",

    // Misc
    btn_ok: "OK",
    alignment_match: "🎯 Strongest alignment",
    alignment_gaps: "⚡ Biggest gaps — talk about these",
    spider_empty: "Not enough data yet.",
    item_spider_empty: "Answer at least 3 items in this category to see a radar chart.",
    restore_title: "Restore from backup",
    restore_warning: "This will replace ALL data currently on this device with the contents of the backup.",
    restore_file_label: "Backup file (.json)",
    btn_replace_all: "Replace all data",
    restore_pick_file: "Pick a file first.",
    restore_invalid: "Not a valid JSON file.",
    restore_done: "Backup restored",
    seeded_toast: "Created from {name} — same questions, your own answers.",
    pick_import_title: "Pick an import to start from",
    your_version_title: "Your version of this map",
    your_version_label: "What do you want to call your map for {name}'s \"{subject}\"?",
    btn_create: "Create",
    enlarge_chart: "Click to enlarge chart",
    chart_modal_title: "Chart overview",
  },

  de: {
    // Nav
    nav_profiles: "👤 Profile",
    nav_import: "📥 Importieren",
    nav_compare: "📊 Vergleichen",
    nav_settings: "⚙️ Einstellungen",
    nav_about: "Über",
    nav_home: "Startseite",

    // Home / Welcome
    welcome_title: "Relationshape",
    welcome_sub: "Ein privater Raum, um deine Beziehungen zu kartieren — deine Bedürfnisse, deine Grenzen, deine Form.",
    welcome_cta: "✨ Erstes Profil erstellen",
    welcome_about: "Was ist Relationshape?",
    welcome_f1: "🔒 Bleibt auf diesem Gerät",
    welcome_f2: "📤 Ende-zu-Ende-verschlüsseltes Teilen",
    welcome_f3: "📊 Kategorie- & Übersichts-Netzdiagramme",
    welcome_f4: "👥 Mehrere Profile in einer App",
    profiles_title: "Deine Profile",
    profiles_sub: "Jedes Profil enthält deine eigenen Antworten. Führe separate Profile für verschiedene Lebensphasen oder Personas.",
    new_profile_btn: "Neues Profil",
    imports_title: "📥 Importierte Ergebnisse",
    imports_sub: "Verschlüsselte Freigaben von Menschen, denen du vertraust.",
    no_results: "noch keine Ergebnisse",
    results_count_one: "Beziehung kartiert",
    results_count_many: "Beziehungen kartiert",
    imported_on: "importiert",
    btn_compare: "Vergleichen",
    btn_delete: "Löschen",

    // How-to / Walkthrough
    howto_title: "So funktioniert's",
    howto_step1_title: "Profil erstellen",
    howto_step1_desc: "Dein Profil ist deine Identität in der App. Wähle Name, Emoji und Akzentfarbe.",
    howto_step2_title: "Beziehungskarte starten",
    howto_step2_desc: 'Für jede Verbindung, über die du nachdenken möchtest, legst du eine neue Karte an – z.B. „Sam, meine beste Freundin".',
    howto_step3_title: "Fragebogen ausfüllen",
    howto_step3_desc: "Gehe durch 30 Kategorien – emotionale Nähe, körperliche Intimität, Finanzen, gemeinsames Leben u.v.m. Bewerte jedes Element von Nein bis Brauche ich.",
    howto_step4_title: "Ergebnisse erkunden",
    howto_step4_desc: "Sieh dir Netzdiagramme, Einzel-Item-Auswertungen und Übereinstimmungsübersichten für je zwei Karten nebeneinander an.",
    howto_step5_title: "Verschlüsselt teilen",
    howto_step5_desc: "Exportiere deine Antworten optional als AES-verschlüsseltes Paket – nichts wird an einen Server gesendet. Teile die Datei und einigt euch separat auf ein Passwort.",
    howto_wizard_btn: "✨ Zeig mir die App",
    howto_wizard_title: "Kurze Tour",
    howto_wizard_close: "Alles klar, los geht's!",

    // Wizard steps
    wizard_s1_title: "Willkommen bei Relationshape 🌷",
    wizard_s1_body: "Diese App hilft dir, die Form deiner Beziehungen in vielen Dimensionen zu kartieren: emotionale Nähe, körperliche Intimität, gemeinsames Leben, Finanzen und mehr.",
    wizard_s2_title: "Alles bleibt privat 🔒",
    wizard_s2_body: "Alle Daten werden nur in deinem Browser gespeichert – keine Accounts, keine Server, keine Analyse. Du hast die volle Kontrolle.",
    wizard_s3_title: "Zuerst ein Profil anlegen 👤",
    wizard_s3_body: "Ein Profil repräsentiert dich (oder eine Persona). Du kannst mehrere Profile auf einem Gerät führen – z.B. für verschiedene Lebensphasen.",
    wizard_s4_title: "Beziehungen kartieren 🗺️",
    wizard_s4_body: 'Für jede Beziehung, über die du nachdenken möchtest, erstelle eine „Beziehungskarte". Gehe durch die Kategorien und bewerte jedes Element – von „Nein" bis „Brauche ich".',
    wizard_s5_title: "Ergebnisse teilen und importieren 📤",
    wizard_s5_body: "Teile deine Eingaben und importiere die Karte deines Gegenübers mit Ende-zu-Ende-Verschlüsselung. Nichts wird an einen Server gesendet – du tauschst eine Datei aus und einigt euch separat auf ein Passwort.",
    wizard_s6_title: "Vergleichen und Mapping 📊",
    wizard_s6_body: "Sieh dir die Antworten deines Gegenübers an und überlagere eure jeweiligen Karten für einen visuellen Vergleich eurer Wünsche und Bedürfnisse.",
    wizard_s7_title: "In den Einstellungen anpassen ⚙️",
    wizard_s7_body: "In den Einstellungen kannst du die Antwortskala anpassen (Beschriftungen, Farben, Anzahl der Stufen) und festlegen, welche Elemente in jeder Kategorie erscheinen – mach es ganz zu deinem eigenen.",
    wizard_prev: "← Zurück",
    wizard_next: "Weiter →",
    wizard_finish: "Los geht's! ✨",
    wizard_skip: "Einleitung überspringen",

    // Profile edit
    profile_new_title: "Neues Profil",
    profile_edit_title: "Profil bearbeiten",
    profile_name_label: "Anzeigename",
    profile_name_placeholder: "z.B. Alex",
    profile_pronouns_label: "Pronomen",
    profile_pronouns_placeholder: "sie / ihr · er / ihm · they / them · …",
    profile_emoji_label: "Avatar-Emoji",
    profile_emoji_pick: "✨ Auswählen",
    profile_color_label: "Akzentfarbe",
    btn_save: "Speichern",
    btn_create_profile: "Profil erstellen",
    btn_cancel: "Abbrechen",
    btn_delete_profile: "Profil löschen",
    confirm_delete_profile: "Dieses Profil und alle Antworten löschen? Das kann nicht rückgängig gemacht werden.",

    // Profile detail
    maps_title: "Beziehungskarten",
    maps_sub: "Eine Karte pro Beziehung, über die du nachdenken möchtest. Du kannst sie jederzeit erneut besuchen und aktualisieren.",
    btn_new_map: "➕ Neue Beziehungskarte starten",
    btn_edit: "✏️ Bearbeiten",
    updated: "Aktualisiert",
    answers: "Antworten",
    btn_continue: "Weiter",
    btn_view: "📊 Ansehen",
    btn_share: "📤 Teilen",
    confirm_delete_map: "Diese Beziehungskarte löschen?",

    // New result
    new_map_title: "Neue Beziehungskarte starten",
    start_blank_title: "Leer beginnen",
    start_blank_desc: "Standardskala; du kannst optional auswählen, auf welche Kategorien du dich konzentrieren möchtest.",
    start_import_title: "Aus importiertem Ergebnis starten",
    start_import_desc: "Übernimmt Skala, Kategorien und benutzerdefinierte Elemente der anderen Person.",
    start_import_desc_count_one: "Import verfügbar.",
    start_import_desc_count_many: "Importe verfügbar.",

    // Questionnaire
    q_category: "Kategorie",
    q_of: "von",
    q_item: "Element",
    btn_previous: "← Zurück",
    btn_skip_results: "Zu den Ergebnissen",
    btn_next: "Weiter →",
    btn_finish: "Fertig ✨",
    btn_back: "← Zurück",
    btn_skip: "Überspringen →",
    btn_add_custom: "➕ Eigenes Element hinzufügen",
    add_custom_title: "Eigenes Element hinzufügen",
    add_custom_label: "Name des neuen Elements",
    add_custom_placeholder: "z.B. Astronomie",
    btn_add: "Hinzufügen",
    item_already_exists: "Dieses Element existiert bereits.",
    q_gr_tip: 'Tipp: Elemente hier unterstützen eine „Geben / Empfangen / Beides"-Markierung.',
    q_keyboard_tip: "⌨️ Tipp: Fokussiere eine Frage und drücke 1–{n} zum Bewerten, {m} zum Überspringen, Enter zum Weiter.",
    q_slider_hint: "Schieberegler ziehen oder Label antippen zum Bewerten",
    q_slider_reset: "↺ Zurücksetzen",
    custom_tag: "eigenes",
    note_placeholder: "Notiz (optional)…",
    btn_results: "📊 Ergebnisse",
    q_done_title: "Alles erledigt ✨",
    q_done_body: "Du hast alle Elemente durchgegangen. Sieh dir deine Karte unten an.",
    btn_start_over: "Neu beginnen",
    btn_see_results: "📊 Ergebnisse ansehen",

    // Onboarding themes
    onboarding_title: "Kurzes Onboarding",
    onboarding_sub: "Schalte ein, welche groben Themen auf diese Beziehung zutreffen. Du kannst das später ändern. Überspringen, um alles einzuschließen.",
    btn_skip_onboarding: "Überspringen – alles einschließen",
    btn_use_themes: "Diese Themen verwenden",

    // Result view
    result_last_edited: "zuletzt bearbeitet",
    btn_map_settings: "⚙️ Karten-Einstellungen",
    btn_continue_editing: "✏️ Weiter bearbeiten",
    result_category_overview: "Kategorieübersicht",
    result_category_overview_sub: "Durchschnitt pro Kategorie — je weiter außen, desto wichtiger im Schnitt.",
    compare_with: "Mit jemandem vergleichen",
    by_category: "Nach Kategorie",
    by_category_sub: "Öffne eine Karte, um ein Netzdiagramm der Elemente und die zugrunde liegende Aufschlüsselung zu sehen.",
    no_compare: "Erstelle eine weitere Beziehungskarte oder importiere eine geteilte, um zu vergleichen.",

    // Category modal tabs
    tab_spider: "Netzdiagramm",
    tab_items: "Element für Element",
    tab_edit: "Antworten bearbeiten",
    btn_close: "Schließen",
    btn_save_changes: "Änderungen speichern",
    confirm_save_changes: "Die vorgenommenen Änderungen an diesen Antworten speichern?",
    confirm_discard_changes: "Du hast ungespeicherte Änderungen. Verwerfen?",
    btn_discard: "Verwerfen",

    // Compare
    compare_title: "📊 Vergleichen",
    compare_sub: "Wähle bis zu vier Ergebnisse zum Überlagern aus. Öffne eine Kategorie für ein Netzdiagramm.",
    compare_select: "Wähle oben Ergebnisse aus.",
    alignment_title: "Übereinstimmungsübersicht",
    cat_details_title: "Kategorie-Details",
    cat_details_sub: "Jede Karte öffnet ein Netzdiagramm der enthaltenen Elemente.",

    // New card scale dialog
    new_card_scale_title: "Skala für diese Karte",
    new_card_scale_sub: "Verwende die Standardskala oder passe sie nur für diese Karte an.",
    new_card_scale_use: "Standard verwenden",
    new_card_scale_customize: "Anpassen…",
    new_card_scale_confirm: "Diese Skala verwenden",

    // Per-item scale
    item_edit_scale: "Element/Skala bearbeiten",
    item_scale_change_warning: "Dieses Element hat bereits eine Antwort. Das Ändern der Skala löscht diese. Fortfahren?",
    q_single_hint_mobile: "Links/rechts wischen für vorherige/nächste Frage",
    q_single_hint_desktop: "Pfeiltasten ← → zum Navigieren zwischen den Fragen",
    btn_categories: "Kategorien",

    // Share
    share_title: "📤 Ergebnis verschlüsselt teilen",
    share_intro: "Deine Antworten werden verpackt und mit einem Passwort verschlüsselt. Setze dazu das Passwort und sende den anschliessend generierten Text über einen beliebigen Kanal deinem Gegenüber. Teile anschliessend das Passwort separat (z.B. per Telefon oder persönlich) um maximale Datensicherheit zu garantieren. Für einen erfolgreichen Import wird beides benötigt.",
    share_intro_separately: "",
    share_intro_rest: "",
    share_callout_title: "🔐 Kein Server, keine Spuren.",
    share_callout_body: "Die Verschlüsselung findet auf diesem Gerät statt. Das Passwort verlässt nie deinen Kopf.",
    share_pass_label: "Passwort",
    share_pass_confirm_label: "Passwort wiederholen",
    btn_encrypt: "🔒 Verschlüsseln & Freigabe erstellen",
    share_bundle_title: "Dein verschlüsseltes Paket",
    share_bundle_sub: "Kopiere diesen Text oder lade die Datei herunter. Halte das Passwort separat.",
    btn_copy: "📋 Text kopieren",
    btn_download: "💾 Datei herunterladen",
    pass_too_short: "Bitte wähle mindestens 6 Zeichen.",
    pass_mismatch: "Die beiden Passwörter stimmen nicht überein.",

    // Import
    import_title: "📥 Geteiltes Ergebnis importieren",
    import_intro: "Füge das verschlüsselte Paket unten ein oder lade eine",
    import_intro2: "Datei. Entschlüsselung findet lokal statt.",
    import_bundle_label: "Verschlüsseltes Paket",
    import_file_label: "Oder Datei laden",
    import_pass_label: "Passwort",
    btn_decrypt: "🔓 Entschlüsseln & importieren",
    import_empty: "Füge zuerst ein verschlüsseltes Paket ein.",
    import_wrong_type: "Dieses Paket ist kein Relationshape-Ergebnis.",
    import_failed_title: "Import fehlgeschlagen",
    imported_toast: "Importiert ✔",
    imported_versioned_toast: "Als v{n} importiert ✔",

    // Settings
    settings_title: "⚙️ Einstellungen",
    settings_appearance: "Erscheinungsbild",
    settings_display_modes: "Anzeigemodi",
    fabi_mode_title: "Fabi-Modus",
    fabi_mode_desc: "Zeigt ein Kategoriedurchschnitts-Netzdiagramm auf den Ergebnis- und Vergleichsseiten sowie kleine Kategorie-Zusammenfassungschips auf den Karten. Standardmäßig deaktiviert, da das Mitteln über sehr unterschiedliche Elemente irreführend sein kann.",
    settings_scale_title: "Standard Antwortskala",
    settings_scale_sub: "Setzt die Standard-Bewertungs-Skala für künftige Beziehungskarten. Bisher erstellte Karten behalten ihre eigene Kopie der Skala – die Änderung betrifft nur die zukünftige Beantwortung. Verwende die Pfeile, um die Reihenfolge der Stufen anzupassen.",
    btn_add_step: "➕ Stufe hinzufügen",
    btn_reset_defaults: "Auf Standard zurücksetzen",
    confirm_reset_scale: "Die Skala auf die Standard-7-Stufen zurücksetzen?",
    settings_data: "Daten",
    btn_backup: "💾 Lokales Backup herunterladen",
    btn_restore: "📂 Aus Backup wiederherstellen",
    btn_erase: "🗑 Alle lokalen Daten löschen",
    confirm_erase: "ALLE Daten auf diesem Gerät löschen – Profile, Karten, Importe, Einstellungen? Das kann nicht rückgängig gemacht werden.",
    lang_label: "Sprache",
    theme_auto: "🖥 Auto (Systemeinstellung)",
    theme_light: "☀️ Hell",
    theme_dark: "🌙 Dunkel",

    // Scale editor
    scale_step_label: "Langer Name",
    scale_step_short: "Kurz",
    scale_step_desc: "Tooltip / Beschreibung",
    scale_step_new: "Neue Stufe",
    scale_step_remove_confirm: 'Die Stufe „{label}" wird in einigen Antworten verwendet. Das Entfernen löscht diese Antworten. Fortfahren?',
    scale_col_color: "Farbe",
    scale_col_label: "Bezeichnung",
    scale_col_short: "Kurzform",

    // Map settings
    map_settings_title: "⚙️ Karten-Einstellungen",
    map_settings_identity: "Identität",
    map_settings_identity_sub: "Visuelle Identität dieser Beziehungskarte.",
    map_name_label: "Kartenname (Thema)",
    map_emoji_label: "Avatar-Emoji",
    map_emoji_change: "· zum Ändern klicken",
    map_color_label: "Akzentfarbe",
    map_scale_title: "Antwortskala (nur diese Karte)",
    map_scale_sub: "Diese Stufen werden mit der Karte gespeichert und beim Teilen mitgeschickt.",
    map_cats_title: "Kategorien",
    map_cats_sub: "Schalte ein, welche Kategorien diese Karte abfragen soll.",
    map_asked_items_notice: "Diese Karte wurde aus einem Import gestartet. Sie fragt standardmäßig nur die Elemente ab, die die andere Person beantwortet hat.",
    btn_ask_all: "Alle Elemente in aktivierten Kategorien abfragen",
    confirm_ask_all: "Diese Karte auf alle Elemente in den aktivierten Kategorien erweitern?",

    // About
    about_title: "Über Relationshape",
    about_p1: "Relationshape ist ein Kommunikationswerkzeug, das dabei hilft, Beziehungen nach den tatsächlichen Bedürfnissen und Wünschen aller Beteiligten zu gestalten – unabhängig von gesellschaftlichen Normen oder Hierarchien.",
    about_p2: "Es kommt aus der Welt der Beziehungsanarchie und wurde inspiriert von Andie Nordgrens Manifest, dem Smorgasbord der Beziehungsanarchie, sowie Büchern wie Polysecure (Jessica Fern) und More than Two (Eve Rickert & Franklin Veaux).",
    about_how_title: "So wird die App verwendet",
    about_how_1: "Erstelle ein Profil für dich.",
    about_how_2: "Starte für jede Beziehung, über die du nachdenken möchtest, eine Beziehungskarte.",
    about_how_3: "Gehe die Kategorien in deinem eigenen Tempo durch. Nutze",
    about_how_3b: "(oder deine eigene Skala), um die Wichtigkeit jedes Elements zu markieren.",
    about_how_4: "Öffne in der Ergebnisansicht eine Kategorie, um ein Netzdiagramm ihrer Elemente zu sehen.",
    about_how_5: "Tausche optional dein verschlüsseltes Paket mit der anderen Person aus und vergleiche.",
    about_privacy_title: "Datenschutz",
    about_privacy: "Alles bleibt im lokalen Speicher deines Browsers auf diesem Gerät. Die App hat kein Backend. Geteilte Pakete werden mit AES-GCM (256-Bit) verschlüsselt, wobei der Schlüssel über PBKDF2 aus deinem Passwort abgeleitet wird (250.000 Iterationen).",
    about_credits_title: "Credits",
    about_credits: "Der Relationshape-Fragebogen und das Konzept stammen von Anne Lüscher (sie/ihr) und Benjamin Frey (er/ihm), veröffentlicht unter CC BY-NC 4.0.",
    about_credits_repo: "Original-Repository",
    about_credits_unofficial: "Diese App ist eine inoffizielle Implementierung, um das Werkzeug interaktiver und zugänglicher zu machen.",
    about_ai_title: "Transparenz zur Verwendung von KI-Tools",
    about_ai_text: "Diese App wurde mithilfe von Claude Code programmiert. Die ursprüngliche Idee, die Struktur der App, sowie alle Elemente, Fragen und Texte entstammen jedoch zu 100% der Arbeit der Urheber*innen, sowie den Erfahrungswelten der breiteren Community.",

    // Keyboard help
    kbd_title: "Tastaturkürzel",
    kbd_sub: "Funktioniert auf dem Desktop in beiden Fragebogen-Modi.",
    kbd_single_title: "Einzelmodus (ein Element nach dem anderen)",
    kbd_list_title: "Listenmodus (alle Elemente einer Kategorie)",
    kbd_rate: "Mit dieser Stufe bewerten (kurz angezeigt, dann automatisch weiter)",
    kbd_skip_next: "Überspringen / Weiter ohne Bewertung",
    kbd_prev: "Zurück",
    kbd_skip: "Überspringen",
    kbd_tab: "Zwischen Elementen wechseln",
    kbd_rate_list: "Fokussiertes Element bewerten",
    kbd_clear: "Bewertung des fokussierten Elements löschen",
    kbd_next_item: "Nächstes Element",
    kbd_prev_item: "Vorheriges Element",
    kbd_slider_title: "Schieberegler",
    kbd_step: "Stufe niedriger / höher",
    kbd_bounds: "Niedrigste / Höchste",
    kbd_clear_rating: "Bewertung löschen",
    btn_got_it: "Verstanden",

    // Misc
    btn_ok: "OK",
    alignment_match: "🎯 Stärkste Übereinstimmung",
    alignment_gaps: "⚡ Größte Unterschiede – darüber reden",
    spider_empty: "Noch nicht genug Daten.",
    item_spider_empty: "Beantworte mindestens 3 Elemente in dieser Kategorie, um ein Netzdiagramm zu sehen.",
    restore_title: "Aus Backup wiederherstellen",
    restore_warning: "Alle aktuellen Daten auf diesem Gerät werden durch den Inhalt des Backups ersetzt.",
    restore_file_label: "Backup-Datei (.json)",
    btn_replace_all: "Alle Daten ersetzen",
    restore_pick_file: "Zuerst eine Datei auswählen.",
    restore_invalid: "Keine gültige JSON-Datei.",
    restore_done: "Backup wiederhergestellt",
    seeded_toast: "Aus {name} erstellt – gleiche Fragen, deine eigenen Antworten.",
    pick_import_title: "Import auswählen",
    your_version_title: "Deine Version dieser Karte",
    your_version_label: "Wie möchtest du deine Karte für {name}s \"{subject}\" nennen?",
    btn_create: "Erstellen",
    enlarge_chart: "Zum Vergrößern klicken",
    chart_modal_title: "Diagramm-Übersicht",
  },
};

// German localized default answer scale
export const DEFAULT_SCALE_DE = [
  { key: "no",         label: "Nein",                   short: "Nein",       value: 0, color: "#264653", description: "Ich will das nicht / stimme dem nicht zu." },
  { key: "not-really", label: "Eher nicht",              short: "Eher nicht", value: 1, color: "#577590", description: "Ich tendiere dagegen." },
  { key: "maybe",      label: "Vielleicht / Zukünftig",  short: "Vielleicht", value: 2, color: "#43aa8b", description: "Hoffentlich oder vielleicht in der Zukunft." },
  { key: "open",       label: "Offen dafür",             short: "Offen",      value: 3, color: "#90be6d", description: "Ich bin offen, neutral, bereit es auszuprobieren." },
  { key: "want",       label: "Möchte ich",              short: "Möchte",     value: 4, color: "#f9c74f", description: "Das würde ich gerne haben." },
  { key: "hell-yes",   label: "Ja, unbedingt!",          short: "Ja!",        value: 5, color: "#f3722c", description: "Starkes Ja, aufregend und willkommen." },
  { key: "need",       label: "Brauche ich",             short: "Brauche",    value: 6, color: "#e63946", description: "Höchste Wichtigkeit. Wenn unerfüllt, stelle ich die Beziehung evtl. in Frage." },
];

// Detect or load language
function detectLanguage() {
  const stored = (() => {
    try {
      const d = JSON.parse(localStorage.getItem("relationshape.v1") || "{}");
      return d.settings?.lang;
    } catch { return null; }
  })();
  if (stored && TRANSLATIONS[stored]) return stored;
  const browser = (navigator.language || navigator.userLanguage || "en").split("-")[0].toLowerCase();
  return TRANSLATIONS[browser] ? browser : "en";
}

let _lang = detectLanguage();

export function getLang() { return _lang; }

export function setLang(lang) {
  if (!TRANSLATIONS[lang]) return;
  _lang = lang;
  try {
    const raw = localStorage.getItem("relationshape.v1");
    const d = raw ? JSON.parse(raw) : {};
    d.settings = d.settings || {};
    d.settings.lang = lang;
    localStorage.setItem("relationshape.v1", JSON.stringify(d));
  } catch {}
}

export function t(key, vars = {}) {
  const dict = TRANSLATIONS[_lang] || TRANSLATIONS.en;
  let str = dict[key] ?? TRANSLATIONS.en[key] ?? key;
  for (const [k, v] of Object.entries(vars)) {
    str = str.replaceAll(`{${k}}`, v);
  }
  return str;
}

export function availableLangs() {
  return [
    { code: "en", label: "English" },
    { code: "de", label: "Deutsch" },
  ];
}

export function getLocalizedDefaultScale(englishDefault) {
  if (_lang === "de") return DEFAULT_SCALE_DE;
  return englishDefault;
}
