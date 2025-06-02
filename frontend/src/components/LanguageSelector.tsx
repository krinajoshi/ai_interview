import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';

export type Language = 'en' | 'fr' | 'ar';

interface LanguageSelectorProps {
  value: Language;
  onChange: (language: Language) => void;
  label?: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  value, 
  onChange,
  label = "Language"
}) => {
  const handleChange = (event: SelectChangeEvent) => {
    onChange(event.target.value as Language);
  };

  return (
    <FormControl fullWidth>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        label={label}
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