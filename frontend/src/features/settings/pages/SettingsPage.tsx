import { useEffect, useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import {
  CURRENCY_OPTIONS,
  LOCALE_OPTIONS,
  TIMEZONES,
} from "@/features/settings/constants/settings.options";

import { useSettingsContext } from "@/features/settings/context/SettingsContext";

import type { TimezoneId } from "@workpulse/shared";

export default function SettingsPage() {
  const { settings, loading, saving, save } = useSettingsContext();

  const [timezone, setTimezone] = useState<TimezoneId>("Asia/Manila");
  const [locale, setLocale] = useState("");
  const [currency, setCurrency] = useState("");

  useEffect(() => {
    if (!settings) {
      return;
    }

    setTimezone(settings.timezone);
    setLocale(settings.locale);
    setCurrency(settings.currency);
  }, [settings]);

  async function handleSave() {
    await save({
      timezone,
      locale,
      currency,
    });
  }

  if (loading) {
    return <Typography>Loading settings...</Typography>;
  }

  return (
    <Box sx={{ maxWidth: 500 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Workspace Settings
      </Typography>

      <TextField
        select
        fullWidth
        label="Timezone"
        value={timezone}
        onChange={(event) => {
          setTimezone(event.target.value as TimezoneId);
        }}
        margin="normal"
      >
        {TIMEZONES.map((timezoneOption) => (
          <MenuItem key={timezoneOption.id} value={timezoneOption.id}>
            {timezoneOption.label}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        fullWidth
        label="Locale"
        value={locale}
        onChange={(event) => {
          setLocale(event.target.value);
        }}
        margin="normal"
      >
        {LOCALE_OPTIONS.map((localeOption) => (
          <MenuItem key={localeOption} value={localeOption}>
            {localeOption}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        select
        fullWidth
        label="Currency"
        value={currency}
        onChange={(event) => {
          setCurrency(event.target.value);
        }}
        margin="normal"
      >
        {CURRENCY_OPTIONS.map((currencyOption) => (
          <MenuItem key={currencyOption} value={currencyOption}>
            {currencyOption}
          </MenuItem>
        ))}
      </TextField>

      <Button
        sx={{ mt: 2 }}
        variant="contained"
        disabled={saving}
        onClick={() => {
          void handleSave();
        }}
      >
        {saving ? "Saving..." : "Save Settings"}
      </Button>
    </Box>
  );
}
