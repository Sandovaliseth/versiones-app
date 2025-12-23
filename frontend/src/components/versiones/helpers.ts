import { CrearVersionData } from './types';

export const getTodayYYMMDD = (): string => {
  const now = new Date();
  const yy = String(now.getFullYear() % 100).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
};

export const getTodayDDMMYY = (): string => {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear() % 100).padStart(2, '0');
  return `${dd}${mm}${yy}`;
};

export const crearCorreoHtml = (
  formData: CrearVersionData,
  md5Aumento?: string,
  _carpetaOneDrive?: string | null,
  md5Base?: string
) => {
  const baseStr = formData.esDemo
    ? 'DEMO'
    : `${formData.nombreVersionCliente || ''}${formData.versionBase || ''}`.trim();
  const aumentoStr = formData.esDemo
    ? ''
    : `${formData.nombreVersionCliente || ''}${formData.versionAumento || ''}`.trim();
  const versionStr = formData.checksumAumento && !formData.esDemo ? aumentoStr : baseStr;
  const demoTag = formData.esDemo ? ' DEMO' : '';
  const subject = `SOLICITUD DE FIRMA${demoTag} ${versionStr}_${formData.build || ''} ${formData.terminal || ''} | ${formData.cliente || ''}`.replace(/\s+/g, ' ').trim();

  const baseChecksum = md5Base || formData.checksumBase || '';
  const aumentoChecksum = md5Aumento || formData.checksumAumento || '';

  const baseStyle = 'font-family:Calibri Light,Calibri,Arial,sans-serif;font-size:12pt;line-height:1.6;';
  let body = '<html><body style="' + baseStyle + '">';
  body += '<div style="' + baseStyle + '">';
  body += '<p style="' + baseStyle + 'margin:0;">Cordial saludo,<br>Espero que te encuentres muy bien. Mediante el presente, realizo la entrega formal de la versión <b>' + versionStr + '_' + (formData.build || '') + '</b> para su respectiva firma.</p>';
  body += '<p style="' + baseStyle + 'margin:20px 0 6px 0;"><b>Detalles:</b></p>';
  body += '<ul style="' + baseStyle + 'margin:0;padding-left:20px;">';

  const versionLabel = formData.esDemo ? 'VERSI&Oacute;N &ndash; DEMO' : `VERSI&Oacute;N &ndash; ${baseStr}`;
  body += '<li style="' + baseStyle + 'margin:12px 0 6px 0;"><b>' + versionLabel + '</b>';
  body += '<ul style="' + baseStyle + 'margin:0;padding-left:20px;list-style-type:circle;">';
  body += '<li style="' + baseStyle + 'margin:2px 0;"><b>Terminal:</b> ' + (formData.terminal || '') + '</li>';
  body += '<li style="' + baseStyle + 'margin:2px 0;"><b>Tipo de firma:</b> ' + (formData.tipoFirma === 'personalizada' ? 'Personalizada' : 'Gen&eacute;rica') + '</li>';
  body += '<li style="' + baseStyle + 'margin:2px 0;"><b>CID:</b> ' + (formData.cid || '0') + '</li>';
  body += '<li style="' + baseStyle + 'margin:2px 0;"><b>Nombre del archivo:</b> ' + (formData.nombreArchivoBin || '') + '</li>';
  body += '<li style="' + baseStyle + 'margin:2px 0;"><b>Checksum (MD5):</b> ' + baseChecksum + '</li>';
  body += '</ul></li>';
  
  if (aumentoChecksum) {
    body += '<li style="' + baseStyle + 'margin:16px 0 6px 0;"><b>VERSI&Oacute;N DE AUMENTO - ' + aumentoStr + '</b>';
    body += '<ul style="' + baseStyle + 'margin:0;padding-left:20px;list-style-type:circle;">';
    body += '<li style="' + baseStyle + 'margin:2px 0;"><b>Terminal:</b> ' + (formData.terminal || '') + '</li>';
    body += '<li style="' + baseStyle + 'margin:2px 0;"><b>Tipo de firma:</b> ' + (formData.tipoFirma === 'personalizada' ? 'Personalizada' : 'Gen&eacute;rica') + '</li>';
    body += '<li style="' + baseStyle + 'margin:2px 0;"><b>CID:</b> ' + (formData.cid || '0') + '</li>';
    body += '<li style="' + baseStyle + 'margin:2px 0;"><b>Nombre del archivo:</b> ' + (formData.nombreArchivoBin || '') + '</li>';
    body += '<li style="' + baseStyle + 'margin:2px 0;"><b>Checksum (MD5):</b> ' + aumentoChecksum + '</li>';
    body += '</ul></li>';
  }
  
  body += '</ul></div></body></html>';

  return { subject, body };
};
