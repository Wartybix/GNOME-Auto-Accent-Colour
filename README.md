# Auto Accent Colour
Automatically set the GNOME accent colour based on the user's background.

Note: GNOME Settings sometimes has an issue of it 'resetting' the accent colour when the Appearance page is open and the accent colour is changed externally. If this happens, navigate away from the Appearance page (or close the Settings window), and re-run the Auto Accent Colour script by clicking the 'Force Refresh' indicator option, disabling/re-enabling the extension, or locking and unlocking your device.

## Development
Get the source:
```
git clone https://github.com/Wartybix/GNOME-Auto-Accent-Colour
```

To install locally, run `install.sh`. For changes to apply, log out and back in again, or if on X11, restart GNOME shell by entering Alt+F2, then 'r'.
Alternatively, run `test.sh`, which will install the application and open it in an embedded GNOME shell -- this works on both Wayland and X11.