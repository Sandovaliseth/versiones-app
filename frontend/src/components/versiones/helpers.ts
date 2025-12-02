import { CrearVersionData } from './types';

export const getTodayYYMMDD = (): string => {
  const now = new Date();
  const yy = String(now.getFullYear() % 100).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
};

export const crearCorreoHtml = (
  formData: CrearVersionData,
  md5Aumento?: string,
  _carpetaOneDrive?: string | null,
  md5Base?: string
) => {
  // Formato: SOLICITUD DE FIRMA ENLACEAV2.0.0_251201 NEW6260 | ATC
  const versionCompleta = `${formData.nombreVersionCliente || ''}${formData.versionBase || ''}.${(formData.versionAumento || formData.versionBase || '').split('.').pop() || '0'}`;
  const subject = `SOLICITUD DE FIRMA ${versionCompleta}_${formData.build || ''} ${formData.terminal || ''} | ${formData.cliente || ''}`.replace(/\s+/g, ' ').trim();

  // Checksums correctos
  const baseChecksum = md5Base || formData.checksumBase || '';
  const aumentoChecksum = md5Aumento || formData.checksumAumento || '';

  // Body HTML con formato de la imagen 4
  const lines: string[] = [];
  lines.push('<div style="font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #000;">');
  lines.push('<p style="margin: 0 0 10px 0;">Cordial saludo,</p>');
  lines.push(`<p style="margin: 0 0 10px 0;">Espero que te encuentres muy bien. Mediante el presente, realizo la entrega formal de la versión <strong>${formData.nombreVersionCliente || ''}${formData.versionBase || ''}.0_${formData.build || ''}</strong> para su respectiva firma.</p>`);
  lines.push('<p style="margin: 0;"></p>');
  lines.push('<p style="margin: 0 0 5px 0;"><strong>Detalles:</strong></p>');
  lines.push('<ul style="margin: 0 0 10px 0; padding-left: 20px;">');
  
  // VERSIÓN BASE
  lines.push(`<li style="margin: 0 0 5px 0;"><strong>VERSIÓN - ${formData.nombreVersionCliente || ''}${formData.versionBase || ''}</strong></li>`);
  lines.push('<ul style="margin: 0 0 10px 0; padding-left: 20px; list-style-type: circle;">');
  lines.push(`<li><strong>Terminal:</strong> ${formData.terminal || ''}</li>`);
  lines.push(`<li><strong>Tipo de firma:</strong> ${formData.tipoFirma === 'personalizada' ? 'Personalizada' : 'Genérica'}</li>`);
  lines.push(`<li><strong>CID:</strong> ${formData.cid || '0'}</li>`);
  lines.push(`<li><strong>Nombre del archivo:</strong> ${formData.nombreArchivoBin || ''}</li>`);
  lines.push(`<li><strong>Checksum (MD5):</strong> ${baseChecksum}</li>`);
  lines.push('</ul>');
  
  // VERSIÓN DE AUMENTO (si existe)
  if (aumentoChecksum) {
    lines.push(`<li style="margin: 0 0 5px 0;"><strong>VERSIÓN DE AUMENTO - ${formData.nombreVersionCliente || ''}${formData.versionAumento || ''}</strong></li>`);
    lines.push('<ul style="margin: 0 0 10px 0; padding-left: 20px; list-style-type: circle;">');
    lines.push(`<li><strong>Terminal:</strong> ${formData.terminal || ''}</li>`);
    lines.push(`<li><strong>Tipo de firma:</strong> ${formData.tipoFirma === 'personalizada' ? 'Personalizada' : 'Genérica'}</li>`);
    lines.push(`<li><strong>CID:</strong> ${formData.cid || '0'}</li>`);
    lines.push(`<li><strong>Nombre del archivo:</strong> ${formData.nombreArchivoBin || ''}</li>`);
    lines.push(`<li><strong>Checksum (MD5):</strong> ${aumentoChecksum}</li>`);
    lines.push('</ul>');
  }
  
  lines.push('</ul>');
  lines.push('</div>');

  const body = lines.join('');
  return { subject, body };
};
