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
  const baseStr = `${formData.nombreVersionCliente || ''}${formData.versionBase || ''}`.trim();
  const aumentoStr = `${formData.nombreVersionCliente || ''}${formData.versionAumento || ''}`.trim();
  const versionStr = formData.checksumAumento ? aumentoStr : baseStr;
  const subject = `SOLICITUD DE FIRMA ${versionStr}_${formData.build || ''} ${formData.terminal || ''} | ${formData.cliente || ''}`.replace(/\s+/g, ' ').trim();

  const baseChecksum = md5Base || formData.checksumBase || '';
  const aumentoChecksum = md5Aumento || formData.checksumAumento || '';

  let body = '<div style="font-family:\"Calibri Light\",Calibri,Arial,sans-serif !important;font-size:12pt;line-height:1.6;">';
  body += '<p style="margin:0;">Cordial saludo,<br>Espero que te encuentres muy bien. Mediante el presente, realizo la entrega formal de la versión <b>' + versionStr + '_' + (formData.build || '') + '</b> para su respectiva firma.</p>';
  body += '<p style="margin:20px 0 4px 0;"><b>Detalles:</b></p>';
  body += '<ul style="margin:0;padding-left:20px;">';
  
  body += '<li style="margin:4px 0;"><b>VERSI&Oacute;N- ' + baseStr + '</b>';
  body += '<ul style="margin:0;padding-left:20px;list-style-type:circle;">';
  body += '<li style="margin:2px 0;"><b>Terminal:</b> ' + (formData.terminal || '') + '</li>';
  body += '<li style="margin:2px 0;"><b>Tipo de firma:</b> ' + (formData.tipoFirma === 'personalizada' ? 'Personalizada' : 'Gen&eacute;rica') + '</li>';
  body += '<li style="margin:2px 0;"><b>CID:</b> ' + (formData.cid || '0') + '</li>';
  body += '<li style="margin:2px 0;"><b>Nombre del archivo:</b> ' + (formData.nombreArchivoBin || '') + '</li>';
  body += '<li style="margin:2px 0;"><b>Checksum (MD5):</b> ' + baseChecksum + '</li>';
  body += '</ul></li>';
  
  if (aumentoChecksum) {
    body += '<li style="margin:20px 0 4px 0;"><b>VERSI&Oacute;N DE AUMENTO- ' + aumentoStr + '</b>';
    body += '<ul style="margin:0;padding-left:20px;list-style-type:circle;">';
    body += '<li style="margin:2px 0;"><b>Terminal:</b> ' + (formData.terminal || '') + '</li>';
    body += '<li style="margin:2px 0;"><b>Tipo de firma:</b> ' + (formData.tipoFirma === 'personalizada' ? 'Personalizada' : 'Gen&eacute;rica') + '</li>';
    body += '<li style="margin:2px 0;"><b>CID:</b> ' + (formData.cid || '0') + '</li>';
    body += '<li style="margin:2px 0;"><b>Nombre del archivo:</b> ' + (formData.nombreArchivoBin || '') + '</li>';
    body += '<li style="margin:2px 0;"><b>Checksum (MD5):</b> ' + aumentoChecksum + '</li>';
    body += '</ul></li>';
  }
  
  body += '</ul></div>';

  return { subject, body };
};
