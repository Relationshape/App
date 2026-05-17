// src/lib/i18n/en.ts
// Ported verbatim from public/legacy/js/i18n.js TRANSLATIONS.en (~lines 6-394).
// CORE-06: content-frozen English translation map; source of truth for TranslationKey type.
// D-12/D-13: custom typed i18n (NOT react-i18next). DE is constrained to Record<TranslationKey, string>
//            so the TypeScript compiler catches any missing DE key at build time.

export const EN = {
  // Nav
  nav_profiles: '👤 Profiles',
  nav_import: '📥 Import/Export',
  nav_compare: '📊 Results/Compare',
  nav_settings: '⚙️ Settings',
  nav_about: 'About',
  nav_home: 'Home',

  // Home / Welcome
  welcome_title: 'Relationshapes',
  welcome_sub:
    'A private space to map your relationships.\nYour needs. Your agreements. Your shape.',
  welcome_cta: '✨ Start now',
  start_now_new: '✨ New profile',
  start_now_existing: 'Continue with existing profile',
  start_now_title: 'Start your relationship map',
  start_now_sub: 'Do you want to create a new profile or continue with an existing one?',
  welcome_about: 'What is Relationshapes?',
  welcome_f1: '🔒 Stays on this device',
  welcome_f2: '📤 End-to-end encrypted sharing',
  welcome_f3: '📊 Per-category & overview radar charts',
  welcome_f4: '👥 Multiple profiles in one app',
  feat_maps_title: 'Relationship Maps',
  feat_maps_short:
    'Answer questions and rate relationship elements to create a visual map of each connection.',
  feat_maps_body:
    'Reflect on and shape your relationships by answering questions and rating relationship elements by importance. Create your own map for each relationship you want to reflect on and get different aspects of it displayed graphically.',
  feat_personal_title: 'Personalization',
  feat_personal_short:
    'Choose from a broad catalogue of preset questions and elements, or add your own.',
  feat_personal_body:
    'An extensive catalogue of ready-made questions and relationship elements is available for you to choose from. These cover many possible relationship aspects and can be individually selected or omitted. Additional personalization options are available: add your own categories, create new elements, and adjust the answer scale to suit you.',
  feat_share_title: 'Sharing',
  feat_share_short: 'Exchange your results to open conversations and find where you are aligned.',
  feat_share_body:
    'Exchange your results with your counterpart to start a conversation, communicate needs, wishes, and boundaries, and make agreements. Overlaying both maps on a spider chart intuitively shows where you are aligned and where differences may exist. Revise, export, and compare multiple times.',
  feat_privacy_title: 'Data Security',
  feat_privacy_short: 'Your data stays on your device — fully private, no servers, no tracking.',
  feat_privacy_body:
    'Privacy and data protection are a high priority for us. Your data belongs to you and is stored locally on your device — neither we nor third parties store personal information about you. The exchange and comparison of your relationship maps and answered questions is done via an encrypted export. You remain in control at all times.',
  feat_security_title: 'Device Security',
  feat_security_sub: 'Stays on this device',
  feat_charts_title: 'Spider Charts',
  feat_charts_sub: 'Visual relationship maps',
  feat_profiles_title: 'Multiple Profiles',
  feat_profiles_sub: 'All in one place',
  btn_select_all_continue: 'Select all & continue',
  profiles_title: 'Your profiles',
  profiles_sub:
    'Each profile holds your own answers. Keep separate profiles per chapter of life or persona.',
  new_profile_btn: 'New profile',
  imports_title: '📥 Imported results',
  imports_sub: 'Encrypted shares from people you trust.',
  no_results: 'no results yet',
  results_count_one: 'relationship mapped',
  results_count_many: 'relationships mapped',
  imported_on: 'imported',
  btn_compare: 'Compare',
  btn_delete: 'Delete',

  // How-to / Walkthrough
  howto_title: 'How it works',
  howto_step1_title: 'Create a profile',
  howto_step1_desc:
    'Your profile is your identity in the app. Choose a name, emoji and accent colour.',
  howto_step2_title: 'Start a relationship map',
  howto_step2_desc:
    'For each connection you want to reflect on, start a new map. Give it a name — e.g. "Sam, my best friend".',
  howto_step3_title: 'Answer the questionnaire',
  howto_step3_desc:
    'Walk through 30 categories covering emotional intimacy, physical closeness, finances, shared life and more. Rate each item on a scale from No to Need.',
  howto_step4_title: 'Explore & share',
  howto_step4_desc:
    'View radar charts and alignment overviews — then optionally export your answers as an AES-encrypted file to share with your counterpart. No server involved.',
  howto_wizard_btn: '✨ Show me around',
  howto_wizard_title: 'Quick tour',
  howto_wizard_close: "Got it, let's start!",

  // Wizard steps
  wizard_s1_title: 'Welcome to Relationshapes 🌷',
  wizard_s1_body:
    'This app helps you map the shape of your relationships across many dimensions: emotional closeness, physical intimacy, shared life, finances, and more.',
  wizard_s2_title: 'Everything stays private 🔒',
  wizard_s2_body:
    'All data is stored only in your browser — no accounts, no servers, no analytics. You are in full control.',
  wizard_s3_title: 'Create a profile first 👤',
  wizard_s3_body:
    'A profile represents you (or a persona). You can have multiple profiles on one device, e.g. for different life chapters.',
  wizard_s4_title: 'Map your relationships 🗺️',
  wizard_s4_body:
    "For each relationship you want to reflect on, create a \"relationship map\". Walk through the categories and rate each item — from 'No' to 'Need'.",
  wizard_s5_title: 'Share & import results 📤',
  wizard_s5_body:
    "Share your answers and import your counterpart's map with end-to-end encryption. Nothing is sent to any server — you exchange a file and agree on a passphrase separately.",
  wizard_s6_title: 'Compare & mapping 📊',
  wizard_s6_body:
    "View your counterpart's answers and overlay both your maps for a visual comparison of your wishes and needs.",
  wizard_s7_title: 'Customise in settings ⚙️',
  wizard_s7_body:
    'In Settings you can adjust the answer scale (labels, colours, number of steps) and customise which items appear in each category — make it fully your own.',
  wizard_prev: '← Back',
  wizard_next: 'Next →',
  wizard_finish: "Let's go! ✨",
  wizard_skip: 'Skip intro',

  // Profile edit
  profile_new_title: 'New profile',
  profile_edit_title: 'Edit profile',
  profile_name_label: 'Display name',
  profile_name_placeholder: 'e.g. Alex',
  profile_pronouns_label: 'Pronouns',
  profile_pronouns_placeholder: 'she / they · he / him · …',
  profile_emoji_label: 'Avatar emoji',
  profile_emoji_pick: '✨ Pick',
  profile_color_label: 'Accent colour',
  btn_save: 'Save',
  btn_create_profile: 'Create profile',
  btn_cancel: 'Cancel',
  btn_delete_profile: 'Delete profile',
  confirm_delete_profile: 'Delete this profile and all its answers? This cannot be undone.',

  // Profile detail
  maps_title: 'Relationship maps',
  maps_sub:
    'One map per relationship you want to reflect on. You can revisit & update them anytime.',
  btn_new_map: '➕ Start a new relationship map',
  btn_edit: '✏️ Edit',
  updated: 'Updated',
  answers: 'answers',
  btn_continue: 'Continue',
  btn_view: '📊 View',
  btn_share: '📤 Share',
  confirm_delete_map: 'Delete this relationship map?',

  // New result
  new_map_title: 'Start a new relationship map',
  start_blank_title: 'Start blank',
  start_blank_desc: 'Default scale; you can optionally pick which categories to focus on.',
  start_import_title: 'Start from an imported result',
  start_import_desc: "Inherit the other person's scale, categories and custom items.",
  start_import_desc_count_one: 'import available.',
  start_import_desc_count_many: 'imports available.',

  // Questionnaire
  q_category: 'Category',
  q_of: 'of',
  q_item: 'Item',
  btn_previous: '← Previous',
  btn_skip_results: 'Skip to results',
  btn_next: 'Next →',
  btn_finish: 'Finish ✨',
  btn_back: '← Back',
  btn_skip: 'Skip →',
  btn_add_custom: '➕ Add custom item',
  add_custom_title: 'Add a custom item',
  add_custom_label: 'Name of the new item',
  add_custom_placeholder: 'e.g. astronomy',
  btn_add: 'Add',
  item_already_exists: 'That item already exists.',
  lbl_giving: 'Giving',
  lbl_receiving: 'Receiving',
  q_slider_reset: '↺ Reset',
  custom_tag: 'custom',
  note_placeholder: 'Note (optional)…',
  btn_results: '📊 Results',
  q_done_title: 'All done ✨',
  q_done_body: "You've walked through every item. Review your map below.",
  btn_start_over: 'Start over',
  btn_see_results: '📊 See results',

  // Onboarding category picker
  onboarding_title: 'Choose your categories',
  onboarding_sub:
    'Select the topics you want to explore for this relationship. You can add more later.',
  btn_skip_onboarding: 'Skip — include everything',
  btn_start_map: 'Start map with these categories',
  btn_add_categories: 'Add more categories',
  onboarding_empty_warning: 'Please select at least one category to continue.',

  // Age gate
  age_gate_title: 'This app is for adults',
  age_gate_body:
    'Relationshapes contains topics of an intimate and sexual nature. Please confirm that you are 18 years of age or older.',
  age_gate_yes: 'Yes, I am 18 or older',
  age_gate_no: 'No, I am under 18',
  age_gate_stop: 'Sorry — this app is for ages 18 and up. Please come back when you\'re older.',

  // Result view
  result_last_edited: 'last edited',
  btn_map_settings: '⚙️ Map settings',
  btn_continue_editing: '✏️ Continue editing',
  result_category_overview: 'Category overview',
  result_category_overview_sub:
    'Averaged per category — the further out, the more important to you on average.',
  compare_with: 'Compare with someone',
  compare_own_maps: 'Overlay your own maps',
  compare_imports_title: 'Compare with imported results',
  btn_import_map: '📥 Import...',
  by_category: 'By category',
  by_category_sub: 'Open a card to see a per-item radar chart and the underlying breakdown.',
  no_compare: 'Create another relationship map or import a shared one to compare.',

  // Category modal tabs
  tab_spider: 'Radar Chart',
  tab_items: 'Item by Item',
  tab_edit: 'Edit Answers',
  btn_close: 'Close',
  btn_save_changes: 'Save changes',
  btn_remove_item: 'Remove',
  confirm_save_changes: 'Save the changes you made to these answers?',
  confirm_discard_changes: 'You have unsaved changes. Discard them?',
  btn_discard: 'Discard',

  // Compare
  compare_title: '📊 Compare',
  compare_sub: 'Pick up to four results to overlay. Open a category for a per-item radar chart.',
  compare_import_btn: 'Import result',
  compare_import_title: 'Import a result',
  compare_select: 'Select results above.',
  alignment_title: 'Alignment overview',
  cat_details_title: 'Category details',
  cat_details_sub: 'Each card opens a radar chart of the items inside it.',
  compare_fabi_tip:
    'Tip: Enable "Fabi mode" in Settings to see a category overview spider chart here. Or pick a category below to compare item by item.',

  // New card scale dialog
  new_card_scale_title: 'Scale for this map',
  new_card_scale_sub: 'Use the default scale or customize it for this map only.',
  new_card_scale_use: 'Use default',
  new_card_scale_customize: 'Customize…',
  new_card_scale_confirm: 'Use this scale',

  // Per-item scale
  item_edit_scale: 'Edit Item/Scale',
  item_scale_change_warning:
    'This item already has an answer. Changing the scale will clear it. Continue?',
  q_single_hint_mobile: 'Swipe left/right to go to previous/next question',
  q_single_hint_desktop: 'Use ← → arrow keys to navigate between questions',
  btn_categories: 'Categories',

  // Share
  share_title: '📤 Share encrypted result',
  share_intro:
    'Your answers will be packaged and encrypted with a passphrase. Set the passphrase and send the generated text via any channel to the other person. Share the passphrase separately (e.g. by phone or in person) to guarantee maximum data security. Both are required for a successful import.',
  share_intro_separately: '',
  share_intro_rest: '',
  share_callout_title: '🔐 No server, no traces.',
  share_callout_body: 'Encryption happens on this device. The passphrase never leaves your head.',
  share_pass_label: 'Passphrase',
  share_pass_confirm_label: 'Repeat passphrase',
  btn_encrypt: '🔒 Encrypt & generate share',
  share_bundle_title: 'Your encrypted bundle',
  share_bundle_sub: 'Copy this text or download the file. Keep the passphrase separate.',
  btn_copy: '📋 Copy text',
  btn_download: '💾 Download file',
  pass_too_short: 'Please choose at least 6 characters.',
  pass_mismatch: "The two passphrases don't match.",

  // Import
  import_title: "📥 Import a counterpart's result",
  import_intro:
    'To receive a map from someone else, paste the encrypted text or upload it as a .rshape.txt file. Then enter the passphrase your counterpart used to encrypt their data.',
  import_section2_title: 'Share your data / secure export',
  import_section2_text:
    'To share a map with someone else, you can export your relationship maps with all questions and answers here.',
  import_bundle_label: 'Encrypted bundle',
  import_file_label: 'Or load a file',
  import_pass_label: 'Passphrase',
  btn_decrypt: '🔓 Decrypt & import',
  import_empty: 'Paste an encrypted bundle first.',
  import_wrong_type: 'This bundle is not a Relationshapes result.',
  import_failed_title: 'Import failed',
  import_no_results: 'No results to export yet.',
  q_keyboard_tip:
    '⌨️ Tip: focus a question and press 1–{n} to rate, {m} to skip, Enter to advance.',
  q_mobile_tip:
    'Tip: Switch to single mode (top left) to answer questions one by one and swipe left/right to navigate.',
  imported_toast: 'Imported ✔',
  imported_versioned_toast: 'Imported as v{n} ✔',

  // Settings
  settings_title: '⚙️ Settings',
  settings_appearance: 'Appearance',
  settings_display_modes: 'Display modes',
  fabi_mode_title: 'Fabi mode',
  fabi_mode_desc:
    'Show a category-averages radar chart on the result and compare pages, and small per-category summary chips on the cards. Off by default because averaging across very different items can be misleading.',
  settings_scale_title: 'Default Answer Scale',
  settings_scale_sub:
    'Sets the default answer scale for future relationship maps. Already created maps keep their own copy of the scale — this change only affects future maps. Use the arrows to adjust the order of the steps.',
  btn_add_step: '➕ Add step',
  btn_reset_defaults: 'Reset to defaults',
  confirm_reset_scale: 'Reset the scale to the default 7 steps?',
  settings_data: 'Data',
  btn_backup: '💾 Download local backup',
  btn_restore: '📂 Restore from backup',
  btn_erase: '🗑 Erase all local data',
  confirm_erase:
    'Erase ALL data on this device — profiles, maps, imports, settings? This cannot be undone.',
  lang_label: 'Language',
  theme_auto: '🖥 Auto (follow OS)',
  theme_light: '☀️ Light',
  theme_dark: '🌙 Dark',

  // Scale editor
  scale_step_label: 'Long label',
  scale_step_short: 'Short',
  scale_step_desc: 'Tooltip / description',
  scale_step_new: 'New step',
  scale_step_remove_confirm:
    'The step "{label}" is in use in some answers. Removing it will clear those answers. Continue?',
  scale_col_color: 'Color',
  scale_col_label: 'Label',
  scale_col_short: 'Shorthand',

  // Map settings
  map_settings_title: '⚙️ Map settings',
  map_settings_identity: 'Identity',
  map_settings_identity_sub: 'Visual identity of this relationship map.',
  map_name_label: 'Map name (subject)',
  map_emoji_label: 'Avatar emoji',
  map_emoji_change: '· click to change',
  map_color_label: 'Accent colour',
  map_scale_title: 'Answer scale (this map only)',
  map_scale_sub: 'These steps are stored with this map and will travel along when you share it.',
  map_cats_title: 'Categories',
  map_cats_sub: 'Toggle which categories this map will ask about.',
  map_asked_items_notice:
    'This map was started from an import. By default it only asks about the items the other person also answered.',
  btn_ask_all: 'Ask all items in enabled categories',
  confirm_ask_all: 'Expand this map to ask all items in the enabled categories?',

  // About
  about_title: 'About Relationshapes',
  about_p1:
    'Relationshapes is a communication tool to help shape relationships around the actual needs and desires of everyone involved — independently from outside norms or hierarchies.',
  about_p2:
    "It comes from the world of relationship anarchy and was inspired by Andie Nordgren's manifesto, the Smorgasbord of relationship anarchy, and books like Polysecure (Jessica Fern) and More than Two (Eve Rickert & Franklin Veaux).",
  about_how_title: 'How to use this app',
  about_how_1: 'Create a profile for yourself.',
  about_how_2: 'Start a relationship map for each connection you want to reflect on.',
  about_how_3: 'Walk through the categories at your own pace. Use',
  about_how_3b: '(or your own custom scale) to mark how important each item is.',
  about_how_4: 'Open a category in the result view to see a radar chart of its items.',
  about_how_5: 'Optionally exchange your encrypted bundle with the other person and compare.',
  about_privacy_title: 'Privacy',
  about_privacy:
    "Everything stays in your browser's local storage on this device. The app has no backend. Shared bundles are encrypted with AES-GCM (256-bit) using a key derived from your passphrase via PBKDF2 (250 000 iterations). Pick a passphrase you and the other person agree on out of band.",
  about_credits_title: 'Credits',
  about_credits:
    'The Relationshapes questionnaire and concept are by Anne Lüscher (she/they) and Benjamin Frey (him/his), released under CC BY-NC 4.0.',
  about_credits_repo: 'Original repository',
  about_credits_unofficial:
    'This app is an unofficial implementation built to make the tool more interactive and accessible.',
  about_ai_title: 'Transparency on the Use of AI Tools',
  about_ai_text:
    'This app was programmed with the help of Claude Code. The original idea, the structure of the app, as well as all elements, questions and texts are 100% the work of the original authors and the experiences of the broader community.',

  // Keyboard help
  kbd_title: 'Keyboard shortcuts',
  kbd_sub: 'Works on desktop in both questionnaire modes.',
  kbd_single_title: 'Single mode (one item at a time)',
  kbd_list_title: 'List mode (all items in category)',
  kbd_rate: 'Rate with that step (briefly shown, then auto-advance)',
  kbd_skip_next: 'Skip / next without rating',
  kbd_prev: 'Previous',
  kbd_skip: 'Skip',
  kbd_tab: 'Move between items',
  kbd_rate_list: 'Rate the focused item',
  kbd_clear: "Clear the focused item's rating",
  kbd_next_item: 'Next item',
  kbd_prev_item: 'Previous item',
  kbd_slider_title: 'Slider',
  kbd_step: 'Step lower / higher',
  kbd_bounds: 'Lowest / highest',
  kbd_clear_rating: 'Clear rating',
  btn_got_it: 'Got it',

  // Misc
  btn_ok: 'OK',
  alignment_match: '🎯 Strongest alignment',
  alignment_gaps: '⚡ Biggest gaps — talk about these',
  spider_empty: 'Not enough data yet.',
  item_spider_empty: 'Answer at least 3 items in this category to see a radar chart.',
  restore_title: 'Restore from backup',
  restore_warning:
    'This will replace ALL data currently on this device with the contents of the backup.',
  restore_file_label: 'Backup file (.json)',
  btn_replace_all: 'Replace all data',
  restore_pick_file: 'Pick a file first.',
  restore_invalid: 'Not a valid JSON file.',
  restore_done: 'Backup restored',
  seeded_toast: 'Created from {name} — same questions, your own answers.',
  pick_import_title: 'Pick an import to start from',
  your_version_title: 'Your version of this map',
  your_version_label: 'What do you want to call your map for {name}\'s "{subject}"?',
  btn_create: 'Create',
  enlarge_chart: 'Click to enlarge chart',
  chart_modal_title: 'Chart overview',
  export_mode_title: 'Share / Export',
  export_mode_sub: 'Choose what your counterpart will see after importing:',
  export_unrestricted_title: 'Unrestricted export',
  export_unrestricted_desc:
    'After importing, your counterpart immediately sees the question catalogue (incl. scales and personalisations) and your saved answers.',
  export_restricted_title: 'Restricted export',
  export_restricted_desc:
    'Exports the question catalogue and your answers. The answers are additionally password-protected — your counterpart can answer independently first, then reveal yours for comparison.',
  export_template_title: 'Export as template',
  export_template_desc:
    'Your counterpart receives only the question catalogue (incl. scales and personalisations), without your answers. Great for answering in parallel.',
  export_reveal_pass_label: 'Password to reveal answers',
  export_reveal_pass_confirm_label: 'Repeat password',
  unlock_failed: 'Wrong password or corrupted data.',
  btn_use_as_template: 'Use as template for new card',
  templates_title: '📋 Templates',
  templates_sub: 'Imported question catalogues without answers.',
  no_templates: 'No templates yet.',
  template_warning_title: 'Template-based card',
  template_warning:
    "You are modifying a card that was created from a template. This may cause the question catalogue to no longer be identical to your counterpart's, which can lead to problems with overlapping display or incomplete comparisons.",
  template_warning_disable: "Don't show this warning for this card again",
  btn_continue_anyway: 'Continue anyway',
  pick_template_source_title: 'Use existing card as template',
  pick_template_own: 'Own cards',
  pick_template_imports: 'Imported cards & templates',
  pick_template_source_sub:
    'Choose a card whose structure (categories, questions, scale) to use as template. No answers will be copied.',
  btn_use_existing_template: 'Use existing card as template',
  use_as_template_step1_title: 'Select profile',
  use_as_template_step1_sub: 'Under which profile should the new card be created?',
  btn_start_from_template: 'Start card based on template',
  template_badge: 'Template',
  locked_answers_badge: '🔒 Answers locked',
  btn_unlock_and_compare: 'Unlock & compare',

  // Emoji picker (plan 02-03)
  emoji_picker_label: 'Pick an emoji',
  emoji_picker_free_placeholder: 'or type your own…',

  // Profile form (plan 02-03 — extras not already in v1.0)
  profile_notes_label: 'Notes',
  new_map_btn: '+ New map',
  confirm_delete_profile_title: 'Delete profile?',
  confirm_delete_result_title: 'Delete map?',
  confirm_delete_result: 'This removes the map and all its answers.',

  // Welcome how-to steps (plan 02-03)
  welcome_how_title: 'How it works',
  welcome_how_1: 'Create a profile for yourself.',
  welcome_how_2: 'Start a relationship map for each connection you want to reflect on.',
  welcome_how_3: 'Walk through the categories at your own pace.',
  welcome_how_4: 'Optionally exchange your encrypted bundle with the other person and compare.',

  // Feature cards for Welcome (plan 02-03 — keys matching FEATURES array keys)
  feat_sharing_title: 'Sharing',
  feat_sharing_short: 'Exchange your results to open conversations and find where you are aligned.',
  feat_sharing_body: 'Exchange your results with your counterpart to start a conversation, communicate needs, wishes, and boundaries, and make agreements. Overlaying both maps on a spider chart intuitively shows where you are aligned and where differences may exist.',
  feat_multi_title: 'Multiple Profiles',
  feat_multi_short: 'Keep separate profiles per chapter of life or persona.',
  feat_multi_body: 'Create and manage multiple profiles in a single app. Each profile holds your own answers for a different life context or persona — keeping everything separate and private.',

  // Scale picker (plan 02-04)
  scale_picker_label: 'Answer scale',
  btn_clear: 'Clear',

  // Questionnaire components (plan 02-04)
  item_note_placeholder: 'Note (optional)',
  btn_hide_item: 'Hide this item',
  confirm_hide_item_title: 'Remove this item?',
  confirm_hide_item_body: 'Remove this item from this map? The item and its answer will be permanently deleted for this map.',
  q_back_to_categories: '← Categories',
  q_mode_list: '📋 List',
  q_mode_single: '📱 Single',
  q_nav_see_results: 'See results',
  q_add_custom: '+ Add custom item',
  q_add_custom_title: 'Add a custom item',
  q_add_custom_placeholder: 'Item name…',
  q_add_custom_scale_title: 'Choose a scale for this item',
  q_add_custom_scale_sub: 'By default the map scale is used. You can assign a custom scale to this item.',
  q_add_custom_scale_use_default: 'Use map default scale',
  q_add_custom_scale_customize: 'Customize scale for this item',
  q_item_already_exists: 'An item with that name already exists',
  q_edit_item_scale: 'Edit scale for this item',
  q_edit_item_scale_warning: 'Changing the scale will reset this item\'s answer.',
  q_item_rename_label: 'Custom label (optional)',
  q_item_scale_reset: 'Reset to default scale',
  unlock_answers_btn: 'Unlock answers',
  unlock_answers_title: 'Enter reveal passphrase',
  unlock_answers_sub: 'Enter the reveal passphrase to decrypt the answers in this import.',
  unlock_answers_error: 'Wrong passphrase or corrupted data. Please try again.',
  use_template_step2_title: 'Name your map',
  use_template_start_btn: 'Start map from template',
  wizard_source_blank: 'Start blank',
  wizard_source_blank_sub: 'Create a fresh map from scratch',
  wizard_source_template: 'Use a template',
  wizard_source_template_sub: 'Copy structure from an existing map',
  wizard_pick_template_title: 'Choose a template',
  wizard_pick_own_section: 'Your maps',
  wizard_pick_import_section: 'Imported templates',
  spider_click_to_enlarge: 'Click to enlarge',
  q_overview_title: 'Select categories',
  q_overview_sub: 'Toggle on the dimensions you want to map for this person.',
  q_overview_start: 'Start questionnaire →',

  // Nav / Profile picker (SHELL-03)
  no_profiles_yet: 'No profiles yet — create one to begin.',
  nav_close_menu: 'Close menu',
  nav_open_menu: 'Open menu',
  profile_picker_create_new: '+ New profile',
  profile_picker_label: 'Switch profile',

  // Result charts (plan 02-05)
  result_enlarged_title: 'Map overview',

  // Share / Import / Compare — plan 02-06
  share_sub: 'Encrypt this map with a passphrase. The recipient needs the same passphrase to decrypt.',
  share_passphrase_label: 'Passphrase',
  share_encrypt_btn: 'Encrypt',
  share_copy_done: 'Copied to clipboard.',
  share_passphrase_required: 'Enter a passphrase first.',
  import_sub: 'Paste an encrypted bundle or upload a `.rshape.txt` file.',
  import_btn: 'Decrypt and import',
  compare_too_many_truncated: 'Showing first 4 of {n} comparisons.',
  compare_empty: 'Pick at least two maps to compare.',

  // Settings — plan 02-07 (SETTINGS-01..05)
  settings_theme_title: 'Theme',
  settings_lang_title: 'Language',
  settings_data_title: 'Data management',
  btn_export_backup: 'Export backup (JSON)',
  btn_import_backup: 'Import backup',
  btn_clear_all_data: 'Clear all data',
  backup_exported: 'Backup downloaded.',
  backup_imported: 'Backup imported.',
  backup_restore_confirm_title: 'Restore from backup?',
  backup_restore_confirm_body: 'This will replace ALL current data with the backup contents. This cannot be undone.',
  cleared_all_data: 'All data cleared.',
  clear_all_title: 'Clear all data?',
  clear_all_body: 'This deletes every profile, map, import, and setting. Type DELETE below to confirm.',
  btn_confirm_delete: 'Delete everything',
  scale_step_value: 'Value',
  scale_step_color: 'Colour',
  scale_step_description: 'Description',
  scale_step_add: '+ Add step',
  scale_step_min: 'A scale needs at least 2 steps.',
  map_settings_subject_title: 'Subject',
  map_settings_subject_label: 'Subject label',
  map_settings_cat_title: 'Categories',
  map_settings_cat_sub: 'Toggle categories on or off for this map only.',
  map_settings_cat_hidden_info: 'Hiding a category preserves all its answers — nothing is deleted. You can re-enable any category here at any time.',
  wizard_scale_hint: 'This scale is the default for every item in this map. During answering you can adjust the scale individually per item. The default scale for future maps can be changed any time in Settings.',
  imports_with_answers_title: '📥 Maps with Answers',
  imports_with_answers_sub: 'Imported maps whose answers are visible.',
  imports_locked_title: '🔒 Maps with Locked Answers',
  imports_locked_sub: 'The answers in these maps are encrypted with a second passphrase. Re-import the file with the reveal passphrase to unlock them.',
} as const

export type TranslationKey = keyof typeof EN
