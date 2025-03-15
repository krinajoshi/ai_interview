import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';

export type Language = 'en' | 'fr' | 'ar';

interface LanguageSelectorProps {
  value: Language;
  onChange: (lang: Language) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ value, onChange }) => {
  const handleChange = (event: SelectChangeEvent) => {
    onChange(event.target.value as Language);
  };

  return (
    <FormControl fullWidth>
      <InputLabel id="language-select-label">Interview Language</InputLabel>
      <Select
        labelId="language-select-label"
        id="language-select"
        value={value}
        label="Interview Language"
        onChange={handleChange}
      >
        <MenuItem value="en">English</MenuItem>
        <MenuItem value="fr">Français</MenuItem>
        <MenuItem value="ar">العربية</MenuItem>
      </Select>
    </FormControl>
  );
};

export default LanguageSelector; 