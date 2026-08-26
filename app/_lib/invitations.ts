const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 5;

export const INVITATION_TTL_DAYS = 7;

export type RelationUi = "Mamá" | "Papá" | "Tutor/a";

export const RELATION_TO_DB = {
  "Mamá": "mother",
  "Papá": "father",
  "Tutor/a": "guardian",
} as const;

export function generateInvitationCode(length = CODE_LENGTH): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

export function buildInvitationEmail({
  parentName,
  childName,
  code,
  activationUrl,
}: {
  parentName: string;
  childName: string;
  code: string;
  activationUrl: string;
}): { subject: string; html: string } {
  const subject = "Invitación a OpenDayCare";

  const html = `<!DOCTYPE html>
<html lang="es">
  <body style="margin:0;padding:0;background-color:#F6ECDF;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F6ECDF;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#FFFDF9;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 24px;">
                <h1 style="margin:0 0 8px;color:#3F362E;font-size:22px;font-weight:700;">OpenDayCare</h1>
                <p style="margin:0 0 4px;color:#4A4038;font-size:16px;line-height:1.5;">
                  Hola <strong>${escapeHtml(parentName)}</strong>,
                </p>
                <p style="margin:0 0 24px;color:#4A4038;font-size:16px;line-height:1.5;">
                  Te invitamos a formar parte de OpenDayCare para seguir el día a día de
                  <strong>${escapeHtml(childName)}</strong> en la guardería.
                </p>
                <p style="margin:0 0 8px;color:#6E6359;font-size:14px;">Tu código de activación:</p>
                <p style="margin:0 0 24px;color:#D9583C;font-size:34px;font-weight:700;letter-spacing:7px;text-align:center;">
                  ${escapeHtml(code)}
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center">
                      <a href="${escapeHtml(activationUrl)}"
                         style="display:inline-block;background-color:#D9583C;color:#FFFFFF;font-size:16px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:10px;">
                        Activar mi cuenta
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 0;color:#94887B;font-size:13px;line-height:1.5;">
                  Este código vence en 7 días. Si no esperabas esta invitación, podés ignorar este correo.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
