// 60 / 30 / 10: charcoal canvas, white reading surfaces, orange interaction.
export const color = {
  bg: "#101112",
  surface: "#1B1D20",
  raised: "#25272B",
  ink: "#101112",
  white: "#FAFAF7",
  muted: "#A5A8AF",
  line: "#303238",
  orange: "#FF813A",
  orangeSoft: "#FFE8D8",
  warning: "#87350B",
  paperLine: "#DFE1DD",
  paperMuted: "#555C63",
};
export const money = (amount: number) =>
  `R ${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
