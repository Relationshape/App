// src/lib/i18n/de.ts
// Ported verbatim from public/legacy/js/i18n.js TRANSLATIONS.de (~lines 396-784).
// CORE-06: content-frozen German translation map.
// D-13: typed as Record<TranslationKey, string> — TS compile-fails on any missing key.
//
// Every key here must mirror an EN key. To add or remove a key, update en.ts first
// (the source of truth for TranslationKey), then add the corresponding DE value.

import type { TranslationKey } from './en'

export const DE: Record<TranslationKey, string> = {
  // Nav
  nav_profiles: '👤 Profile',
  nav_import: '📥 Import/Export',
  nav_compare: '📊 Ergebnisse/Vergleichen',
  nav_settings: '⚙️ Einstellungen',
  nav_about: 'Über',
  nav_home: 'Startseite',

  // Home / Welcome
  welcome_title: 'Relationshapes',
  welcome_sub:
    'Ein privater Raum, um deine Beziehungen zu kartieren.\nEure Bedürfnisse. Eure Abmachungen. Eure Form.',
  welcome_cta: '✨ Starte jetzt',
  start_now_new: '✨ Neues Profil',
  start_now_existing: 'Mit bestehendem Profil fortfahren',
  start_now_title: 'Starte deine Beziehungskarte',
  start_now_sub: 'Möchtest du ein neues Profil anlegen oder mit einem bestehenden fortfahren?',
  welcome_about: 'Was ist Relationshapes?',
  welcome_f1: '🔒 Bleibt auf diesem Gerät',
  welcome_f2: '📤 Ende-zu-Ende-verschlüsseltes Teilen',
  welcome_f3: '📊 Kategorie- & Übersichts-Netzdiagramme',
  welcome_f4: '👤 Ein Profil, viele Beziehungen',
  feat_maps_title: 'Beziehungskarten',
  feat_maps_short:
    'Beantworte Fragen und bewerte Beziehungselemente, um eine visuelle Karte jeder Beziehung zu erstellen.',
  feat_maps_body:
    'Reflektiere und gestalte deine Beziehungen indem du Fragen beantwortest und Beziehungselemente für dich in ihrer Wichtigkeit bewertest. Erstelle eine eigene Karte für jede Beziehung, die du reflektieren möchtest, und erhalte verschiedene Aspekte davon grafisch dargestellt.',
  feat_personal_title: 'Personalisierung',
  feat_personal_short:
    'Wähle aus einem umfangreichen Katalog vorgefertigter Fragen und Elemente, oder füge eigene hinzu.',
  feat_personal_body:
    'Es steht dir ein umfangreicher Katalog aus vorgefertigten Fragen und Beziehungselementen zur Auswahl. Diese decken viele mögliche Beziehungsaspekte ab und können individuell ausgewählt oder weggelassen werden. Darüber hinaus stehen dir weitere Personalisierungsmöglichkeiten zur Verfügung. Füge deine eigenen Kategorien hinzu, erstelle neue Elemente und ändere die Antwortskala so, dass sie für dich passt.',
  feat_share_title: 'Teilen',
  feat_share_short:
    'Tausche deine Ergebnisse aus, um ins Gespräch zu kommen und Gemeinsamkeiten zu entdecken.',
  feat_share_body:
    'Tausche deine Ergebnisse mit deinem Gegenüber aus um ins Gespräch zu kommen, Bedürfnisse, Wünsche und Grenzen zu kommunizieren und Abmachungen zu treffen. Das grafische Übereinanderlegen mittels Netzdiagramm zeigt intuitiv, wo ihr aligned seid und wo mögliche Differenzen bestehen. Überarbeite, exportiere und vergleiche auch mehrmals neu.',
  feat_privacy_title: 'Datensicherheit',
  feat_privacy_short:
    'Deine Daten bleiben auf deinem Gerät — vollständig privat, ohne Server oder Tracking.',
  feat_privacy_body:
    'Privatsphäre und Datenschutz geniessen bei uns eine hohe Priorität. Deine Daten gehören dir und liegen lokal auf deinem Gerät, weder wir noch Drittparteien speichern personenbezogene Informationen über dich. Der Austausch und Abgleich deiner Beziehungskarten und beantworteter Fragen erfolgt über einen verschlüsselten Export. Du behältst jederzeit die Kontrolle.',
  feat_security_title: 'Gerätesicherheit',
  feat_security_sub: 'Bleibt auf diesem Gerät',
  feat_charts_title: 'Netzdiagramme',
  feat_charts_sub: 'Visuelle Beziehungskarten',
  feat_profiles_title: 'Dein Profil',
  feat_profiles_sub: 'Ein Profil, alle Karten',
  btn_select_all_continue: 'Alle auswählen & weiter',
  profiles_title: 'Deine Profile',
  profiles_sub:
    'Dein Profil ist deine Identität in der App. Alle deine Beziehungskarten befinden sich hier.',
  new_profile_btn: 'Neues Profil',
  imports_title: '📥 Importierte Ergebnisse',
  imports_sub: 'Verschlüsselte Freigaben von Menschen, denen du vertraust.',
  no_results: 'noch keine Ergebnisse',
  results_count_one: 'Beziehung kartiert',
  results_count_many: 'Beziehungen kartiert',
  imported_on: 'importiert',
  btn_compare: 'Vergleichen',
  btn_delete: 'Löschen',

  // How-to / Walkthrough
  howto_title: "So funktioniert's",
  howto_step1_title: 'Profil erstellen',
  howto_step1_desc:
    'Dein Profil ist deine Identität in der App. Wähle Name, Emoji und Akzentfarbe.',
  howto_step2_title: 'Beziehungskarte starten',
  howto_step2_desc:
    'Für jede Verbindung, über die du nachdenken möchtest, legst du eine neue Karte an – z.B. „Sam, meine beste Freund*in".',
  howto_step3_title: 'Fragebogen ausfüllen',
  howto_step3_desc:
    'Gehe durch 30 Kategorien – emotionale Nähe, körperliche Intimität, Finanzen, gemeinsames Leben u.v.m. Bewerte jedes Element von Nein bis Brauche ich.',
  howto_step4_title: 'Erkunden & teilen',
  howto_step4_desc:
    'Sieh dir Netzdiagramme und Übereinstimmungsübersichten an – und exportiere deine Antworten optional als AES-verschlüsselte Datei. Kein Server, kein Umweg.',
  howto_wizard_btn: '✨ Zeig mir die App',
  howto_wizard_title: 'Kurze Tour',
  howto_wizard_close: "Alles klar, los geht's!",

  // Wizard steps
  wizard_s1_title: 'Willkommen bei Relationshapes 🌷',
  wizard_s1_body:
    'Diese App hilft dir, die Form deiner Beziehungen in vielen Dimensionen zu kartieren: emotionale Nähe, körperliche Intimität, gemeinsames Leben, Finanzen und mehr.',
  wizard_s2_title: 'Alles bleibt privat 🔒',
  wizard_s2_body:
    'Alle Daten werden nur in deinem Browser gespeichert – keine Accounts, keine Server, keine Analyse. Du hast die volle Kontrolle.',
  wizard_s3_title: 'Zuerst ein Profil anlegen 👤',
  wizard_s3_body:
    'Ein Profil repräsentiert dich in der App. Erstelle ein Profil und kartiere damit beliebig viele Beziehungen.',
  wizard_s4_title: 'Beziehungen kartieren 🗺️',
  wizard_s4_body:
    'Für jede Beziehung, über die du nachdenken möchtest, erstelle eine „Beziehungskarte". Gehe durch die Kategorien und bewerte jedes Element – von „Nein" bis „Brauche ich".',
  wizard_s5_title: 'Ergebnisse teilen und importieren 📤',
  wizard_s5_body:
    'Teile deine Eingaben und importiere die Karte deines Gegenübers mit Ende-zu-Ende-Verschlüsselung. Nichts wird an einen Server gesendet – du tauschst eine Datei aus und einigt euch separat auf ein Passwort.',
  wizard_s6_title: 'Vergleichen und Mapping 📊',
  wizard_s6_body:
    'Sieh dir die Antworten deines Gegenübers an und überlagere eure jeweiligen Karten für einen visuellen Vergleich eurer Wünsche und Bedürfnisse.',
  wizard_s7_title: 'In den Einstellungen anpassen ⚙️',
  wizard_s7_body:
    'In den Einstellungen kannst du die Antwortskala anpassen (Beschriftungen, Farben, Anzahl der Stufen) und festlegen, welche Elemente in jeder Kategorie erscheinen – mach es ganz zu deinem eigenen.',
  wizard_prev: '← Zurück',
  wizard_next: 'Weiter →',
  wizard_finish: "Los geht's! ✨",
  wizard_skip: 'Einleitung überspringen',

  // Profile edit
  profile_new_title: 'Neues Profil',
  profile_edit_title: 'Profil bearbeiten',
  profile_name_label: 'Anzeigename',
  profile_name_placeholder: 'z.B. Alex',
  profile_pronouns_label: 'Pronomen',
  profile_pronouns_placeholder: 'sie / ihr · er / ihm · they / them · …',
  profile_emoji_label: 'Avatar-Emoji',
  profile_emoji_pick: '✨ Auswählen',
  profile_color_label: 'Akzentfarbe',
  btn_save: 'Speichern',
  btn_create_profile: 'Profil erstellen',
  btn_cancel: 'Abbrechen',
  btn_delete_profile: 'Profil löschen',
  confirm_delete_profile:
    'Dieses Profil und alle Antworten löschen? Das kann nicht rückgängig gemacht werden.',

  // Profile detail
  maps_title: 'Beziehungskarten',
  maps_sub:
    'Eine Karte pro Beziehung, über die du nachdenken möchtest. Du kannst sie jederzeit erneut besuchen und aktualisieren.',
  btn_new_map: '➕ Neue Beziehungskarte starten',
  btn_edit: '✏️ Bearbeiten',
  updated: 'Aktualisiert',
  answers: 'Antworten',
  btn_continue: 'Weiter',
  btn_view: '📊 Ansehen',
  btn_share: '📤 Teilen',
  confirm_delete_map: 'Diese Beziehungskarte löschen?',

  // New result
  new_map_title: 'Neue Beziehungskarte starten',
  start_blank_title: 'Leer beginnen',
  start_blank_desc:
    'Standardskala; du kannst optional auswählen, auf welche Kategorien du dich konzentrieren möchtest.',
  start_import_title: 'Aus importiertem Ergebnis starten',
  start_import_desc:
    'Übernimmt Skala, Kategorien und benutzerdefinierte Elemente der anderen Person.',
  start_import_desc_count_one: 'Import verfügbar.',
  start_import_desc_count_many: 'Importe verfügbar.',

  // Questionnaire
  q_category: 'Kategorie',
  q_of: 'von',
  q_item: 'Element',
  btn_previous: '← Zurück',
  btn_skip_results: 'Zu den Ergebnissen',
  btn_next: 'Weiter →',
  btn_finish: 'Fertig ✨',
  btn_back: '← Zurück',
  btn_skip: 'Überspringen →',
  btn_add_custom: '➕ Eigenes Element hinzufügen',
  add_custom_title: 'Eigenes Element hinzufügen',
  add_custom_label: 'Name des neuen Elements',
  add_custom_placeholder: 'z.B. Astronomie',
  btn_add: 'Hinzufügen',
  item_already_exists: 'Dieses Element existiert bereits.',
  lbl_giving: 'Geben',
  lbl_receiving: 'Empfangen',
  q_slider_reset: '↺ Zurücksetzen',
  custom_tag: 'eigenes',
  note_placeholder: 'Notiz (optional)…',
  btn_results: '📊 Ergebnisse',
  q_done_title: 'Alles erledigt ✨',
  q_done_body: 'Du hast alle Elemente durchgegangen. Sieh dir deine Karte unten an.',
  btn_start_over: 'Neu beginnen',
  btn_see_results: '📊 Ergebnisse ansehen',

  // Onboarding category picker
  onboarding_title: 'Kategorien auswählen',
  onboarding_sub:
    'Wähle die Themenbereiche, die du für diese Beziehung erkunden möchtest. Du kannst später weitere hinzufügen.',
  btn_skip_onboarding: 'Überspringen – alles einschließen',
  btn_start_map: 'Karte mit diesen Kategorien beginnen',
  btn_add_categories: 'Weitere Kategorien hinzufügen',
  onboarding_empty_warning: 'Bitte wähle mindestens eine Kategorie aus, um fortzufahren.',

  // Age gate
  age_gate_title: 'Diese App richtet sich an Erwachsene',
  age_gate_body:
    'Relationshapes enthält Themen intimer und sexueller Natur. Bitte bestätige, dass du 18 Jahre oder älter bist.',
  age_gate_yes: 'Ja, ich bin 18 Jahre oder älter',
  age_gate_no: 'Nein, ich bin unter 18',
  age_gate_stop: 'Entschuldige — diese App ist für 18+. Komm bitte zurück, wenn du älter bist.',

  // Result view
  result_last_edited: 'zuletzt bearbeitet',
  btn_map_settings: '⚙️ Karten-Einstellungen',
  btn_continue_editing: '✏️ Weiter bearbeiten',
  result_category_overview: 'Kategorieübersicht',
  result_category_overview_sub:
    'Durchschnitt pro Kategorie — je weiter außen, desto wichtiger im Schnitt.',
  compare_with: 'Mit jemandem vergleichen',
  compare_own_maps: 'Eigene Karten übereinander legen',
  compare_imports_title: 'Mit importierten Karten vergleichen',
  btn_import_map: '📥 Importieren...',
  by_category: 'Nach Kategorie',
  by_category_sub:
    'Öffne eine Karte, um ein Netzdiagramm der Elemente und die zugrunde liegende Aufschlüsselung zu sehen.',
  no_compare:
    'Erstelle eine weitere Beziehungskarte oder importiere eine geteilte, um zu vergleichen.',

  // Category modal tabs
  tab_spider: 'Netzdiagramm',
  tab_items: 'Element für Element',
  tab_edit: 'Antworten bearbeiten',
  tab_categories: 'Elementansicht',
  btn_close: 'Schließen',
  btn_save_changes: 'Änderungen speichern',
  btn_remove_item: 'Entfernen',
  confirm_save_changes: 'Die vorgenommenen Änderungen an diesen Antworten speichern?',
  confirm_discard_changes: 'Du hast ungespeicherte Änderungen. Verwerfen?',
  btn_discard: 'Verwerfen',

  // Compare
  compare_title: '📊 Vergleichen',
  compare_sub:
    'Wähle bis zu vier Ergebnisse zum Überlagern aus. Öffne eine Kategorie für ein Netzdiagramm.',
  compare_import_btn: 'Ergebnis importieren',
  compare_import_title: 'Ergebnis importieren',
  compare_own_section: 'Eigene Karten',
  compare_imported_section: 'Importierte Ergebnisse',
  compare_selected_of: '{n} von 4 ausgewählt',
  compare_max_hint: 'Es können bis zu 4 Karten gleichzeitig überlagert werden.',
  compare_select: 'Wähle oben Ergebnisse aus.',
  alignment_title: 'Übereinstimmungsübersicht',
  cat_details_title: 'Kategorie-Details',
  cat_details_sub: 'Jede Karte öffnet ein Netzdiagramm der enthaltenen Elemente.',
  compare_fabi_tip:
    'Tipp: Aktiviere den „Fabi-Modus" in den Einstellungen für ein Übersichts-Spinnendiagramm. Wähle unten eine Kategorie für einen detaillierten Item-Vergleich.',

  // New card scale dialog
  new_card_scale_title: 'Skala für diese Karte',
  new_card_scale_sub: 'Verwende die Standardskala oder passe sie nur für diese Karte an.',
  new_card_scale_use: 'Standard verwenden',
  new_card_scale_customize: 'Anpassen…',
  new_card_scale_confirm: 'Diese Skala verwenden',

  // Per-item scale
  item_edit_scale: 'Element/Skala bearbeiten',
  item_scale_change_warning:
    'Dieses Element hat bereits eine Antwort. Das Ändern der Skala löscht diese. Fortfahren?',
  q_single_hint_mobile: 'Links/rechts wischen für vorherige/nächste Frage',
  q_single_hint_desktop: 'Pfeiltasten ← → zum Navigieren zwischen den Fragen',
  btn_categories: 'Kategorien',

  // Share
  share_title: '📤 Ergebnis verschlüsselt teilen',
  share_intro:
    'Deine Antworten werden verpackt und mit einem Passwort verschlüsselt. Setze dazu das Passwort und sende den anschliessend generierten Text über einen beliebigen Kanal deinem Gegenüber. Teile anschliessend das Passwort separat (z.B. per Telefon oder persönlich) um maximale Datensicherheit zu garantieren. Für einen erfolgreichen Import wird beides benötigt.',
  share_intro_separately: '',
  share_intro_rest: '',
  share_callout_title: '🔐 Kein Server, keine Spuren.',
  share_callout_body:
    'Die Verschlüsselung findet auf diesem Gerät statt. Das Passwort verlässt nie deinen Kopf.',
  share_pass_label: 'Passwort',
  share_pass_confirm_label: 'Passwort wiederholen',
  btn_encrypt: '🔒 Verschlüsseln & Freigabe erstellen',
  share_bundle_title: 'Dein verschlüsseltes Paket',
  share_bundle_sub: 'Kopiere diesen Text oder lade die Datei herunter. Halte das Passwort separat.',
  btn_copy: '📋 Text kopieren',
  btn_download: '💾 Datei herunterladen',
  pass_too_short: 'Bitte wähle mindestens 6 Zeichen.',
  pass_mismatch: 'Die beiden Passwörter stimmen nicht überein.',

  // Import
  import_title: '📥 Ergebnis eines Gegenübers importieren',
  import_intro:
    'Um eine Karte von jemand anderem zu erhalten, kopiere den verschlüsselten Text und füge ihn ein, oder lade ihn als .rshape.txt Datei hoch. Gib danach das Passwort ein, mit dem dein Gegenüber die Daten verschlüsselt hat.',
  import_section2_title: 'Eigene Daten teilen / sicherer Export',
  import_section2_text:
    'Um eine Karte mit jemand anderem zu teilen, kannst du hier deine Beziehungskarten mit allen Fragen/Antworten exportieren.',
  import_bundle_label: 'Verschlüsseltes Paket',
  import_file_label: 'Oder Datei laden',
  import_pass_label: 'Passwort',
  btn_decrypt: '🔓 Entschlüsseln & importieren',
  import_empty: 'Füge zuerst ein verschlüsseltes Paket ein.',
  import_wrong_type: 'Dieses Paket ist kein Relationshapes-Ergebnis.',
  import_failed_title: 'Import fehlgeschlagen',
  import_no_results: 'Noch keine Ergebnisse zum Exportieren.',
  q_keyboard_tip:
    '⌨️ Tipp: Fokussiere eine Frage und drücke 1–{n} zum Bewerten, {m} zum Überspringen, Enter zum Weiter.',
  q_mobile_tip:
    'Tipp: Wechsle oben links in den Single-Modus um die Fragen einzeln zu beantworten und durch Swipen hin und her zu wechseln.',
  imported_toast: 'Importiert ✔',
  imported_versioned_toast: 'Als v{n} importiert ✔',

  // Settings
  settings_title: '⚙️ Einstellungen',
  settings_appearance: 'Erscheinungsbild',
  settings_display_modes: 'Anzeigemodi',
  fabi_mode_title: 'Fabi-Modus',
  fabi_mode_desc:
    'Zeigt ein Kategoriedurchschnitts-Netzdiagramm auf den Ergebnis- und Vergleichsseiten sowie kleine Kategorie-Zusammenfassungschips auf den Karten. Standardmäßig deaktiviert, da das Mitteln über sehr unterschiedliche Elemente irreführend sein kann.',
  settings_scale_title: 'Standard Antwortskala',
  settings_scale_sub:
    'Setzt die Standard-Bewertungs-Skala für künftige Beziehungskarten. Bisher erstellte Karten behalten ihre eigene Kopie der Skala – die Änderung betrifft nur die zukünftige Beantwortung. Verwende die Pfeile, um die Reihenfolge der Stufen anzupassen.',
  btn_add_step: '➕ Stufe hinzufügen',
  btn_reset_defaults: 'Auf Standard zurücksetzen',
  confirm_reset_scale: 'Die Skala auf die Standard-7-Stufen zurücksetzen?',
  settings_data: 'Daten',
  btn_backup: '💾 Lokales Backup herunterladen',
  btn_restore: '📂 Aus Backup wiederherstellen',
  btn_erase: '🗑 Alle lokalen Daten löschen',
  confirm_erase:
    'ALLE Daten auf diesem Gerät löschen – Profile, Karten, Importe, Einstellungen? Das kann nicht rückgängig gemacht werden.',
  lang_label: 'Sprache',
  theme_auto: '🖥 Auto (Systemeinstellung)',
  theme_light: '☀️ Hell',
  theme_dark: '🌙 Dunkel',

  // Scale editor
  scale_step_label: 'Langer Name',
  scale_step_short: 'Kurz',
  scale_step_desc: 'Tooltip / Beschreibung',
  scale_step_new: 'Neue Stufe',
  scale_step_remove_confirm:
    'Die Stufe „{label}" wird in einigen Antworten verwendet. Das Entfernen löscht diese Antworten. Fortfahren?',
  scale_col_color: 'Farbe',
  scale_col_label: 'Bezeichnung',
  scale_col_short: 'Kurzform',

  // Map settings
  map_settings_title: '⚙️ Karten-Einstellungen',
  map_settings_identity: 'Identität',
  map_settings_identity_sub: 'Visuelle Identität dieser Beziehungskarte.',
  map_name_label: 'Kartenname (Thema)',
  map_emoji_label: 'Avatar-Emoji',
  map_emoji_change: '· zum Ändern klicken',
  map_color_label: 'Akzentfarbe',
  map_scale_title: 'Antwortskala (nur diese Karte)',
  map_scale_sub: 'Diese Stufen werden mit der Karte gespeichert und beim Teilen mitgeschickt.',
  map_cats_title: 'Kategorien',
  map_cats_sub: 'Schalte ein, welche Kategorien diese Karte abfragen soll.',
  map_asked_items_notice:
    'Diese Karte wurde aus einem Import gestartet. Sie fragt standardmäßig nur die Elemente ab, die die andere Person beantwortet hat.',
  btn_ask_all: 'Alle Elemente in aktivierten Kategorien abfragen',
  confirm_ask_all: 'Diese Karte auf alle Elemente in den aktivierten Kategorien erweitern?',

  // About
  about_title: 'Über Relationshapes',
  about_p1:
    'Relationshapes ist ein Kommunikationswerkzeug, das dabei hilft, Beziehungen nach den tatsächlichen Bedürfnissen und Wünschen aller Beteiligten zu gestalten – unabhängig von gesellschaftlichen Normen oder Hierarchien.',
  about_p2:
    'Es kommt aus der Welt der Beziehungsanarchie und wurde inspiriert von Andie Nordgrens Manifest, dem Smorgasbord der Beziehungsanarchie, sowie Büchern wie Polysecure (Jessica Fern) und More than Two (Eve Rickert & Franklin Veaux).',
  about_philosophy_title: 'Philosophie',
  about_philosophy:
    'Beziehungen verändern sich mit der Zeit. Relationshapes anerkennt das gesamte Spektrum menschlicher Verbindungen – romantisch, platonisch, sexuell, kinky, familiär – ohne Hierarchien oder Einheitsmodelle vorzuschreiben. Das Werkzeug ist eine Einladung, es frei zu bearbeiten, zu ergänzen, zu streichen und anzupassen. Die Urheber*innen sind explizit: Es kann niemals eine Universallösung sein, und jede Person bringt ihre eigene Prägung in diese Gespräche mit.',
  about_how_title: 'So wird die App verwendet',
  about_how_1: 'Erstelle ein Profil für dich.',
  about_how_2: 'Starte für jede Beziehung, über die du nachdenken möchtest, eine Beziehungskarte.',
  about_how_3: 'Gehe die Kategorien in deinem eigenen Tempo durch. Nutze',
  about_how_3b: '(oder deine eigene Skala), um die Wichtigkeit jedes Elements zu markieren.',
  about_how_4:
    'Öffne in der Ergebnisansicht eine Kategorie, um ein Netzdiagramm ihrer Elemente zu sehen.',
  about_how_5:
    'Tausche optional dein verschlüsseltes Paket mit der anderen Person aus und vergleiche.',
  about_approach_title: 'Empfohlene Vorgehensweise',
  about_approach_1:
    'Lies zunächst alle Kategorien einmal durch, bevor du anfängst zu antworten – manche Begriffe profitieren von einer gemeinsamen Definition vorab.',
  about_approach_2:
    'Füll es unabhängig voneinander aus und vergleicht und besprecht eure Antworten dann gemeinsam.',
  about_approach_3:
    'Kehre von Zeit zu Zeit zurück – etwa alle sechs Monate ist ein guter Rhythmus, da sich Bedürfnisse und Beziehungen weiterentwickeln.',
  about_privacy_title: 'Datenschutz',
  about_privacy:
    'Alles bleibt im lokalen Speicher deines Browsers auf diesem Gerät. Die App hat kein Backend. Geteilte Pakete werden mit AES-GCM (256-Bit) verschlüsselt, wobei der Schlüssel über PBKDF2 aus deinem Passwort abgeleitet wird (250.000 Iterationen).',
  about_credits_title: 'Credits & Lizenz',
  about_credits:
    'Der Relationshapes-Fragebogen und das Konzept stammen von Anne Lüscher (sie/ihr) und Benjamin Frey (er/ihm), veröffentlicht unter CC BY-NC 4.0 – kostenlos teilbar und anpassbar für nicht-kommerzielle Zwecke mit Namensnennung.',
  about_credits_repo: 'Original-Repository',
  about_credits_unofficial:
    'Diese App ist eine inoffizielle Implementierung, um das Werkzeug interaktiver und zugänglicher zu machen.',
  about_contact_title: 'Kontakt',
  about_contact: 'Fragen und Feedback sind willkommen unter',
  about_ai_title: 'Transparenz zur Verwendung von KI-Tools',
  about_ai_text:
    'Diese App wurde mithilfe von Claude Code programmiert. Die ursprüngliche Idee, die Struktur der App, sowie alle Elemente, Fragen und Texte entstammen jedoch zu 100% der Arbeit der Urheber*innen, sowie den Erfahrungswelten der breiteren Community.',

  // Keyboard help
  kbd_title: 'Tastaturkürzel',
  kbd_sub: 'Funktioniert auf dem Desktop in beiden Fragebogen-Modi.',
  kbd_single_title: 'Einzelmodus (ein Element nach dem anderen)',
  kbd_list_title: 'Listenmodus (alle Elemente einer Kategorie)',
  kbd_rate: 'Mit dieser Stufe bewerten (kurz angezeigt, dann automatisch weiter)',
  kbd_skip_next: 'Überspringen / Weiter ohne Bewertung',
  kbd_prev: 'Zurück',
  kbd_skip: 'Überspringen',
  kbd_tab: 'Zwischen Elementen wechseln',
  kbd_rate_list: 'Fokussiertes Element bewerten',
  kbd_clear: 'Bewertung des fokussierten Elements löschen',
  kbd_next_item: 'Nächstes Element',
  kbd_prev_item: 'Vorheriges Element',
  kbd_slider_title: 'Schieberegler',
  kbd_step: 'Stufe niedriger / höher',
  kbd_bounds: 'Niedrigste / Höchste',
  kbd_clear_rating: 'Bewertung löschen',
  btn_got_it: 'Verstanden',

  // Misc
  btn_ok: 'OK',
  alignment_match: '🎯 Stärkste Übereinstimmung',
  alignment_gaps: '⚡ Größte Unterschiede – darüber reden',
  spider_empty: 'Noch nicht genug Daten.',
  item_spider_empty:
    'Beantworte mindestens 3 Elemente in dieser Kategorie, um ein Netzdiagramm zu sehen.',
  restore_title: 'Aus Backup wiederherstellen',
  restore_warning:
    'Alle aktuellen Daten auf diesem Gerät werden durch den Inhalt des Backups ersetzt.',
  restore_file_label: 'Backup-Datei (.json)',
  btn_replace_all: 'Alle Daten ersetzen',
  restore_pick_file: 'Zuerst eine Datei auswählen.',
  restore_invalid: 'Keine gültige JSON-Datei.',
  restore_done: 'Backup wiederhergestellt',
  seeded_toast: 'Aus {name} erstellt – gleiche Fragen, deine eigenen Antworten.',
  pick_import_title: 'Import auswählen',
  your_version_title: 'Deine Version dieser Karte',
  your_version_label: 'Wie möchtest du deine Karte für {name}s "{subject}" nennen?',
  btn_create: 'Erstellen',
  enlarge_chart: 'Zum Vergrößern klicken',
  chart_modal_title: 'Diagramm-Übersicht',
  export_mode_title: 'Teilen / Exportieren',
  export_mode_sub: 'Wähle, was dein Gegenüber nach dem Import sehen soll:',
  export_unrestricted_title: 'Uneingeschränkt exportieren',
  export_unrestricted_desc:
    'Dein Gegenüber sieht nach dem Import neben dem Fragenkatalog (inkl. Skalen und Personalisierungen) auch sofort deine bisher gespeicherten Antworten.',
  export_restricted_title: 'Eingeschränkt exportieren',
  export_restricted_desc:
    'Exportiert den Fragenkatalog und deine Antworten. Die Antworten sind jedoch zusätzlich passwortgeschützt — dein Gegenüber kann zuerst unabhängig antworten und danach die Antworten einsehen.',
  export_template_title: 'Als Vorlage exportieren',
  export_template_desc:
    'Dein Gegenüber erhält nur den Fragenkatalog (inkl. Skalen und Personalisierungen), ohne deine Antworten. Ideal, um parallel zu antworten.',
  export_reveal_pass_label: 'Passwort zum Anzeigen der Antworten',
  export_reveal_pass_confirm_label: 'Passwort wiederholen',
  unlock_failed: 'Falsches Passwort oder fehlerhafte Daten.',
  btn_use_as_template: 'Als Vorlage für neue Karte verwenden',
  templates_title: '📋 Vorlagen',
  templates_sub: 'Importierte Fragenkataloge ohne Antworten.',
  no_templates: 'Noch keine Vorlagen.',
  template_warning_title: 'Vorlagenbasierte Karte',
  template_warning:
    'Du änderst eine auf einer Vorlage basierende Karte. Dies kann dazu führen, dass der Fragenkatalog nicht mehr identisch mit deinem Gegenüber ist und zu Problemen bei der überlappenden Darstellung oder inkompletten Vergleichen führen.',
  template_warning_disable: 'Diese Warnung für diese Karte nicht mehr anzeigen',
  btn_continue_anyway: 'Trotzdem fortfahren',
  pick_template_source_title: 'Bestehende Karte als Vorlage',
  pick_template_own: 'Eigene Karten',
  pick_template_imports: 'Importierte Karten & Vorlagen',
  pick_template_source_sub:
    'Wähle eine Karte, deren Struktur (Kategorien, Fragen, Skala) als Vorlage dienen soll. Antworten werden nicht übernommen.',
  btn_use_existing_template: 'Bestehende Karte als Vorlage verwenden',
  use_as_template_step1_title: 'Profil auswählen',
  use_as_template_step1_sub: 'Unter welchem Profil soll die neue Karte erstellt werden?',
  btn_start_from_template: 'Karte basierend auf Vorlage starten',
  template_badge: 'Vorlage',
  locked_answers_badge: '🔒 Antworten gesperrt',
  btn_unlock_and_compare: 'Entsperren & vergleichen',

  // Emoji picker (plan 02-03)
  emoji_picker_label: 'Wähle ein Emoji',
  emoji_picker_free_placeholder: 'oder gib eines ein…',

  // Profile form (plan 02-03 — extras)
  profile_notes_label: 'Notizen',
  new_map_btn: '+ Neue Karte',
  confirm_delete_profile_title: 'Profil löschen?',
  confirm_delete_result_title: 'Karte löschen?',
  confirm_delete_result: 'Das löscht die Karte und alle ihre Antworten.',

  // Welcome how-to steps (plan 02-03)
  welcome_how_title: 'So funktioniert\'s',
  welcome_how_1: 'Erstelle ein Profil für dich.',
  welcome_how_2: 'Starte für jede Beziehung, über die du nachdenken möchtest, eine Beziehungskarte.',
  welcome_how_3: 'Gehe die Kategorien in deinem eigenen Tempo durch.',
  welcome_how_4: 'Tausche optional dein verschlüsseltes Paket mit der anderen Person aus und vergleiche.',

  // Feature cards for Welcome (plan 02-03)
  feat_sharing_title: 'Teilen',
  feat_sharing_short: 'Tausche deine Ergebnisse aus, um ins Gespräch zu kommen und Gemeinsamkeiten zu entdecken.',
  feat_sharing_body: 'Tausche deine Ergebnisse mit deinem Gegenüber aus um ins Gespräch zu kommen, Bedürfnisse, Wünsche und Grenzen zu kommunizieren und Abmachungen zu treffen. Das grafische Übereinanderlegen mittels Netzdiagramm zeigt intuitiv, wo ihr aligned seid und wo mögliche Differenzen bestehen.',
  feat_multi_title: 'Ein Profil',
  feat_multi_short: 'Ein Profil, unbegrenzte Beziehungskarten.',
  feat_multi_body: 'Erstelle ein einziges Profil, das dich repräsentiert, und kartiere damit beliebig viele Beziehungen. Jede Beziehungskarte ist separat und privat — alles an einem Ort.',

  // Scale picker (plan 02-04)
  scale_picker_label: 'Antwortskala',
  btn_clear: 'Löschen',

  // Questionnaire components (plan 02-04)
  item_note_placeholder: 'Notiz (optional)',
  btn_hide_item: 'Diesen Punkt ausblenden',
  confirm_hide_item_title: 'Element entfernen?',
  confirm_hide_item_body: 'Dieses Element für diese Karte entfernen? Das Element und die Antwort wird für diese Karte permanent gelöscht.',
  q_back_to_categories: '← Kategorien',
  q_mode_list: '📋 Liste',
  q_mode_single: '📱 Einzeln',
  q_nav_see_results: 'Ergebnisse anzeigen',
  q_add_custom: '+ Eigenen Punkt hinzufügen',
  q_add_custom_title: 'Eigenen Punkt hinzufügen',
  q_add_custom_placeholder: 'Name des Punkts…',
  q_add_custom_scale_title: 'Skala für diesen Punkt wählen',
  q_add_custom_scale_sub: 'Standardmässig wird die Karten-Skala verwendet. Du kannst diesem Punkt eine eigene Skala zuweisen.',
  q_add_custom_scale_use_default: 'Standard-Skala der Karte verwenden',
  q_add_custom_scale_customize: 'Eigene Skala für diesen Punkt',
  q_item_already_exists: 'Ein Punkt mit diesem Namen existiert bereits',
  q_edit_item_scale: 'Skala für diesen Punkt anpassen',
  q_edit_item_scale_warning: 'Eine neue Skala setzt die Antwort dieses Punkts zurück.',
  q_item_rename_label: 'Eigene Bezeichnung (optional)',
  q_item_scale_reset: 'Standard-Skala verwenden',
  unlock_answers_btn: 'Antworten entsperren',
  unlock_answers_title: 'Entsperr-Passwort eingeben',
  unlock_answers_sub: 'Gib das Entsperr-Passwort ein, um die Antworten dieses Imports freizuschalten.',
  unlock_answers_error: 'Falsches Passwort oder fehlerhafte Daten. Bitte erneut versuchen.',
  use_template_step2_title: 'Karte benennen',
  use_template_start_btn: 'Karte basierend auf Vorlage starten',
  wizard_source_blank: 'Leer beginnen',
  wizard_source_blank_sub: 'Neue Karte von Grund auf erstellen',
  wizard_source_template: 'Vorlage verwenden',
  wizard_source_template_sub: 'Struktur einer bestehenden Karte übernehmen',
  wizard_pick_template_title: 'Vorlage auswählen',
  wizard_pick_own_section: 'Eigene Karten',
  wizard_pick_import_section: 'Importierte Vorlagen',
  spider_click_to_enlarge: 'Zum Vergrößern klicken',
  spider_hover_hint: 'Über einen Netzpunkt hovern, um das Element genauer zu inspizieren',
  q_overview_title: 'Kategorien auswählen',
  q_overview_sub: 'Schalte die Dimensionen ein, die du für diese Person abbilden willst.',
  q_overview_start: 'Fragebogen starten →',
  pre_share_title: 'Zuerst als Vorlage teilen?',
  pre_share_body: 'Bevor du mit der Beantwortung beginnst, willst du den zusammengestellten Fragebogen bereits mit jemandem als Vorlage teilen, damit dein Gegenüber dieselben Fragen beantworten kann? Hinweis: Du kannst diesen Schritt auch später noch auslösen, indem du in deiner Übersicht bei dieser Karte auf „Teilen" klickst, wobei du auswählen kannst, ob du die Karte als leere Vorlage oder mit deinen Antworten teilen möchtest.',
  pre_share_skip: 'Überspringen',
  pre_share_share_btn: 'Als Vorlage teilen',

  // Nav / Profile picker (SHELL-03)
  no_profiles_yet: 'Noch keine Profile — leg eines an, um zu starten.',
  nav_close_menu: 'Menü schließen',
  nav_open_menu: 'Menü öffnen',
  profile_picker_create_new: '+ Neues Profil',
  profile_picker_label: 'Profil wechseln',

  // Result charts (plan 02-05)
  result_enlarged_title: 'Karten-Übersicht',

  // Share / Import / Compare — plan 02-06
  share_sub: 'Verschlüssle diese Karte mit einer Passphrase. Der Empfänger braucht die gleiche Passphrase.',
  share_passphrase_label: 'Passphrase',
  share_encrypt_btn: 'Verschlüsseln',
  share_copy_done: 'In die Zwischenablage kopiert.',
  share_passphrase_required: 'Bitte zuerst eine Passphrase eingeben.',
  import_sub: 'Füge ein verschlüsseltes Bündel ein oder lade eine `.rshape.txt` Datei hoch.',
  import_btn: 'Entschlüsseln & importieren',
  compare_too_many_truncated: 'Erste 4 von {n} Vergleichen angezeigt.',
  compare_empty: 'Wähle mindestens zwei Karten zum Vergleichen.',

  // Settings — plan 02-07 (SETTINGS-01..05)
  settings_theme_title: 'Design',
  settings_lang_title: 'Sprache',
  settings_data_title: 'Datenverwaltung',
  btn_export_backup: 'Backup exportieren (JSON)',
  btn_import_backup: 'Backup importieren',
  btn_clear_all_data: 'Alle Daten löschen',
  backup_exported: 'Backup heruntergeladen.',
  backup_imported: 'Backup importiert.',
  backup_restore_confirm_title: 'Backup wiederherstellen?',
  backup_restore_confirm_body: 'Das ersetzt ALLE aktuellen Daten durch den Backup-Inhalt. Das ist nicht rückgängig zu machen.',
  cleared_all_data: 'Alle Daten gelöscht.',
  clear_all_title: 'Alle Daten löschen?',
  clear_all_body: 'Das löscht alle Profile, Karten, Importe und Einstellungen. Gib DELETE ein, um zu bestätigen.',
  btn_confirm_delete: 'Alles löschen',
  scale_step_value: 'Wert',
  scale_step_color: 'Farbe',
  scale_step_description: 'Beschreibung',
  scale_step_add: '+ Schritt hinzufügen',
  scale_step_min: 'Eine Skala braucht mindestens 2 Schritte.',
  map_settings_subject_title: 'Thema',
  map_settings_subject_label: 'Bezeichnung',
  map_settings_cat_title: 'Kategorien',
  map_settings_cat_sub: 'Schalte Kategorien nur für diese Karte ein oder aus.',
  map_settings_cat_hidden_info: 'Ausgeblendete Kategorien behalten alle ihre Antworten — es wird nichts gelöscht. Über die Schaltfläche unten kann eine Kategorie wieder zur Karte hinzugefügt werden.',
  map_scale_use_global: 'Standard-Antwortskala verwenden',
  map_scale_clear_override: 'Anpassung zurücksetzen',
  map_scale_using_global: 'Standard-Antwortskala aktiv ({n} Stufen).',
  map_settings_add_cat: '➕ Kategorie neu zur Karte hinzufügen',
  wizard_scale_hint: 'Diese Skala gilt standardmässig für alle Elemente dieser Karte. Beim Beantworten kannst du die Skala für jedes Element individuell anpassen. Die Standard-Skala für zukünftige Karten kannst du jederzeit in den Einstellungen ändern.',
  imports_with_answers_title: '📥 Karten mit Antworten',
  imports_with_answers_sub: 'Importierte Karten, deren Antworten sichtbar sind.',
  imports_locked_title: '🔒 Karten mit gesperrten Antworten',
  imports_locked_sub: 'Die Antworten in diesen Karten sind mit einem zweiten Passwort verschlüsselt. Importiere die Datei erneut mit dem Freigabe-Passwort, um sie zu entsperren.',
  imports_section_title: '📥 Importierte Karten',
  btn_import_cards: '📥 Karten von einem Gegenüber empfangen / importieren',
  cat_details_filter_hint: 'Es werden nur diejenigen Kategorien angezeigt, welche in allen zum Vergleich ausgewählten Karten mindestens eine Antwort enthalten.',
  wizard_pick_imported_maps_section: 'Importierte Karten',

  // Custom item format picker
  q_add_custom_format_title: 'Antwortformat wählen',
  q_format_scale: 'Skala',
  q_format_scale_desc: 'Auf einer Skala bewerten',
  q_format_text: 'Freitext',
  q_format_text_desc: 'Freie Texteingabe',
  q_format_single: 'Einzelauswahl',
  q_format_single_desc: 'Genau eine Option auswählen',
  q_format_multi: 'Mehrfachauswahl',
  q_format_multi_desc: 'Eine oder mehrere Optionen auswählen',
  q_format_ranking: 'Ranking',
  q_format_ranking_desc: 'Optionen in eine Reihenfolge bringen',
  q_add_custom_options_title: 'Optionen definieren',
  q_add_custom_options_sub: 'Eine Option pro Zeile eingeben (min. 2)',
  q_add_custom_options_min: 'Bitte mindestens 2 Optionen eingeben.',
  q_text_answer_placeholder: 'Deine Antwort…',
  item_rename_btn: '✏️ Umbenennen',
  q_edit_format_section: 'Antwortformat',
  q_edit_format_change_warn: 'Das Format zu ändern löscht die bestehende Antwort für dieses Element.',
  q_edit_format_options_label: 'Optionen (eine pro Zeile, min. 2)',
  q_edit_format_options_min: 'Bitte mindestens 2 Optionen eingeben.',
}
