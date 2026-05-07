export const roseOutEmailTheme = {
  textColor: "#111",
  mutedTextColor: "#666",
  surfaceColor: "#f8f8f8",
  accentColor: "#111",
  fontFamily: "Arial,sans-serif",
  fontSize: "16px",
  lineHeight: "1.6",
};

const roseOutEmailMarker = 'data-roseout-email="true"';

export function roseOutEmail(content: string) {
  if (content.includes(roseOutEmailMarker)) {
    return content;
  }

  return `
    <div ${roseOutEmailMarker} style="font-family:${roseOutEmailTheme.fontFamily};font-size:${roseOutEmailTheme.fontSize};line-height:${roseOutEmailTheme.lineHeight};color:${roseOutEmailTheme.textColor};">
      ${content}
    </div>
  `;
}

export function roseOutEmailCard(content: string) {
  return `
    <div style="background:${roseOutEmailTheme.surfaceColor};border-radius:16px;padding:16px;margin:18px 0;color:${roseOutEmailTheme.textColor};font-size:${roseOutEmailTheme.fontSize};line-height:${roseOutEmailTheme.lineHeight};">
      ${content}
    </div>
  `;
}

export function roseOutEmailButton(label: string, href: string) {
  return `
    <p>
      <a href="${href}" style="display:inline-block;background:${roseOutEmailTheme.accentColor};color:#fff;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:bold;font-size:${roseOutEmailTheme.fontSize};line-height:1.2;">
        ${label}
      </a>
    </p>
  `;
}
