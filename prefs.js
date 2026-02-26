import Gio from 'gi://Gio'
import Adw from 'gi://Adw'
import Gtk from 'gi://Gtk'
import {
    ExtensionPreferences,
    gettext as _
} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js'
import { getExtensionCacheDir, fileBasedCache } from './cache.js'

export default class AutoAccentColourPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        window._settings = this.getSettings()
        const settings = window._settings
        const iconsDir = `${this.path}/icons`

        function getIcon(iconName) {
            return new Gtk.Image({
                gicon: Gio.icon_new_for_string(`${iconsDir}/${iconName}.svg`)
            })
        }

        // Settings page ///////////////////////////////////////////////////////

        const settingsPage = new Adw.PreferencesPage({
            title: _('Settings'),
            icon_name: 'applications-system-symbolic'
        })
        window.add(settingsPage)

        const appearanceGroup = new Adw.PreferencesGroup({
            title: _('Appearance')
        })
        settingsPage.add(appearanceGroup)

        const indicatorRow = new Adw.SwitchRow({
            title: _('Hide Indicator')
        })
        appearanceGroup.add(indicatorRow)

        const paletteGroup = new Adw.PreferencesGroup({
            title: _('Colour Palette'),
            description: _(
                'Choose the type of background colour to base the shell accent colour from'
            )
        })
        settingsPage.add(paletteGroup)

        const dominantColourRadio = new Gtk.CheckButton({
            valign: Gtk.Align.CENTER
        })
        const dominantColourRow = new Adw.ActionRow({
            title: _('Dominant'),
            subtitle: _('Use the most frequent colour from the background'),
            activatable_widget: dominantColourRadio
        })
        dominantColourRow.add_prefix(dominantColourRadio)
        paletteGroup.add(dominantColourRow)

        const highlightColourRadio = new Gtk.CheckButton({
            valign: Gtk.Align.CENTER,
            group: dominantColourRadio
        })
        const highlightColourRow = new Adw.ActionRow({
            title: _('Highlight'),
            subtitle: _(
                'Use a contrasting yet complimentary colour from the background. \
This may sometimes be the same as the dominant colour.'
            ),
            activatable_widget: highlightColourRadio
        })
        highlightColourRow.add_prefix(highlightColourRadio)
        paletteGroup.add(highlightColourRow)

        window._settings.bind(
            'hide-indicator',
            indicatorRow,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        )

        window._settings.bind(
            'highlight-mode',
            dominantColourRadio,
            'active',
            Gio.SettingsBindFlags.INVERT_BOOLEAN|Gio.SettingsBindFlags.GET
        )

        window._settings.bind(
            'highlight-mode',
            highlightColourRadio,
            'active',
            Gio.SettingsBindFlags.GET
        )

        ////////////////////////////////////////////////////////////////////////

        // Debug page //////////////////////////////////////////////////////////

        const debugPage = new Adw.PreferencesPage({
            title: _('Debug'),
            icon_name: 'preferences-other-symbolic'
        })
        window.add(debugPage)

        const cacheGroup = new Adw.PreferencesGroup({
            title: _('Palette Cache'),
            description: _(
                'The colour palette of each background applied is cached to \
increase performance'
            )
        })
        debugPage.add(cacheGroup)

        const cache = fileBasedCache(getExtensionCacheDir());

        const viewCacheBtn = new Gtk.Button({
            valign: Gtk.Align.CENTER,
            label: _('View')
        })

        const cacheDir = Gio.File.new_for_path(getExtensionCacheDir())
        viewCacheBtn.connect('clicked', () => {
            Gio.AppInfo.launch_default_for_uri(cacheDir.get_uri(), null)
        })

        const clearCacheBtn = new Gtk.Button({
            valign: Gtk.Align.CENTER,
            label: _('Clear'),
            css_classes: ['destructive-action']
        })
        const cacheCountRow = new Adw.ActionRow({
            title: _('Files in Cache'),
            css_classes: ['property']
        });
        clearCacheBtn.connect('clicked', () => {
            cache.clear();
        })
        cacheCountRow.add_suffix(viewCacheBtn)
        cacheCountRow.add_suffix(clearCacheBtn);
        cacheGroup.add(cacheCountRow);

        const disableCacheRow = new Adw.SwitchRow({
            title: _('Disable Cache'),
            subtitle: _(
                "Always parse colours from the background, even if the palette \
for a given background is in the cache. Do not cache computed palettes."
            )
        })
        cacheGroup.add(disableCacheRow)

        const devToolsGroup = new Adw.PreferencesGroup({
            title: _('Developer Tools')
        })
        debugPage.add(devToolsGroup)

        const debugLoggingRow = new Adw.SwitchRow({
            title: _('Debug Logging'),
            subtitle: _('Print debug messages to the system journal')
        })
        devToolsGroup.add(debugLoggingRow)

        async function refreshDebugDetails() {
            const cachedCount = (await cache.keys()).length;
            cacheCountRow.subtitle = cachedCount.toString()
            viewCacheBtn.sensitive = cacheDir.query_exists(null)
            clearCacheBtn.sensitive = cachedCount > 0
        }

        refreshDebugDetails()

        this._cacheDirMonitor = cacheDir.monitor(
            Gio.FileMonitorFlags.WATCH_MOVES,
            null
        )
        this._cacheDirMonitor.connect(
            'changed',
            (_fileMonitor) => {
                refreshDebugDetails()
            }
        )

        window._settings.bind(
            'debug-logging',
            debugLoggingRow,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        )
        window._settings.bind(
            'disable-cache',
            disableCacheRow,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        )

        dominantColourRadio.connect('toggled', () => {
            const isActive = dominantColourRadio.get_active()
            settings.set_boolean('highlight-mode', !isActive)
        })

        // About page //////////////////////////////////////////////////////////

        const aboutPage = new Adw.PreferencesPage({
            title: _('About'),
            icon_name: 'help-about-symbolic'
        })
        window.add(aboutPage)

        const aboutGroup = new Adw.PreferencesGroup()
        aboutPage.add(aboutGroup)

        const title = new Gtk.Label({
            label: _('Auto Accent Colour'),
            css_classes: ['title-1']
        })
        aboutGroup.add(title)

        const author = new Gtk.Label({
            label: _('Created by %s and contributors').format('Wartybix')
        })
        aboutGroup.add(author)

        const versionNo = this.metadata.version || 0

        const versionLabel = new Gtk.Label({
            label: _('Version %d').format(versionNo),
            css_classes: ['title-4'],
            margin_top: 8
        })
        aboutGroup.add(versionLabel)

        const specialThanks = new Adw.PreferencesGroup({
            title: _('Special Thanks')
        })
        aboutPage.add(specialThanks)

        const lokeshRow = new Adw.ActionRow({
            title: 'Lokesh Dhakar',
            subtitle: _('For creating the ColorThief JavaScript module, used for extracting colours from the background image')
        })
        specialThanks.add(lokeshRow)

        const olivierlesnickiRow = new Adw.ActionRow({
            title: 'Olivier Lesnicki',
            subtitle: _('For creating the Quantize JavaScript module, used by ColorThief for colour quantization')
        })
        specialThanks.add(olivierlesnickiRow)

        const linksGroup = new Adw.PreferencesGroup({})
        aboutPage.add(linksGroup)

        const repoBtn = new Gtk.LinkButton({
            label: 'Codeberg',
            valign: Gtk.Align.CENTER,
            uri: 'https://codeberg.org/Wartybix/GNOME-Auto-Accent-Colour/'
        })

        const repoRow = new Adw.ActionRow({
            title: _('Project Repository'),
            activatable_widget: repoBtn
        })
        linksGroup.add(repoRow)
        repoRow.add_suffix(repoBtn)

        const repoIcon = getIcon('code-symbolic')
        repoRow.add_prefix(repoIcon)

        const issueBtn = new Gtk.LinkButton({
            label: 'Codeberg',
            valign: Gtk.Align.CENTER,
            uri: 'https://codeberg.org/Wartybix/GNOME-Auto-Accent-Colour/issues'
        })

        const issueRow = new Adw.ActionRow({
            title: _('Submit an Issue'),
            activatable_widget: issueBtn
        })
        linksGroup.add(issueRow)
        issueRow.add_suffix(issueBtn)

        const issueIcon = getIcon('bug-symbolic')
        issueRow.add_prefix(issueIcon)

        const contributorsBtn = new Gtk.LinkButton({
            label: 'Codeberg',
            valign: Gtk.Align.CENTER,
            uri: 'https://codeberg.org/Wartybix/GNOME-Auto-Accent-Colour/activity/contributors'
        })

        const contributorsRow = new Adw.ActionRow({
            title: _('Contributors'),
            activatable_widget: contributorsBtn
        })
        linksGroup.add(contributorsRow)
        contributorsRow.add_suffix(contributorsBtn)

        const contributorsIcon = Gtk.Image.new_from_icon_name(
            'system-users-symbolic'
        )
        contributorsRow.add_prefix(contributorsIcon)

        const licensesRow = new Adw.ExpanderRow({
            title: _('Licenses')
        })
        linksGroup.add(licensesRow)

        const licenseIcon = getIcon('license-symbolic')
        licensesRow.add_prefix(licenseIcon)

        const gplv3Btn = new Gtk.LinkButton({
            label: 'Codeberg',
            valign: Gtk.Align.CENTER,
            uri: 'https://codeberg.org/Wartybix/GNOME-Auto-Accent-Colour/src/branch/main/LICENSE'
        })

        const autoAccentColourRow = new Adw.ActionRow({
            title: _('Auto Accent Colour Extension'),
            subtitle: _('GNU General Public License v3.0'),
            activatable_widget: gplv3Btn,
            css_classes: ['property']
        })
        autoAccentColourRow.add_suffix(gplv3Btn)
        licensesRow.add_row(autoAccentColourRow)

        const colorThiefLicenseBtn = new Gtk.LinkButton({
            label: 'GitHub',
            valign: Gtk.Align.CENTER,
            uri: 'https://github.com/lokesh/color-thief/blob/master/LICENSE'
        })

        const colorThiefRow = new Adw.ActionRow({
            title: _('ColorThief Module'),
            subtitle: _('MIT License'),
            activatable_widget: colorThiefLicenseBtn,
            css_classes: ['property']
        })
        colorThiefRow.add_suffix(colorThiefLicenseBtn)
        licensesRow.add_row(colorThiefRow)

        const quantizeLicenseBtn = new Gtk.LinkButton({
            label: 'GitHub',
            valign: Gtk.Align.CENTER,
            uri: 'https://github.com/olivierlesnicki/quantize/blob/master/LICENSE'
        })

        const quantizeRow = new Adw.ActionRow({
            title: _('Quantize Module'),
            subtitle: _('MIT License'),
            activatable_widget: quantizeLicenseBtn,
            css_classes: ['property']
        })
        quantizeRow.add_suffix(quantizeLicenseBtn)
        licensesRow.add_row(quantizeRow)

        const pigeonsGroup = new Adw.PreferencesGroup()
        aboutPage.add(pigeonsGroup)

        const pigeonsText = new Gtk.Label({
            label: _('Be kind to your local pigeons!')
        })
        pigeonsGroup.add(pigeonsText)
    }
}

