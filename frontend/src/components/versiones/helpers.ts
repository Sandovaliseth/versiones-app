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
)=> {
  // Asunto usando exactamente los valores ingresados por el usuario
  const baseStr = `${formData.nombreVersionCliente || ''}${formData.versionBase || ''}`.trim();
  const aumentoStr = `${formData.nombreVersionCliente || ''}${formData.versionAumento || ''}`.trim();
  const versionStr = formData.checksumAumento ? aumentoStr : baseStr;
  const subject = `SOLICITUD DE FIRMA ${versionStr}_${formData.build || ''} ${formData.terminal || ''} | ${formData.cliente || ''}`.replace(/\s+/g, ' ').trim();

  // Checksums correctos
  const baseChecksum = md5Base || formData.checksumBase || '';
  const aumentoChecksum = md5Aumento || formData.checksumAumento || '';



  // Body HTML simple como en la imagen - sin estilos complejos
  let body = '<div style="font-family:Calibri;font-size:12pt;">';
  body += '<p>Cordial saludo,</p>';
  body += '<p>Espero que te encuentres muy bien. Mediante el presente, realizo la entrega formal de la versión <b>' + versionStr + '_' + (formData.build || '') + '</b> para su respectiva firma.</p>';
  body += '<p><b>Detalles:</b></p>';
  body += '<ul>';
  
  // VERSIÓN BASE
  body += '<li><b>VERSIÓN- ' + baseStr + '</b>';
  body += '<ul style="list-style-type:circle;">';
  body += '<li><b>Terminal:</b> ' + (formData.terminal || '') + '</li>';
  body += '<li><b>Tipo de firma:</b> ' + (formData.tipoFirma === 'personalizada' ? 'Personalizada' : 'Genérica') + '</li>';
  body += '<li><b>CID:</b> ' + (formData.cid || '0') + '</li>';
  body += '<li><b>Nombre del archivo:</b> ' + (formData.nombreArchivoBin || '') + '</li>';
  body += '<li><b>Checksum (MD5):</b> ' + baseChecksum + '</li>';
  body += '</ul></li>';
  
  // VERSIÓN DE AUMENTO (si existe)
  if (aumentoChecksum) {
    body += '<li><b>VERSIÓN DE AUMENTO- ' + aumentoStr + '</b>';
    body += '<ul style="list-style-type:circle;">';
    body += '<li><b>Terminal:</b> ' + (formData.terminal || '') + '</li>';
    body += '<li><b>Tipo de firma:</b> ' + (formData.tipoFirma === 'personalizada' ? 'Personalizada' : 'Genérica') + '</li>';
    body += '<li><b>CID:</b> ' + (formData.cid || '0') + '</li>';
    body += '<li><b>Nombre del archivo:</b> ' + (formData.nombreArchivoBin || '') + '</li>';
    body += '<li><b>Checksum (MD5):</b> ' + aumentoChecksum + '</li>';
    body += '</ul></li>';
  }
  
  body += '</ul>';
  body += '</div>';

  return { subject, body };
};
