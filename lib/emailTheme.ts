export const roseOutEmailTheme = {
  textColor: "#111",
  mutedTextColor: "#666",
  surfaceColor: "#f8f8f8",
  accentColor: "#111",
  fontFamily: "Arial,sans-serif",
  fontSize: "16px",
  lineHeight: "1.6",
};

export function roseOutEmail(content: string) {
  return `
    <div style="font-family:${roseOutEmailTheme.fontFamily};font-size:${roseOutEmailTheme.fontSize};line-height:${roseOutEmailTheme.lineHeight};color:${roseOutEmailTheme.textColor};">
      ${content}
    </div>
  `;
}

export function roseOutEmailCard(content: string) {
  return `
    <div style="background:${roseOutEmailTheme.surfaceColor};border-radius:16px;padding:16px;margin:18px 0;">
      ${content}
    </div>
  `;
}

export function roseOutEmailButton(label: string, href: string) {
  return `
    <p>
      <a href="${href}" style="display:inline-block;background:${roseOutEmailTheme.accentColor};color:#fff;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:bold;">
        ${label}
      </a>
    </p>
  `;
}
